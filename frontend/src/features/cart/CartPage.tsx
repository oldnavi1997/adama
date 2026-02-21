import { Link } from "react-router-dom";
import { useCartStore } from "./cart.store";

export function CartPage() {
  const { items, updateQty, removeItem } = useCartStore();
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <section>
      <h1>Carrito</h1>
      {items.length === 0 ? (
        <p>Tu carrito esta vacio.</p>
      ) : (
        <>
          <div className="card">
            {items.map((item) => (
              <div key={item.productId} className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <strong>{item.name}</strong>
                <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                  style={{ width: 80 }}
                />
                <button onClick={() => removeItem(item.productId)}>Eliminar</button>
              </div>
            ))}
          </div>
          <h3>Total: S/ {total.toFixed(2)}</h3>
          <Link to="/checkout">Ir al checkout</Link>
        </>
      )}
    </section>
  );
}
