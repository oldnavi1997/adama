import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import * as React from "react";
import type { Decimal } from "@prisma/client/runtime/library";
import { env } from "../config/env.js";
import { OrderConfirmationEmail } from "./email-template.js";

interface OrderItem {
  productName: string;
  quantity: number;
  productPrice: Decimal;
  product?: { imageUrl?: string | null } | null;
}

interface Address {
  fullName: string;
  street: string;
  district?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface User {
  email: string;
  name?: string | null;
}

interface OrderForEmail {
  id: string;
  total: Decimal;
  shippingCost: Decimal;
  items: OrderItem[];
  address?: Address | null;
  user?: User | null;
  guestEmail?: string | null;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export async function sendOrderConfirmationEmail(order: OrderForEmail): Promise<void> {
  if (!env.emailEnabled) return;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    // eslint-disable-next-line no-console
    console.warn("[EMAIL] SMTP not configured — skipping order confirmation email");
    return;
  }

  const toEmail = order.user?.email ?? order.guestEmail;
  if (!toEmail) {
    // eslint-disable-next-line no-console
    console.warn("[EMAIL] No recipient email for order", order.id);
    return;
  }

  const shortId = order.id.slice(-8).toUpperCase();

  const templateData = {
    id: order.id,
    total: order.total,
    shippingCost: order.shippingCost,
    recipientName: order.user?.name ?? null,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      productPrice: item.productPrice,
      imageUrl: item.product?.imageUrl ?? null
    })),
    address: order.address ?? null
  };

  try {
    const html = await render(React.createElement(OrderConfirmationEmail, templateData));
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtpFrom,
      to: toEmail,
      subject: `¡Pedido confirmado! #${shortId}`,
      html
    });
    // eslint-disable-next-line no-console
    console.log("[EMAIL] Order confirmation sent to", toEmail, "for order", order.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[EMAIL] Failed to send order confirmation:", error);
  }
}
