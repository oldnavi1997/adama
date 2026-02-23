import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";
import { slugify } from "../../app/slug";

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  category?: string | null;
};

export function ProductDetailPage() {
  const { productSlug, productId: productIdParam } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const galleryImages = Array.from(
    new Set(
      [product?.imageUrl ?? "", ...((product?.imageUrls ?? []).map((value) => String(value ?? "").trim()))]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

  const resolvedProductId =
    productIdParam ??
    (() => {
      if (!productSlug) return null;
      const parts = productSlug.split("-");
      const maybeId = parts[parts.length - 1];
      return maybeId && maybeId.length > 8 ? maybeId : null;
    })();

  useEffect(() => {
    if (!resolvedProductId) {
      setError("Producto no encontrado.");
      setLoading(false);
      return;
    }

    api<ProductDetail>(`/products/${resolvedProductId}`)
      .then((res) => {
        setProduct(res);
        setCurrentIndex(0);
        setError("");
      })
      .catch((err) => {
        setProduct(null);
        setError((err as Error).message || "No se pudo cargar el producto.");
      })
      .finally(() => setLoading(false));
  }, [resolvedProductId]);

  useEffect(() => {
    if (currentIndex > galleryImages.length - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, galleryImages.length]);

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (error || !product) {
    return (
      <section>
        <h1>Producto no disponible</h1>
        <p style={{ color: "crimson" }}>{error || "No se encontro el producto."}</p>
        <Link to="/">Volver al catalogo</Link>
      </section>
    );
  }

  const hasGallery = galleryImages.length > 0;
  const hasMultipleImages = galleryImages.length > 1;
  const currentImage = hasGallery ? galleryImages[currentIndex] : "";

  const goPrevious = () => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!hasMultipleImages) return;
    setCurrentIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="product-page-premium">
      <div className="row" style={{ marginBottom: 12 }}>
        <Link to={product.category ? `/categoria/${slugify(product.category)}` : "/"}>Volver al catalogo</Link>
      </div>

      <article className="product-layout">
        <div className="card product-media">
          {hasGallery ? (
            <div className="image-slider">
              <div className="image-slider__image">
                <img src={currentImage} alt={product.name} className="product-image" />
                {hasMultipleImages && (
                  <>
                    <button type="button" className="image-slider__nav image-slider__nav--prev" onClick={goPrevious}>
                      ‹
                    </button>
                    <button type="button" className="image-slider__nav image-slider__nav--next" onClick={goNext}>
                      ›
                    </button>
                  </>
                )}
              </div>
              {hasMultipleImages && (
                <div className="image-slider__thumbs">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={`${product.id}-${index}`}
                      type="button"
                      className={`image-slider__thumb ${currentIndex === index ? "active" : ""}`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <img src={imageUrl} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="product-image-fallback">Imagen no disponible</div>
          )}
        </div>

        <div className="card product-summary">
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          {product.category && <p className="muted">Categoria: {product.category}</p>}
          <p className="product-price">S/ {Number(product.price).toFixed(2)}</p>
          <p className="product-bullets">
            • Material: Plata/acero segun modelo. • Tamaño: Ajustable. • Uso: Ideal para parejas.
          </p>
          <p className="muted">Stock disponible: {product.stock}</p>
          <p>{product.description}</p>

          <button
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                price: Number(product.price)
              })
            }
            disabled={product.stock < 1}
            style={{ width: "100%" }}
          >
            {product.stock < 1 ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </article>

      <section className="card product-section">
        <h3>Detalles del producto</h3>
        <ul>
          <li>Tipo: {product.category || "Producto general"}</li>
          <li>Modelo: Producto de catalogo</li>
          <li>Precio unitario: S/ {Number(product.price).toFixed(2)}</li>
          <li>Disponibilidad: {product.stock > 0 ? "En stock" : "Agotado"}</li>
        </ul>
      </section>

      <section className="card product-section">
        <h3>Talla</h3>
        <p className="muted">Una talla para todos.</p>
        <ul>
          <li>Ajustable para mayor comodidad.</li>
          <li>Ideal para diferentes dedos y uso diario.</li>
          <li>Mantiene su forma y acabado despues del ajuste.</li>
        </ul>
      </section>

      <section className="card product-section">
        <h3>Envio y entrega</h3>
        <p className="muted">Envios disponibles por Shalom y Olva Courier.</p>
        <ul>
          <li>Shalom: recojo en agencia, desde S/ 8.</li>
          <li>Olva Courier: agencia o delivery, desde S/ 12.</li>
          <li>Tiempo estimado: 1 a 3 dias habiles segun ciudad.</li>
        </ul>
      </section>

      <section className="card product-section">
        <h3>Grabado (opcional)</h3>
        <p className="muted">Maximo 20 caracteres. A-Z 0-9 y simbolos basicos.</p>
      </section>
    </section>
  );
}
