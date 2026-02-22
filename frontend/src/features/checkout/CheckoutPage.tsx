import { useState } from "react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";

type OrderResponse = {
  orderId: string;
  payment: {
    initPoint: string;
    sandboxInitPoint: string;
  };
};

export function CheckoutPage() {
  const { items, clear } = useCartStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Peru"
  });

  async function submitOrder() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        guestEmail: email || undefined,
        address,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await api<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const checkoutUrl = res.payment.initPoint || res.payment.sandboxInitPoint;
      if (!checkoutUrl) {
        throw new Error("Mercado Pago did not return a checkout URL");
      }
      localStorage.setItem("checkout_last_order_id", res.orderId);
      if (email.trim()) {
        localStorage.setItem("checkout_guest_email", email.trim());
      }
      clear();
      window.location.href = checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>
      {items.length === 0 && <p>No hay productos en carrito.</p>}
      <div className="card">
        <div className="row">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opcional si no hay login)" />
        </div>
        {Object.entries(address).map(([key, value]) => (
          <div key={key} style={{ marginTop: 8 }}>
            <input
              value={value}
              onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={key}
              style={{ width: "100%" }}
            />
          </div>
        ))}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button disabled={loading || items.length === 0} onClick={submitOrder} style={{ marginTop: 12 }}>
          {loading ? "Creando orden..." : "Pagar con Mercado Pago"}
        </button>
      </div>
    </section>
  );
}
