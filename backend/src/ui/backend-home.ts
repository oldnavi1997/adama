type EndpointCard = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

const endpointCards: EndpointCard[] = [
  { method: "GET", path: "/api/health", description: "Estado del backend" },
  { method: "POST", path: "/api/auth/register", description: "Crear usuario" },
  { method: "POST", path: "/api/auth/login", description: "Iniciar sesion" },
  { method: "GET", path: "/api/products", description: "Listar productos" },
  { method: "POST", path: "/api/orders", description: "Crear orden" },
  { method: "POST", path: "/api/payments/webhook", description: "Webhook de pago" }
];

function endpointListHtml(baseUrl: string): string {
  return endpointCards
    .map((endpoint) => {
      const endpointUrl = `${baseUrl}${endpoint.path}`;
      return `
        <article class="card">
          <div class="method method-${endpoint.method}">${endpoint.method}</div>
          <div class="path">${endpoint.path}</div>
          <p>${endpoint.description}</p>
          <a href="${endpointUrl}" target="_blank" rel="noreferrer">Abrir endpoint</a>
        </article>
      `;
    })
    .join("");
}

export function renderBackendHome(params: { port: number; backendPublicUrl: string }): string {
  const baseUrl = params.backendPublicUrl || `http://localhost:${params.port}`;
  const now = new Date().toLocaleString("es-AR");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ecommerce Backend</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f172a;
        --bg-soft: #1e293b;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #38bdf8;
        --ok: #22c55e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
        background: radial-gradient(circle at top right, #1d4ed8 0%, var(--bg) 40%);
        color: var(--text);
      }

      .wrap {
        width: min(980px, 92vw);
        margin: 40px auto;
      }

      .hero {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid #334155;
        border-radius: 18px;
        padding: 24px;
        backdrop-filter: blur(4px);
      }

      h1 {
        margin: 0 0 10px 0;
        font-size: 1.9rem;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #052e16;
        color: #86efac;
        border: 1px solid #166534;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 0.9rem;
        margin-bottom: 14px;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ok);
      }

      p {
        margin: 0 0 8px 0;
        color: var(--muted);
        line-height: 1.45;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 14px;
        margin-top: 18px;
      }

      .card {
        background: var(--bg-soft);
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 14px;
      }

      .method {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 999px;
        padding: 4px 8px;
      }

      .method-GET {
        color: #a7f3d0;
        background: #064e3b;
      }

      .method-POST {
        color: #bfdbfe;
        background: #1e3a8a;
      }

      .method-PUT,
      .method-PATCH,
      .method-DELETE {
        color: #fef3c7;
        background: #78350f;
      }

      .path {
        margin-top: 10px;
        font-family: "Cascadia Code", Consolas, monospace;
        font-size: 0.95rem;
      }

      .card a {
        display: inline-block;
        margin-top: 10px;
        color: var(--accent);
        text-decoration: none;
      }

      .card a:hover {
        text-decoration: underline;
      }

      .footer {
        margin-top: 18px;
        font-size: 0.85rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <div class="status"><span class="dot"></span> Backend activo</div>
        <h1>Ecommerce API</h1>
        <p>Este backend ya esta funcionando y listo para usarse.</p>
        <p>Base URL: <strong>${baseUrl}</strong></p>
        <p>Actualizado: ${now}</p>

        <div class="grid">
          ${endpointListHtml(baseUrl)}
        </div>
      </section>

      <div class="footer">
        Consejo: usa esta pagina como punto de entrada para desarrollo local.
      </div>
    </main>
  </body>
</html>`;
}
