import { Link } from "react-router-dom";

export function CheckoutFailurePage() {
  return (
    <section>
      <h1>Pago no completado</h1>
      <p>El pago no pudo completarse. Puedes intentarlo nuevamente desde checkout.</p>
      <div className="row">
        <Link to="/checkout">Volver a checkout</Link>
        <Link to="/cart">Revisar carrito</Link>
      </div>
    </section>
  );
}
