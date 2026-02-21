import { env } from "../../config/env.js";

type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
};

export async function createPreference(input: {
  externalReference: string;
  items: PreferenceItem[];
  notificationUrl: string;
  payerEmail?: string;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}): Promise<{ id: string; initPoint: string; sandboxInitPoint: string }> {
  if (!env.mpAccessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is required to create preferences");
  }

  const successUrl = input.successUrl || `${env.frontendOrigin}/checkout/success`;
  const failureUrl = input.failureUrl || `${env.frontendOrigin}/checkout/failure`;
  const pendingUrl = input.pendingUrl || `${env.frontendOrigin}/checkout/pending`;

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mpAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: input.externalReference,
      items: input.items,
      notification_url: input.notificationUrl,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago preference error: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { id: string; init_point: string; sandbox_init_point: string };
  return { id: data.id, initPoint: data.init_point, sandboxInitPoint: data.sandbox_init_point };
}

export async function getPaymentById(paymentId: string): Promise<{ id: number; status: string; external_reference?: string }> {
  if (!env.mpAccessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is required to query payments");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${env.mpAccessToken}` }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago payment error: ${response.status} ${body}`);
  }

  return (await response.json()) as { id: number; status: string; external_reference?: string };
}
