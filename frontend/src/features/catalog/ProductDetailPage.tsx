import { Link, useParams } from "react-router-dom";
import React, { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useCartStore } from "../cart/cart.store";
import { slugify } from "../../app/slug";
import { useProduct } from "../../app/queries";
import { EngravingCarousel } from "./EngravingCarousel";

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  contentImages?: string[];
  productDetails?: string;
  sizeInfo?: string;
  category?: string | null;
  engravingEnabled?: boolean;
};

function isVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function CollapseChevron() {
  return (
    <svg className="product-collapse-chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4L16 12L8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`product-collapse${open ? " product-collapse--open" : ""}`}>
      <button
        type="button"
        className="product-collapse-summary"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <CollapseChevron />
      </button>
      <div className="product-collapse-body">
        <div className="product-collapse-inner">
          <div className="product-collapse-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { productSlug, productId: productIdParam } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [engravingText, setEngravingText] = useState("");
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    deltaX: 0
  });
  const resolvedProductId =
    productIdParam ??
    (() => {
      if (!productSlug) return null;
      const parts = productSlug.split("-");
      const maybeId = parts[parts.length - 1];
      return maybeId && maybeId.length > 8 ? maybeId : null;
    })();

  const { data: product, isLoading, isError } = useProduct(resolvedProductId);

  const galleryImages = Array.from(
    new Set(
      [product?.imageUrl ?? "", ...((product?.imageUrls ?? []).map((value) => String(value ?? "").trim()))]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

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

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  if (isLoading) {
    return <div className="card product-skeleton" style={{ margin: "2rem auto", maxWidth: 800, minHeight: 400 }} />;
  }

  if (isError || !product) {
    return (
      <section>
        <h1>Producto no disponible</h1>
        <p style={{ color: "crimson" }}>{isError ? "No se pudo cargar el producto." : "No se encontro el producto."}</p>
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

  const ENGRAVING_ALLOWED = /^[A-Za-z0-9♡†/\-•.&+ ]*$/;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: currentImage || product.imageUrl || product.imageUrls?.[0] || "",
      engravingText: engravingText.trim() || undefined
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
                onClick={() => { if (!dragState.current.active && !isVideo(currentImage)) setLightboxOpen(true); }}
              >
                {isVideo(currentImage) ? (
                  <video
                    key={currentImage}
                    src={currentImage}
                    className="product-image product-image--fade-in"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                ) : (
                  <img key={currentImage} src={currentImage} alt={product.name} className="product-image product-image--fade-in" />
                )}
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
                      {isVideo(imageUrl) ? (
                        <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#111" }}>
                          <video src={imageUrl} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <span style={{ position: "absolute", color: "#fff", fontSize: "1.1rem", pointerEvents: "none", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>▶</span>
                        </span>
                      ) : (
                        <img src={imageUrl} alt={`${product.name} ${index + 1}`} />
                      )}
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

          {product.stock < 1 && (
            <span className="product-out-of-stock">Sin stock</span>
          )}
          <button
            className={`product-add-btn${addedFeedback ? " is-added" : ""}`}
            onClick={handleAddToCart}
            disabled={product.stock < 1 || addedFeedback}
          >
            {product.stock < 1 ? "Sin stock" : addedFeedback ? "Agregado al carrito" : "Agregar al carrito"}
          </button>

          <div className="product-collapse-group">
            {product.productDetails?.trim() && (
              <Collapse title="Detalles del producto">
                <div className="product-description" dangerouslySetInnerHTML={{ __html: product.productDetails }} />
              </Collapse>
            )}

            {product.sizeInfo?.trim() && (
              <Collapse title="Talla">
                <div className="product-description" dangerouslySetInnerHTML={{ __html: product.sizeInfo }} />
              </Collapse>
            )}

            <Collapse title="Información de envíos.">
              <p className="muted"></p>
              <p style={{ fontSize: "14px" }}>Los envios se manejan por las empresas Shalom y Olva Courier</p>
              <p style={{ fontSize: "14px" }}><strong>Shalom</strong>:</p>
              <ul style={{ fontSize: "14px" }}>
                <li style={{ fontSize: "14px" }}>Recojo en agencia</li>
                <li style={{ fontSize: "14px" }}>Costo de envío: 8 soles</li>
                <li style={{ fontSize: "14px" }}>Tiempo estimado de llegada a destino entre 1-2 días ciudades del Centro y Sur del país, Norte 2-3 días.</li>
              </ul>
              <p style={{ fontSize: "14px" }}><strong>Olva Courier:</strong></p>
              <ul style={{ fontSize: "14px" }}>
                <li style={{ fontSize: "14px" }}>Recojo en agencia o delivery</li>
                <li style={{ fontSize: "14px" }}>Costo de envío: 12-18 soles</li>
                <li style={{ fontSize: "14px" }}>Tiempo estimado de llegada a destino entre 1-2 días ciudades del Centro y Sur del país, Norte 2-3 días.</li>
              </ul>
            </Collapse>

            {product.engravingEnabled && (
              <Collapse title="Grabado (opcional)">
                <EngravingCarousel />
                <input
                  type="text"
                  className="engraving-input"
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value.slice(0, 20))}
                  maxLength={20}
                  placeholder="Ej: ANA♡"
                />
                {engravingText && !ENGRAVING_ALLOWED.test(engravingText) && (
                  <p className="engraving-warning">Solo se permiten: A-Z 0-9 ♡ † / - • . &amp; + (sin emojis)</p>
                )}
                <p className="engraving-instructions muted">
                  El grabado es gratis, va en la parte interna o externa del anillo. Máximo 20 Caracteres (puede variar según el diseño y espacio del anillo, consultar al DM en caso de duda) A-Z 0-9 (Símbolos: ♡ † / - • . &amp; + SOLAMENTE) ¡NO EMOJIS!
                </p>
              </Collapse>
            )}
          </div>
        </div>
      </article>

      {product.contentImages && product.contentImages.length > 0 && (
        <div className="product-content-images">
          {product.contentImages.map((url, i) => (
            isVideo(url) ? (
              <video
                key={i}
                src={url}
                className="product-content-img"
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                key={i}
                src={url}
                alt={`${product.name} ${i + 1}`}
                loading="lazy"
                className="product-content-img"
              />
            )
          ))}
        </div>
      )}

      {lightboxOpen && currentImage && !isVideo(currentImage) && (
        <div className="product-lightbox" onClick={() => setLightboxOpen(false)}>
          <img src={currentImage} alt={product.name} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="product-lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}>✕</button>
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
