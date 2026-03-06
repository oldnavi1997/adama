import * as React from "react";
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { Decimal } from "@prisma/client/runtime/library";

export interface OrderItemData {
  productName: string;
  quantity: number;
  productPrice: Decimal;
  imageUrl?: string | null;
  engravingText?: string | null;
}

export interface AddressData {
  fullName: string;
  street: string;
  district?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderEmailData {
  id: string;
  total: Decimal;
  shippingCost: Decimal;
  items: OrderItemData[];
  address?: AddressData | null;
  recipientName?: string | null;
}

const LOGO_URL =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

function formatPEN(value: Decimal | number): string {
  return Number(value).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

export function OrderConfirmationEmail({ id, total, shippingCost, items, address, recipientName }: OrderEmailData) {
  const shortId = id.slice(-8).toUpperCase();
  const subtotal = Number(total) - Number(shippingCost);
  const freeShipping = Number(shippingCost) === 0;
  const greeting = recipientName ? `Hola, ${recipientName.split(" ")[0]}` : "Hola";

  return (
    <Html lang="es">
      <Head />
      <Preview>¡Tu pedido #{shortId} fue confirmado! Gracias por comprar en Adamantio.</Preview>
      <Tailwind>
        <Body className="bg-[#f0f0f0] font-sans m-0 p-0">
          {/* Outer wrapper */}
          <Container className="max-w-[600px] mx-auto my-8">

            {/* ── HEADER CARD ── */}
            <Section className="bg-[#F0F0F0] rounded-t-xl px-8 py-6 text-center">
              <Img
                src={LOGO_URL}
                alt="Adamantio"
                width={180}
                height={53}
                className="mx-auto"
              />
            </Section>

            {/* ── HERO CARD ── */}
            <Section className="bg-white px-8 py-8 text-center border-b border-[#eeeeee]">
              <Text className="text-[13px] font-semibold uppercase tracking-[3px] text-[#888888] m-0 mb-2">
                Pedido confirmado
              </Text>
              <Heading className="text-[#111111] text-[36px] font-bold m-0 mb-1">
                ¡Pago aprobado!
              </Heading>
              <Text className="text-[#555555] text-[15px] m-0 mt-2">
                {greeting} — tu pedido está en camino.
              </Text>

              {/* Order number badge */}
              <Section className="mt-6">
                <div
                  style={{
                    display: "inline-block",
                    background: "#111111",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px 28px"
                  }}
                >
                  <Text className="m-0 text-[11px] uppercase tracking-[2px] text-[#aaaaaa]">
                    Número de pedido
                  </Text>
                  <Text className="m-0 text-[22px] font-bold tracking-[4px] text-white">
                    #{shortId}
                  </Text>
                </div>
              </Section>
            </Section>

            {/* ── ITEMS CARD ── */}
            <Section className="bg-white px-8 py-6 mt-2 rounded-none">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-[#888888] m-0 mb-4">
                Resumen del pedido
              </Text>

              {items.map((item, i) => (
                <Row key={i} className="mb-4">
                  {/* Product image */}
                  <Column className="w-[64px] pr-4" align="left">
                    {item.imageUrl ? (
                      <Img
                        src={item.imageUrl}
                        alt={item.productName}
                        width={60}
                        height={60}
                        style={{ borderRadius: "6px", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          background: "#f4f4f4",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Text className="m-0 text-[#cccccc] text-[10px]">IMG</Text>
                      </div>
                    )}
                  </Column>

                  {/* Product info */}
                  <Column align="left">
                    <Text className="m-0 text-[14px] font-semibold text-[#111111] leading-tight">
                      {item.productName}
                    </Text>
                    <Text className="m-0 text-[13px] text-[#888888] mt-1">
                      Cant.: {item.quantity} × {formatPEN(item.productPrice)}
                    </Text>
                    {item.engravingText && (
                      <Text className="m-0 text-[12px] text-[#666666] mt-1">
                        Grabado: &quot;{item.engravingText}&quot;
                      </Text>
                    )}
                  </Column>

                  {/* Line total */}
                  <Column align="right" className="w-[90px]">
                    <Text className="m-0 text-[14px] font-semibold text-[#111111]">
                      {formatPEN(Number(item.productPrice) * item.quantity)}
                    </Text>
                  </Column>
                </Row>
              ))}

              <Hr className="border-[#eeeeee] my-4" />

              {/* Totals */}
              <Row className="mb-1">
                <Column><Text className="m-0 text-[13px] text-[#888888]">Subtotal</Text></Column>
                <Column align="right"><Text className="m-0 text-[13px] text-[#333333]">{formatPEN(subtotal)}</Text></Column>
              </Row>
              <Row className="mb-2">
                <Column><Text className="m-0 text-[13px] text-[#888888]">Envío</Text></Column>
                <Column align="right">
                  <Text className="m-0 text-[13px] text-[#333333]">
                    {freeShipping ? "Gratis" : formatPEN(shippingCost)}
                  </Text>
                </Column>
              </Row>
              <Hr className="border-[#222222] my-2" />
              <Row>
                <Column>
                  <Text className="m-0 text-[16px] font-bold text-[#111111]">Total</Text>
                </Column>
                <Column align="right">
                  <Text className="m-0 text-[18px] font-bold text-[#111111]">{formatPEN(total)}</Text>
                </Column>
              </Row>
            </Section>

            {/* ── ADDRESS CARD ── */}
            {address && (
              <Section className="bg-white px-8 py-6 mt-2">
                <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-[#888888] m-0 mb-3">
                  Dirección de entrega
                </Text>
                <div style={{ background: "#f7f7f7", borderRadius: 8, padding: "14px 18px" }}>
                  <Text className="m-0 text-[14px] font-semibold text-[#111111]">{address.fullName}</Text>
                  <Text className="m-0 text-[13px] text-[#555555] mt-1">
                    {address.street}{address.district ? `, ${address.district}` : ""}
                  </Text>
                  <Text className="m-0 text-[13px] text-[#555555]">
                    {address.city}, {address.state} {address.postalCode}
                  </Text>
                  <Text className="m-0 text-[13px] text-[#555555]">{address.country}</Text>
                </div>
              </Section>
            )}

            {/* ── FOOTER CARD ── */}
            <Section className="bg-[#111111] rounded-b-xl px-8 py-6 text-center mt-2">
              <Text className="m-0 text-[13px] text-[#aaaaaa]">
                Gracias por tu compra en <span style={{ color: "#ffffff", fontWeight: 600 }}>Adamantio</span>.
              </Text>
              <Text className="m-0 text-[12px] text-[#666666] mt-2">
                ¿Preguntas? Respondé este correo y te ayudamos.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
