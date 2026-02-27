import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  contentImages?: string[];
  category?: string | null;
};

function CollapseChevron() {
  return (
    <svg className="product-collapse-chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4L16 12L8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductDetailPage() {
  const { productSlug, productId: productIdParam } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    deltaX: 0
  });

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

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Adamantio`;
    }
    return () => { document.title = "Adamantio"; };
  }, [product]);

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (error || !product) {
    return (
      <section>
        <h1>Producto no disponible</h1>
        <p style={{ color: "crimson" }}>{error || "No se encontro el producto."}</p>
        <Link to="/">Volver al catálogo</Link>
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0
    };
    setIsDraggingImage(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return;
    dragState.current.deltaX = event.clientX - dragState.current.startX;
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return;

    const deltaX = dragState.current.deltaX;
    dragState.current = {
      active: false,
      pointerId: -1,
      startX: 0,
      deltaX: 0
    };
    setIsDraggingImage(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const SWIPE_THRESHOLD_PX = 40;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) {
      goNext();
    } else {
      goPrevious();
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: currentImage || product.imageUrl || product.imageUrls?.[0] || ""
    });
    setAddedFeedback(true);
    openDrawer();
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <section className="product-page-premium">
      <nav className="product-breadcrumb">
        <Link to="/">Inicio</Link>
        <span className="product-breadcrumb-sep">/</span>
        {product.category && (
          <>
            <Link to={`/categoria/${slugify(product.category)}`}>{product.category}</Link>
            <span className="product-breadcrumb-sep">/</span>
          </>
        )}
        <span className="product-breadcrumb-current">{product.name}</span>
      </nav>

      <article className="product-layout">
        <div className="card product-media">
          {hasGallery ? (
            <div className="image-slider">
              <div
                className={`image-slider__image ${isDraggingImage ? "dragging" : ""}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onClick={() => { if (!dragState.current.active) setLightboxOpen(true); }}
              >
                <img key={currentImage} src={currentImage} alt={product.name} className="product-image product-image--fade-in" />
                {hasMultipleImages && (
                  <>
                    <button type="button" className="image-slider__nav image-slider__nav--prev" onClick={(e) => { e.stopPropagation(); goPrevious(); }}>
                      ‹
                    </button>
                    <button type="button" className="image-slider__nav image-slider__nav--next" onClick={(e) => { e.stopPropagation(); goNext(); }}>
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
          {product.category && (
            <Link to={`/categoria/${slugify(product.category)}`} className="product-category-link">
              {product.category}
            </Link>
          )}
          <p className="product-price">S/ {Number(product.price).toFixed(2)}</p>
          {product.description && (
            <div className="product-description" dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          <button
            className={`product-add-btn${addedFeedback ? " is-added" : ""}`}
            onClick={handleAddToCart}
            disabled={product.stock < 1 || addedFeedback}
          >
            {product.stock < 1 ? "Sin stock" : addedFeedback ? "Agregado al carrito" : "Agregar al carrito"}
          </button>

          <div className="product-collapse-group">
            <details className="product-collapse">
              <summary>
                <span>Talla</span>
                <CollapseChevron />
              </summary>
              <div className="product-collapse-body">
                <p className="muted">Una talla para todos.</p>
                <ul>
                  <li>Ajustable para mayor comodidad.</li>
                  <li>Ideal para diferentes dedos y uso diario.</li>
                  <li>Mantiene su forma y acabado después del ajuste.</li>
                </ul>
              </div>
            </details>

            <details className="product-collapse">
              <summary>
                <span>Envío y entrega</span>
                <CollapseChevron />
              </summary>
              <div className="product-collapse-body">
                <p className="muted">Envíos disponibles por Shalom y Olva Courier.</p>
                <ul>
                  <li>Shalom: recojo en agencia, desde S/ 8.</li>
                  <li>Olva Courier: agencia o delivery, desde S/ 12.</li>
                  <li>Tiempo estimado: 1 a 3 días hábiles según ciudad.</li>
                </ul>
              </div>
            </details>

            <details className="product-collapse">
              <summary>
                <span>Grabado (opcional)</span>
                <CollapseChevron />
              </summary>
              <div className="product-collapse-body">
                <p className="muted">Máximo 20 caracteres. A-Z 0-9 y símbolos básicos.</p>
              </div>
            </details>
          </div>
        </div>
      </article>

      {product.contentImages && product.contentImages.length > 0 && (
        <div className="product-content-images">
          {product.contentImages.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${product.name} ${i + 1}`}
              loading="lazy"
              className="product-content-img"
            />
          ))}
        </div>
      )}

      {lightboxOpen && currentImage && (
        <div className="product-lightbox" onClick={() => setLightboxOpen(false)}>
          <img src={currentImage} alt={product.name} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="product-lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
          {hasMultipleImages && (
            <>
              <button type="button" className="product-lightbox-nav product-lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); goPrevious(); }}>‹</button>
              <button type="button" className="product-lightbox-nav product-lightbox-nav--next" onClick={(e) => { e.stopPropagation(); goNext(); }}>›</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
