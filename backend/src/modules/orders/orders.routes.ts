import { Router } from "express";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { orderSchema, type CreateOrderInput } from "./orders.schema.js";
import { createPreference } from "../payments/mercadopago.js";
import { verifyAccessToken } from "../../lib/auth.js";

export const ordersRouter = Router();

ordersRouter.post("/", validateBody(orderSchema), async (req, res) => {
  const payload = req.body as CreateOrderInput;
  const productIds = payload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true }
  });

  if (products.length !== productIds.length) {
    res.status(400).json({ message: "One or more products are unavailable" });
    return;
  }

  const productsById = new Map(products.map((p) => [p.id, p]));
  let total = 0;
  for (const item of payload.items) {
    const product = productsById.get(item.productId)!;
    if (item.quantity > product.stock) {
      res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      return;
    }
    total += Number(product.price) * item.quantity;
  }
  const shippingCost = Number(payload.shippingCost ?? 0);
  const mpCommission = Number(payload.mpCommission ?? 0);
  total += shippingCost + mpCommission;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of payload.items) {
      const product = productsById.get(item.productId)!;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity }
      });
    }

    const address = await tx.address.create({
      data: {
        ...payload.address,
        userId: req.auth?.userId
      }
    });

    const createdOrder = await tx.order.create({
      data: {
        userId: req.auth?.userId,
        guestEmail: payload.guestEmail,
        addressId: address.id,
        total: new Prisma.Decimal(total.toFixed(2)),
        items: {
          create: payload.items.map((item) => {
            const product = productsById.get(item.productId)!;
            return {
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              quantity: item.quantity
            };
          })
        }
      },
      include: { items: true }
    });

    return createdOrder;
  });

  const externalReference = `order_${order.id}`;
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: new Prisma.Decimal(total.toFixed(2)),
      externalReference
    }
  });

  const requestHost = `${req.protocol}://${req.get("host")}`;
  const webhookBaseUrl = env.backendPublicUrl || requestHost;
  const requestOrigin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const frontendBaseUrl = requestOrigin || env.frontendOrigin;

  try {
    const preferenceItems = order.items.map((item) => ({
      title: item.productName,
      quantity: item.quantity,
      unit_price: Number(item.productPrice),
      currency_id: "PEN" as const
    }));
    if (shippingCost > 0) {
      preferenceItems.push({
        title: "Envío",
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "PEN" as const
      });
    }
    if (mpCommission > 0) {
      preferenceItems.push({
        title: "Comisión Mercado Pago",
        quantity: 1,
        unit_price: Math.round(mpCommission * 100) / 100,
        currency_id: "PEN" as const
      });
    }
    const preference = await createPreference({
      externalReference,
      notificationUrl: `${webhookBaseUrl}/api/payments/webhook`,
      payerEmail: payload.guestEmail,
      items: preferenceItems,
      successUrl: `${frontendBaseUrl}/checkout/success`,
      failureUrl: `${frontendBaseUrl}/checkout/failure`,
      pendingUrl: `${frontendBaseUrl}/checkout/pending`
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id }
    });

    res.status(201).json({
      orderId: order.id,
      payment: {
        id: payment.id,
        preferenceId: preference.id,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint
      }
    });
  } catch (error) {
    res.status(502).json({
      message: "Could not create Mercado Pago preference",
      detail: error instanceof Error ? error.message : "Unknown payment error"
    });
  }
});

ordersRouter.get("/my", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.auth!.userId },
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(orders);
});

ordersRouter.get("/:id/confirmation", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      payments: true,
      address: true,
      user: { select: { id: true, email: true, fullName: true } }
    }
  });

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  let tokenUserId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(authHeader.replace("Bearer ", ""));
      tokenUserId = payload.userId;
    } catch {
      tokenUserId = null;
    }
  }

  const emailQuery = String(req.query.email ?? "")
    .trim()
    .toLowerCase();

  const userAllowed = Boolean(tokenUserId && order.userId && tokenUserId === order.userId);
  const guestAllowed = Boolean(order.guestEmail && emailQuery && order.guestEmail.toLowerCase() === emailQuery);

  if (!userAllowed && !guestAllowed) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.json({
    id: order.id,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    guestEmail: order.guestEmail,
    user: order.user,
    address: order.address,
    items: order.items,
    payments: order.payments
  });
});

ordersRouter.get("/", requireAuth, requireRole(UserRole.ADMIN), async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      payments: true,
      user: { select: { id: true, email: true, fullName: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  res.json(orders);
});

ordersRouter.patch("/:id/status", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  const { status } = req.body as { status?: "PENDING" | "PAID" | "CANCELLED" | "SHIPPED" };
  if (!status) {
    res.status(400).json({ message: "Status is required" });
    return;
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(order);
});
