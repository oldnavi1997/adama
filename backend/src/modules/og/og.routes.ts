import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

export const ogRouter = Router();

const SITE_NAME = "Adamantio";
const DEFAULT_TITLE = "Adamantio — Joyería artesanal";
const DEFAULT_DESCRIPTION = "Descubre nuestra colección de joyería artesanal única.";
const FRONTEND_URL = env.frontendOrigin;

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  price?: string;
  redirectTo: string;
}): string {
  const { title, description, image, url, price, redirectTo } = opts;
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeImage = esc(image);
  const safeUrl = esc(url);
  const safeRedirect = esc(redirectTo);

  const priceTag = price
    ? `  <meta property="product:price:amount" content="${esc(price)}" />
  <meta property="product:price:currency" content="PEN" />`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
${priceTag}
  <meta http-equiv="refresh" content="0; url=${safeRedirect}" />
</head>
<body>
  <script>location.replace(${JSON.stringify(redirectTo)});</script>
  <p>Redirigiendo… <a href="${safeRedirect}">${safeTitle}</a></p>
</body>
</html>`;
}

ogRouter.get("/producto/:slug", async (req, res) => {
  const { slug } = req.params;
  const parts = slug.split("-");
  const maybeId = parts[parts.length - 1];
  const productId = parseInt(maybeId, 10);

  const productUrl = `${FRONTEND_URL}/producto/${slug}`;

  if (isNaN(productId)) {
    res.type("html").send(
      buildHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        image: "",
        url: FRONTEND_URL,
        redirectTo: FRONTEND_URL
      })
    );
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      description: true,
      imageUrl: true,
      price: true
    }
  }).catch(() => null);

  if (!product) {
    res.type("html").send(
      buildHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        image: "",
        url: FRONTEND_URL,
        redirectTo: FRONTEND_URL
      })
    );
    return;
  }

  const backendUrl = env.backendPublicUrl || `http://localhost:${env.port}`;
  const ogUrl = `${backendUrl}/og/producto/${slug}`;

  res.type("html").send(
    buildHtml({
      title: product.name,
      description: product.description ?? DEFAULT_DESCRIPTION,
      image: product.imageUrl ?? "",
      url: ogUrl,
      price: product.price != null ? String(product.price) : undefined,
      redirectTo: productUrl
    })
  );
});
