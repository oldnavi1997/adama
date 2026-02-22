import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../app/api";

type OrderSummary = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "SHIPPED";
  total: string;
  createdAt: string;
  guestEmail?: string | null;
  user?: { id: string; email: string; fullName: string } | null;
  address?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{ id: string; productName: string; quantity: number; productPrice: string }>;
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

  const orderId = useMemo(() => resolveOrderId(searchParams), [searchParams]);

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

  return (
    <section>
      <h1>Pago recibido</h1>
      <p>Gracias por tu compra. Este es el resumen de tu orden.</p>

      {loading && <p>Cargando detalle de compra...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {order && (
        <div className="card">
          <p>
            <strong>Orden:</strong> {order.id}
          </p>
          <p>
            <strong>Estado:</strong> {order.status}
          </p>
          <p>
            <strong>Total:</strong> S/ {Number(order.total).toFixed(2)}
          </p>
          <p>
            <strong>Cliente:</strong> {order.user?.fullName ?? order.user?.email ?? order.guestEmail ?? "Invitado"}
          </p>
          <p>
            <strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>

          <h3>Productos</h3>
          {order.items.map((item) => (
            <p key={item.id} style={{ margin: "6px 0" }}>
              {item.productName} x{item.quantity} - S/ {Number(item.productPrice).toFixed(2)}
            </p>
          ))}

          {order.address && (
            <>
              <h3>Entrega</h3>
              <p style={{ margin: "6px 0" }}>
                {order.address.fullName} - {order.address.phone}
              </p>
              <p style={{ margin: "6px 0" }}>
                {order.address.street}, {order.address.city}, {order.address.state}, {order.address.postalCode}, {order.address.country}
              </p>
            </>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <Link to="/">Volver al catalogo</Link>
        <Link to="/checkout">Ir al checkout</Link>
      </div>
    </section>
  );
}
