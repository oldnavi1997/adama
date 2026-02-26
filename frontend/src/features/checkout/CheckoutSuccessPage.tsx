import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { initMercadoPago, StatusScreen } from "@mercadopago/sdk-react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string;

type OrderSummary = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "SHIPPED";
  total: string;
  shippingCost: string;
  mpCommission: string;
  createdAt: string;
  guestEmail?: string | null;
  user?: { id: string; email: string; fullName: string } | null;
  address?: {
    fullName: string;
    phone: string;
    documentType: string;
    documentNumber: string;
    street: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    productPrice: string;
    imageUrl?: string | null;
  }>;
  payments: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"; amount: string }>;
};

function resolveOrderId(searchParams: URLSearchParams): string | null {
  const externalReference = searchParams.get("external_reference");
  if (externalReference?.startsWith("order_")) {
    return externalReference.replace("order_", "");
  }

  const savedOrderId = localStorage.getItem("checkout_last_order_id");
  return savedOrderId || null;
}

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const { clear } = useCartStore();

  const orderId = useMemo(() => resolveOrderId(searchParams), [searchParams]);
  const paymentId = searchParams.get("payment_id");

  const mpInitialized = useRef(false);
  useEffect(() => {
    if (MP_PUBLIC_KEY && !mpInitialized.current) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
      mpInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    async function loadOrderSummary() {
      if (!orderId) {
        setLoading(false);
        setError("No se pudo identificar la orden.");
        return;
      }

      const guestEmail = localStorage.getItem("checkout_guest_email")?.trim();
      const query = guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : "";

      try {
        const summary = await api<OrderSummary>(`/orders/${orderId}/confirmation${query}`, { auth: true });
        setOrder(summary);
        clear();
        localStorage.removeItem("checkout_last_order_id");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadOrderSummary().catch((err) => {
      setLoading(false);
      setError((err as Error).message);
    });
  }, [orderId]);

  const subtotal = order ? order.items.reduce((acc, i) => acc + Number(i.productPrice) * i.quantity, 0) : 0;
  const customerName = order?.address?.fullName ?? order?.user?.fullName ?? order?.user?.email ?? order?.guestEmail ?? "Invitado";
  const customerEmail = order?.user?.email ?? order?.guestEmail ?? null;

  return (
    <section style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h1 style={{ marginBottom: 4 }}>Pago recibido</h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Gracias por tu compra. Este es el resumen de tu orden.</p>

      {paymentId && (
        <div style={{ maxWidth: 500, margin: "0 auto 1.5rem" }}>
          <StatusScreen initialization={{ paymentId: paymentId }} />
        </div>
      )}

      {loading && <p>Cargando detalle de compra...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {order && (
        <div className="card" style={{ padding: "1.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280" }}>Orden</p>
              <p style={{ margin: 0, fontWeight: 600 }}>#{order.id}</p>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Cliente</p>
              <p style={{ margin: "4px 0 0" }}>{customerName}</p>
              {customerEmail && (
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#4b5563" }}>{customerEmail}</p>
              )}
              {order.address?.phone && (
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#4b5563" }}>Tel: {order.address.phone}</p>
              )}
              {order.address?.documentNumber && (
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#4b5563" }}>
                  {(order.address.documentType || "DNI").toUpperCase()}: {order.address.documentNumber}
                </p>
              )}
            </div>

            {order.address && (
              <div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Envío</p>
                <p style={{ margin: "4px 0 0" }}>{order.address.street}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#4b5563" }}>
                  {order.address.district ? `${order.address.district}, ` : ""}{order.address.city}, {order.address.state}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#4b5563" }}>
                  CP: {order.address.postalCode} — {order.address.country}
                </p>
              </div>
            )}
          </div>

          <p style={{ margin: "0 0 8px", fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Productos</p>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  loading="lazy"
                  style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 6, background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.75rem" }}>
                  —
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>{item.productName}</p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>x{item.quantity}</p>
              </div>
              <span style={{ fontWeight: 500 }}>S/ {(Number(item.productPrice) * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#4b5563" }}>
              <span>Subtotal</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#4b5563" }}>
              <span>Envío</span>
              <span>S/ {Number(order.shippingCost).toFixed(2)}</span>
            </div>
            {Number(order.mpCommission) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#4b5563" }}>
                <span>Comisión MP</span>
                <span>S/ {Number(order.mpCommission).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6, fontSize: "1.05rem" }}>
              <span>Total</span>
              <span>S/ {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#6b7280" }}>
              Pago: {order.payments.map((p) => `${p.status} — S/ ${Number(p.amount).toFixed(2)}`).join(", ")}
            </div>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <Link to="/">Volver al catálogo</Link>
      </div>
    </section>
  );
}
