import { Link } from "react-router-dom";

export function CheckoutPendingPage() {
  return (
    <section>
      <h1>Pago pendiente</h1>
      <p>Tu pago esta en revision. Te notificaremos cuando se confirme.</p>
      <div className="row">
        <Link to="/">Volver al catalogo</Link>
        <Link to="/checkout/success">Ver resumen de orden</Link>
      </div>
    </section>
  );
}
