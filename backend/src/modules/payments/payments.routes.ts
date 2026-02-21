import { Router, type Request } from "express";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { getPaymentById } from "./mercadopago.js";

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

paymentsRouter.post("/webhook", async (req, res) => {
  try {
    if (!verifyWebhookSignature(req)) {
      res.status(401).json({ message: "Invalid webhook signature" });
      return;
    }

    const event = req.body as { data?: { id?: string | number }; type?: string; action?: string };
    const maybePaymentId = event?.data?.id;

    if (!maybePaymentId || event.type !== "payment") {
      res.status(200).json({ received: true });
      return;
    }

    const paymentInfo = await getPaymentById(String(maybePaymentId));

    const payment = await prisma.payment.findFirst({ where: { mpPaymentId: String(paymentInfo.id) } });

    if (payment) {
      res.status(200).json({ idempotent: true });
      return;
    }

    if (!paymentInfo.external_reference) {
      res.status(200).json({ ignored: true });
      return;
    }

    const referencePayment = await prisma.payment.findUnique({
      where: { externalReference: paymentInfo.external_reference }
    });

    if (!referencePayment) {
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

    res.status(200).json({ processed: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});
