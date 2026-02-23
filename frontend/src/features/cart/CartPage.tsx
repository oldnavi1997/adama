import { Link } from "react-router-dom";
import { useCartStore } from "./cart.store";

export function CartPage() {
  const { items, updateQty, removeItem } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasFreeShipping = subtotal >= 299;

  return (
    <section className="cart-full-page">
      <div className="cart-shipping-banner">
        <span className="cart-shipping-banner__icon" aria-hidden="true">
          🚚
        </span>
        <p>
          {hasFreeShipping
            ? "Felicidades, ya tienes ENVIO GRATIS."
            : "Te faltan compras para obtener envio gratis."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty-state card">
          <h2>Su carrito esta vacio</h2>
          <p>Para seguir comprando, navega por las categorias o busca un producto.</p>
          <Link to="/" className="cart-primary-btn">
            Elegir productos
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card cart-table-card">
            <table className="cart-table">
              <thead>
                <tr>
                  <th colSpan={2}>Producto</th>
                  <th>Envio</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="cart-col-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="cart-table-thumb" />
                      ) : (
                        <div className="cart-table-thumb cart-table-thumb--fallback" aria-hidden="true" />
                      )}
                    </td>
                    <td className="cart-col-product">
                      <p className="cart-table-brand">Adamantio</p>
                      <strong>{item.name}</strong>
                    </td>
                    <td className="cart-col-shipping">a calcular</td>
                    <td className="cart-col-price">S/ {item.price.toFixed(2)}</td>
                    <td className="cart-col-qty">
                      <div className="cart-qty-control">
                        <button type="button" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                        />
                        <button type="button" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </td>
                    <td className="cart-col-total">S/ {(item.price * item.quantity).toFixed(2)}</td>
                    <td className="cart-col-remove">
                      <button type="button" onClick={() => removeItem(item.productId)} aria-label={`Eliminar ${item.name}`}>
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="card cart-summary-card">
            <h3>Resumen de la compra</h3>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>S/ {subtotal.toFixed(2)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Envío</span>
              <span>Por calcular</span>
            </div>
            <div className="cart-summary-row cart-summary-row--total">
              <span>Total</span>
              <strong>S/ {subtotal.toFixed(2)}</strong>
            </div>
            <Link to="/checkout" className="cart-primary-btn">
              Continuar
            </Link>
            <Link to="/" className="cart-secondary-link">
              Elegir mas productos
            </Link>
          </aside>
        </div>
      )}

      {items.length > 0 && (
        <div className="cart-actions-bottom">
          <Link to="/" className="cart-secondary-link">
            Elegir mas productos
          </Link>
          <Link to="/checkout" className="cart-primary-btn">
            Finalizar compra
          </Link>
        </div>
      )}
    </section>
  );
}
