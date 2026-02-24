import { useEffect } from "react";

export function PoliticaReembolsosPage() {
  useEffect(() => {
    document.title = "Política de Reembolsos – Adamantio";
  }, []);

  return (
    <article className="legal-page">
      <h1 className="legal-page-title">Política de Reembolsos</h1>

      <p className="legal-lead">
        En Adamantio trabajamos con dedicación para garantizar la satisfacción de nuestros clientes y la excelencia en
        la calidad de nuestras joyas. Sin embargo, entendemos que pueden surgir inconvenientes, por lo que hemos
        establecido una política de reembolsos clara y transparente para su tranquilidad.
      </p>

      <section>
        <h2>1. Plazo para Devoluciones y Reembolsos</h2>
        <p>
          Aceptamos devoluciones de joyas dentro de un plazo de <strong>15 días naturales</strong> a partir de la fecha
          de recepción del producto. Es importante que se comunique con nuestro equipo de atención al cliente antes de
          proceder con cualquier devolución para recibir las instrucciones necesarias.
        </p>
      </section>

      <section>
        <h2>2. Condiciones para la Devolución</h2>
        <p>Para que una devolución sea aceptada, las joyas deben cumplir con las siguientes condiciones:</p>
        <ul>
          <li>
            Los productos personalizados, grabados o hechos a medida no son elegibles para devoluciones ni reembolsos,
            salvo en casos de defectos de fabricación.
          </li>
          <li>
            Incluir el empaque original, etiquetas, certificados de autenticidad y cualquier accesorio adicional que se
            haya entregado con el producto.
          </li>
          <li>Estar en su estado original, sin signos de uso, desgaste, daño o alteraciones.</li>
        </ul>
      </section>

      <section>
        <h2>3. Proceso de Devolución</h2>
        <p>El proceso para gestionar una devolución es el siguiente:</p>
        <ol>
          <li>
            <strong>Confirmación y verificación:</strong> Una vez recibido el producto, realizaremos una inspección para
            verificar que cumpla con las condiciones establecidas.
          </li>
          <li>
            <strong>Envío del producto:</strong> Envíe la joya a la dirección proporcionada por nuestro equipo de
            atención al cliente.
          </li>
          <li>
            <strong>Empaque seguro:</strong> Asegúrese de embalar el producto adecuadamente en su empaque original para
            evitar daños durante el transporte.
          </li>
          <li>
            <strong>Notificación previa:</strong> Comuníquese con nuestro equipo de atención al cliente a través de{" "}
            <a href="mailto:adamantio@gmail.com">adamantio@gmail.com</a> o al{" "}
            <a href="tel:+51913192936">913 192 936</a>, proporcionando detalles del pedido y el motivo de la
            devolución.
          </li>
        </ol>
      </section>

      <section>
        <h2>4. Costos de Envío de la Devolución</h2>
        <ul>
          <li>
            Recomendamos utilizar un servicio de mensajería con número de seguimiento, ya que no nos hacemos
            responsables por paquetes extraviados en el proceso de devolución.
          </li>
          <li>
            Los gastos de envío asociados con la devolución serán asumidos por el cliente, excepto en los casos en que
            el producto presente defectos de fabricación o haya sido enviado incorrectamente.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Reembolsos</h2>
        <ul>
          <li>
            Tenga en cuenta que el tiempo para que el reembolso se refleje en su cuenta puede variar según la entidad
            bancaria.
          </li>
          <li>
            El reembolso será procesado en un plazo de <strong>7 a 10 días hábiles</strong> después de haber recibido y
            verificado la joya.
          </li>
          <li>
            Si la devolución es aceptada, procederemos con el reembolso utilizando el mismo método de pago que se
            utilizó para la compra.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Excepciones y Restricciones</h2>
        <ul>
          <li>
            <strong>Daños no atribuibles a la fabricación:</strong> No ofrecemos devoluciones ni reembolsos por
            productos que hayan sido dañados por mal uso, golpes, productos químicos o desgaste normal.
          </li>
          <li>
            <strong>Artículos en oferta:</strong> Los productos adquiridos en promoción o liquidación no son elegibles
            para reembolsos, excepto en caso de daños o defectos.
          </li>
          <li>
            <strong>Artículos personalizados:</strong> Las joyas personalizadas, con grabados o hechas a medida, no son
            elegibles para devoluciones ni reembolsos, salvo que presenten defectos de fábrica comprobables.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Garantía y Reparaciones</h2>
        <p>
          En caso de que el producto presente algún defecto después del plazo de devolución, ofrecemos servicio de
          reparación bajo los términos de nuestra garantía, que puede variar según el tipo de joya adquirida.
        </p>
      </section>

      <section>
        <h2>8. Asistencia Personalizada</h2>
        <p>
          Si tiene dudas o inquietudes sobre nuestra política de reembolsos o desea iniciar un proceso de devolución,
          nuestro equipo de atención al cliente estará encantado de ayudarle. Puede contactarnos a través de{" "}
          <a href="mailto:adamantio@gmail.com">adamantio@gmail.com</a>, <a href="tel:+51913192936">913 192 936</a> o
          nuestro formulario de contacto en adamantio.pe.
        </p>
        <p>Nos esforzamos por ofrecer un servicio transparente y satisfactorio, y valoramos su confianza en Adamantio.</p>
      </section>
    </article>
  );
}
