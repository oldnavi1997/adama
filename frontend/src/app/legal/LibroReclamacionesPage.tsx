import { useEffect } from "react";

export function LibroReclamacionesPage() {
  useEffect(() => {
    document.title = "Libro de Reclamaciones – Adamantio";
  }, []);

  return (
    <article className="legal-page">
      <h1 className="legal-page-title">Libro de Reclamaciones</h1>

      <p className="legal-lead">
        De conformidad con la normativa peruana, Adamantio pone a disposición de los consumidores el Libro de
        Reclamaciones. A continuación se detallan los datos y secciones que debe consignar para presentar su reclamo o
        queja.
      </p>

      <section>
        <h2>1. Identificación del consumidor reclamante</h2>
        <ul>
          <li>Nombres y apellidos</li>
          <li>Tipo de documento (DNI, CE, RUC, Pasaporte) y número de documento</li>
          <li>Celular</li>
          <li>Departamento, provincia, distrito</li>
          <li>Dirección y referencia</li>
          <li>Correo electrónico</li>
          <li>Indicación de si es menor de edad (en cuyo caso se consignan los datos del apoderado)</li>
        </ul>
        <p>
          <strong>Datos del apoderado (si aplica):</strong> Tipo y número de documento, celular, nombres y apellidos.
        </p>
      </section>

      <section>
        <h2>2. Identificación del bien contratado</h2>
        <ul>
          <li>Tipo de consumo (producto o servicio)</li>
          <li>N.º de pedido</li>
          <li>Fecha del incidente</li>
          <li>Monto del producto o servicio contratado</li>
          <li>Descripción del producto o servicio</li>
        </ul>
      </section>

      <section>
        <h2>3. Detalle de la reclamación y pedido del consumidor</h2>
        <ul>
          <li>Tipo de reclamo (reclamo o queja)</li>
          <li>Detalle de la reclamación o queja</li>
          <li>Pedido concreto del consumidor</li>
        </ul>
      </section>

      <section>
        <h2>4. Observaciones y condición</h2>
        <p>El consumidor declara encontrarse conforme con los términos de su reclamo o queja.</p>
      </section>

      <section className="legal-notice">
        <h2>Información importante</h2>
        <ul>
          <li>
            En caso de que el consumidor no consigne como mínimo su nombre, DNI, domicilio o correo electrónico y el
            detalle del reclamo o queja, de conformidad con el artículo 5 del Reglamento del Libro de Reclamaciones,
            estos se considerarán como no presentados.
          </li>
          <li>
            La formulación del reclamo no excluye el recurso a otros medios de resolución de controversias ni es un
            requisito previo para presentar una denuncia ante el Indecopi.
          </li>
          <li>
            El proveedor deberá dar respuesta al reclamo en un plazo no mayor a <strong>quince (15) días calendario</strong>,
            pudiendo extender el plazo hasta quince días adicionales.
          </li>
          <li>
            Con la firma del documento, el cliente autoriza a ser contactado después de la tramitación de la
            reclamación para evaluar la calidad y satisfacción del proceso de atención.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cómo presentar su reclamo</h2>
        <p>
          Para registrar su reclamo o queja en nuestro Libro de Reclamaciones, puede acercarse a nuestro punto de
          atención, enviar un correo a{" "}
          <a href="mailto:adamantio@gmail.com">adamantio@gmail.com</a> o contactarnos al{" "}
          <a href="tel:+51913192936">913 192 936</a>. También puede utilizar el formulario de contacto disponible en{" "}
          <a href="https://www.adamantio.pe" target="_blank" rel="noopener noreferrer">
            adamantio.pe
          </a>
          .
        </p>
      </section>
    </article>
  );
}
