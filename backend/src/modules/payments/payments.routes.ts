import { Router, type Request } from "express";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { getPaymentById, processPayment } from "./mercadopago.js";
import { redisSetNxEx } from "../../lib/redis.js";

export const paymentsRouter = Router();

function mapPaymentStatus(status: string): PaymentStatus {
  if (status === "approved") return PaymentStatus.APPROVED;
  if (status === "cancelled") return PaymentStatus.CANCELLED;
  if (status === "rejected") return PaymentStatus.REJECTED;
  return PaymentStatus.PENDING;
}

function parseSignatureHeader(signatureHeader: string): { ts: string; v1: string } | null {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.replace("ts=", "");
  const v1 = parts.find((part) => part.startsWith("v1="))?.replace("v1=", "");
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf-8");
  const bBuffer = Buffer.from(b, "utf-8");
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyWebhookSignature(req: Request): boolean {
  if (!env.mpWebhookSecret) {
    return true;
  }

  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  if (typeof signatureHeader !== "string" || typeof requestId !== "string") {
    return false;
  }

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const queryDataId = req.query["data.id"];
  const event = req.body as { data?: { id?: string | number } };
  const dataId = typeof queryDataId === "string" ? queryDataId : String(event.data?.id ?? "");
  if (!dataId) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parsed.ts};`;
  const expected = crypto.createHmac("sha256", env.mpWebhookSecret).update(manifest).digest("hex");
  return secureCompare(expected, parsed.v1);
}

paymentsRouter.post("/process", async (req, res) => {
  try {
    const { orderId, formData } = req.body as { orderId?: string; formData?: Record<string, unknown> };

    if (!orderId || !formData) {
      res.status(400).json({ message: "orderId and formData are required" });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" }
    });

    if (!payment) {
      res.status(404).json({ message: "Payment record not found for this order" });
      return;
    }

    if (payment.status !== "PENDING") {
      res.status(409).json({ message: "Payment already processed", status: payment.status });
      return;
    }

    if (env.skipPayment) {
      const fakePaymentId = Date.now();
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          mpPaymentId: String(fakePaymentId),
          status: PaymentStatus.APPROVED,
          rawPayload: { dev_skip: true }
        }
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });
      res.json({ status: "approved", status_detail: "dev_skip", payment_id: fakePaymentId });
      return;
    }

    const idempotencyKey = `process:${payment.externalReference}:${crypto.randomUUID()}`;

    const webhookUrl = env.backendPublicUrl ? `${env.backendPublicUrl}/api/payments/webhook` : "";
    const isPublicUrl = webhookUrl.startsWith("https://") || (webhookUrl.startsWith("http://") && !webhookUrl.includes("localhost"));

    const mpPayload = {
      ...formData,
      external_reference: payment.externalReference,
      ...(isPublicUrl ? { notification_url: webhookUrl } : {})
    } as Parameters<typeof processPayment>[0];

    const result = await processPayment(mpPayload, idempotencyKey);

    const mappedStatus = mapPaymentStatus(result.status);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId: String(result.id),
        status: mappedStatus,
        rawPayload: JSON.parse(JSON.stringify(result))
      }
    });

    if (mappedStatus === PaymentStatus.APPROVED) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });
    }

    res.json({
      status: result.status,
      status_detail: result.status_detail,
      payment_id: result.id
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Payment processing error:", error);
    res.status(502).json({
      message: "Payment processing failed",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

paymentsRouter.post("/webhook", async (req, res) => {
  try {
    if (env.logWebhookEvents) {
      // eslint-disable-next-line no-console
      console.log("[WEBHOOK] incoming", {
        query: req.query,
        xRequestId: req.headers["x-request-id"],
        xSignature: req.headers["x-signature"],
        body: req.body
      });
    }

    if (!verifyWebhookSignature(req)) {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] rejected invalid signature");
      }
      res.status(401).json({ message: "Invalid webhook signature" });
      return;
    }

    const event = req.body as { data?: { id?: string | number }; type?: string; action?: string };
    const maybePaymentId = event?.data?.id;
    const requestId = String(req.headers["x-request-id"] ?? "");

    if (!maybePaymentId || event.type !== "payment") {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] ignored non-payment event", { type: event.type, action: event.action, dataId: maybePaymentId });
      }
      res.status(200).json({ received: true });
      return;
    }

    const eventKey = `idem:webhook:mp:${String(maybePaymentId)}:${requestId}`;
    const accepted = await redisSetNxEx(eventKey, "1", 60 * 60 * 6);
    if (!accepted) {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] deduplicated by redis key", { key: eventKey });
      }
      res.status(200).json({ idempotent: true });
      return;
    }

    const paymentInfo = await getPaymentById(String(maybePaymentId));

    const payment = await prisma.payment.findFirst({ where: { mpPaymentId: String(paymentInfo.id) } });

    if (payment) {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] idempotent payment", { mpPaymentId: paymentInfo.id });
      }
      res.status(200).json({ idempotent: true });
      return;
    }

    if (!paymentInfo.external_reference) {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] ignored payment without external_reference", { mpPaymentId: paymentInfo.id });
      }
      res.status(200).json({ ignored: true });
      return;
    }

    const referencePayment = await prisma.payment.findUnique({
      where: { externalReference: paymentInfo.external_reference }
    });

    if (!referencePayment) {
      if (env.logWebhookEvents) {
        // eslint-disable-next-line no-console
        console.log("[WEBHOOK] ignored unknown external_reference", { externalReference: paymentInfo.external_reference });
      }
      res.status(200).json({ ignored: true });
      return;
    }

    const mappedStatus = mapPaymentStatus(paymentInfo.status);
    await prisma.payment.update({
      where: { id: referencePayment.id },
      data: {
        mpPaymentId: String(paymentInfo.id),
        status: mappedStatus,
        rawPayload: req.body
      }
    });

    if (mappedStatus === PaymentStatus.APPROVED) {
      await prisma.order.update({
        where: { id: referencePayment.orderId },
        data: { status: "PAID" }
      });
    }

    if (env.logWebhookEvents) {
      // eslint-disable-next-line no-console
      console.log("[WEBHOOK] processed", {
        orderId: referencePayment.orderId,
        mpPaymentId: paymentInfo.id,
        status: mappedStatus
      });
    }
    res.status(200).json({ processed: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});
