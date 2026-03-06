import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import type { Decimal } from "@prisma/client/runtime/library";
import { env } from "../config/env.js";
import { OrderConfirmationEmail } from "./email-template.js";

interface OrderItem {
  productName: string;
  quantity: number;
  productPrice: Decimal;
  engravingText?: string | null;
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

export async function sendOrderConfirmationEmail(order: OrderForEmail): Promise<void> {
  if (!env.emailEnabled) {
    // eslint-disable-next-line no-console
    console.log("[EMAIL] disabled (EMAIL_ENABLED != 'true') — skipping for order", order.id);
    return;
  }
  if (!env.resendApiKey) {
    // eslint-disable-next-line no-console
    console.warn("[EMAIL] RESEND_API_KEY not configured — skipping order confirmation email");
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
      engravingText: item.engravingText ?? null,
      imageUrl: item.product?.imageUrl ?? null
    })),
    address: order.address ?? null
  };

  try {
    const html = await render(React.createElement(OrderConfirmationEmail, templateData));
    const resend = new Resend(env.resendApiKey);
    const { error } = await resend.emails.send({
      from: env.emailFrom,
      to: toEmail,
      subject: `¡Pedido confirmado! #${shortId}`,
      html
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[EMAIL] Resend error:", error);
    } else {
      // eslint-disable-next-line no-console
      console.log("[EMAIL] Order confirmation sent to", toEmail, "for order", order.id);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[EMAIL] Failed to send order confirmation:", error);
  }
}
