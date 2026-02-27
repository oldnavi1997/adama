import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../app/api";
import { ClassicEditor } from "./ClassicEditor";
import { ProductGalleryManager } from "./ProductGalleryManager";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  contentImages?: string[];
  isActive: boolean;
};

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: string;
  signature: string;
};

type Category = {
  id: string;
  name: string;
};

function productSnapshot(p: Product): string {
  return JSON.stringify({
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    category: p.category ?? "",
    imageUrl: p.imageUrl ?? "",
    imageUrls: p.imageUrls ?? [],
    contentImages: p.contentImages ?? [],
    isActive: p.isActive
  });
}

export function ProductEditPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showMainImagePicker, setShowMainImagePicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const originalSnapshot = useRef("");

  const [contentDragIndex, setContentDragIndex] = useState<number | null>(null);
  const [contentOverIndex, setContentOverIndex] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const hasChanges = product ? productSnapshot(product) !== originalSnapshot.current : false;

  useEffect(() => {
    if (!productId) {
      setError("Producto no encontrado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api<Product>(`/products/${productId}`, { auth: true }),
      api<Category[]>("/products/categories", { auth: true })
    ])
      .then(([productRes, categoriesRes]) => {
        setProduct(productRes);
        originalSnapshot.current = productSnapshot(productRes);
        setCategories(categoriesRes);
        setError("");
      })
      .catch((err) => {
        setError((err as Error).message);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function saveProduct(andNavigate = false) {
    if (!product) return;
    try {
      setSaving(true);
      setError("");
      await api(`/products/${product.id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: Number(product.price),
          stock: product.stock,
          category: product.category ?? "",
          imageUrl: product.imageUrl ?? "",
          imageUrls: product.imageUrls ?? [],
          contentImages: product.contentImages ?? [],
          isActive: product.isActive
        })
      });
      originalSnapshot.current = productSnapshot(product);
      if (andNavigate) {
        navigate("/");
      } else {
        showToast("Cambios guardados");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleProductStatus() {
    if (!product) return;
    try {
      setSaving(true);
      setError("");
      await api(`/products/${product.id}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ isActive: !product.isActive })
      });
      const updated = { ...product, isActive: !product.isActive };
      setProduct(updated);
      originalSnapshot.current = productSnapshot(updated);
      showToast(updated.isActive ? "Producto activado" : "Producto desactivado");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (!product) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      setSaving(true);
      setError("");
      await api(`/products/${product.id}`, { method: "DELETE", auth: true });
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadMainImage(files: FileList) {
    if (!product || files.length === 0) return;
    try {
      setUploadingMainImage(true);
      setError("");
      const sig = await api<SignatureResponse>("/media/signature", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ folder: "adama/products" })
      });
      const file = files[0];
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", sig.apiKey);
      body.append("timestamp", sig.timestamp);
      body.append("folder", sig.folder);
      body.append("signature", sig.signature);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body });
      if (!res.ok) throw new Error(`Upload falló para ${file.name}`);
      const data = (await res.json()) as { secure_url?: string };
      const url = String(data.secure_url ?? "").trim();
      if (!url) throw new Error(`Cloudinary no retornó URL para ${file.name}`);
      await api("/media/assets", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ url, resourceType: "image", originalName: file.name, bytes: file.size, folder: sig.folder })
      });
      setProduct((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingMainImage(false);
    }
  }

  async function uploadContentImages(files: FileList) {
    if (!product || files.length === 0) return;
    try {
      setUploadingContent(true);
      setError("");
      const sig = await api<SignatureResponse>("/media/signature", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ folder: "adama/products" })
      });
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", sig.timestamp);
        body.append("folder", sig.folder);
        body.append("signature", sig.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body });
        if (!res.ok) throw new Error(`Upload falló para ${file.name}`);
        const data = (await res.json()) as { secure_url?: string };
        const url = String(data.secure_url ?? "").trim();
        if (!url) throw new Error(`Cloudinary no retornó URL para ${file.name}`);
        await api("/media/assets", {
          method: "POST",
          auth: true,
          body: JSON.stringify({ url, resourceType: "image", originalName: file.name, bytes: file.size, folder: sig.folder })
        });
        newUrls.push(url);
      }
      setProduct((prev) =>
        prev ? { ...prev, contentImages: [...(prev.contentImages ?? []), ...newUrls] } : prev
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingContent(false);
    }
  }

  function handleContentDrop(dropIndex: number) {
    if (contentDragIndex == null || contentDragIndex === dropIndex) {
      setContentDragIndex(null);
      setContentOverIndex(null);
      return;
    }
    setProduct((prev) => {
      if (!prev) return prev;
      const imgs = [...(prev.contentImages ?? [])];
      const [item] = imgs.splice(contentDragIndex, 1);
      imgs.splice(dropIndex, 0, item);
      return { ...prev, contentImages: imgs };
    });
    setContentDragIndex(null);
    setContentOverIndex(null);
  }

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (!product) {
    return (
      <section className="card">
        <p>{error || "Producto no encontrado."}</p>
        <button type="button" onClick={() => navigate("/")}>Volver a productos</button>
      </section>
    );
  }

  const mainImgSrc = product.imageUrl || product.imageUrls?.[0] || "";

  return (
    <div className="admin-product-edit">
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-sticky-bar">
        <button type="button" onClick={() => navigate("/")} className="admin-back-btn">
          ← Volver
        </button>
        <div className="row" style={{ gap: 8 }}>
          {hasChanges && <span className="admin-unsaved-dot" title="Cambios sin guardar" />}
          <button type="button" onClick={() => saveProduct(false)} disabled={saving} className="admin-btn-primary">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={() => saveProduct(true)} disabled={saving}>
            Guardar y volver
          </button>
        </div>
      </div>

      {error && <p className="error" style={{ margin: "0 0 8px" }}>{error}</p>}

      {/* --- Informacion basica --- */}
      <section className="admin-edit-section">
        <h3 className="admin-section-title">Información básica</h3>
        <div className="admin-product-edit-grid">
          <div>
            <label className="admin-field-label">Nombre</label>
            <input
              value={product.name}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              className="admin-field-input"
            />
          </div>
          <div>
            <label className="admin-field-label">Descripción</label>
            <ClassicEditor
              value={product.description}
              onChange={(html) => setProduct((prev) => (prev ? { ...prev, description: html } : prev))}
              placeholder="Descripción del producto"
              minHeight={180}
            />
          </div>
          <div>
            <label className="admin-field-label">Categoría</label>
            <select
              value={product.category ?? ""}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, category: e.target.value || null } : prev))}
              className="admin-field-input"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* --- Precio y Stock --- */}
      <section className="admin-edit-section">
        <h3 className="admin-section-title">Precio y stock</h3>
        <div className="row" style={{ gap: 16 }}>
          <div>
            <label className="admin-field-label">Precio (S/)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={Number(product.price)}
              onChange={(e) =>
                setProduct((prev) => (prev ? { ...prev, price: String(Number(e.target.value) || 0) } : prev))
              }
              className="admin-field-input"
              style={{ width: 140 }}
            />
          </div>
          <div>
            <label className="admin-field-label">Stock</label>
            <input
              type="number"
              min={0}
              value={product.stock}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, stock: Number(e.target.value) || 0 } : prev))}
              className="admin-field-input"
              style={{ width: 100 }}
            />
          </div>
        </div>
      </section>

      {/* --- Imagen principal --- */}
      <section className="admin-edit-section">
        <h3 className="admin-section-title">Imagen principal</h3>
        <div className="admin-main-image-block">
          {mainImgSrc ? (
            <div className="admin-main-image-preview">
              <img src={mainImgSrc} alt={product.name} onClick={() => setLightboxUrl(mainImgSrc)} />
              <button
                type="button"
                className="admin-main-image-remove"
                onClick={() => setProduct((prev) => (prev ? { ...prev, imageUrl: "" } : prev))}
                title="Quitar imagen"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="admin-main-image-empty">Sin imagen</div>
          )}
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            <label style={{ cursor: uploadingMainImage ? "not-allowed" : "pointer", display: "inline-block" }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploadingMainImage || saving}
                onChange={(e) => {
                  if (e.target.files) uploadMainImage(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="admin-btn-like">
                {uploadingMainImage ? "Subiendo..." : "Subir imagen"}
              </span>
            </label>
            <button type="button" onClick={() => setShowMainImagePicker(true)} disabled={saving}>
              Elegir de biblioteca
            </button>
          </div>
        </div>
      </section>

      {/* --- Galería --- */}
      <section className="admin-edit-section">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h3 className="admin-section-title" style={{ marginBottom: 0 }}>Galería del producto</h3>
          <button type="button" onClick={() => setShowGalleryPicker(true)} disabled={saving}>
            Añadir desde biblioteca
          </button>
        </div>
        <ProductGalleryManager
          urls={product.imageUrls ?? []}
          onChange={(nextUrls) => setProduct((prev) => (prev ? { ...prev, imageUrls: nextUrls } : prev))}
          disabled={saving}
          onPreview={(url) => setLightboxUrl(url)}
        />
      </section>

      {/* --- Imagenes de contenido --- */}
      <section className="admin-edit-section">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h3 className="admin-section-title" style={{ marginBottom: 0 }}>Imágenes de contenido</h3>
          <div className="row" style={{ gap: 6 }}>
            <label style={{ cursor: uploadingContent ? "not-allowed" : "pointer", display: "inline-block" }}>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                disabled={uploadingContent || saving}
                onChange={(e) => {
                  if (e.target.files) uploadContentImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="admin-btn-like">
                {uploadingContent ? "Subiendo..." : "Subir imágenes"}
              </span>
            </label>
            <button type="button" onClick={() => setShowContentPicker(true)} disabled={saving || uploadingContent}>
              Elegir de biblioteca
            </button>
          </div>
        </div>
        {(product.contentImages ?? []).length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Sin imágenes de contenido. Sube o elige desde la biblioteca.</p>
        ) : (
          <div className="admin-gallery-grid">
            {(product.contentImages ?? []).map((url, index) => (
              <article
                key={`${url}-${index}`}
                className={`admin-gallery-card${contentOverIndex === index ? " is-over" : ""}`}
                draggable={!saving}
                onDragStart={() => { setContentDragIndex(index); setContentOverIndex(index); }}
                onDragOver={(e) => { e.preventDefault(); if (!saving) setContentOverIndex(index); }}
                onDrop={(e) => { e.preventDefault(); if (!saving) handleContentDrop(index); }}
                onDragEnd={() => { setContentDragIndex(null); setContentOverIndex(null); }}
              >
                <img src={url} alt={`Contenido ${index + 1}`} className="admin-gallery-image" onClick={() => setLightboxUrl(url)} />
                <div className="admin-gallery-meta">
                  <small>Posición {index + 1}</small>
                </div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <small className="muted">Arrastra para reordenar</small>
                  <button
                    type="button"
                    onClick={() =>
                      setProduct((prev) =>
                        prev ? { ...prev, contentImages: (prev.contentImages ?? []).filter((_, idx) => idx !== index) } : prev
                      )
                    }
                    disabled={saving}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* --- Estado y acciones --- */}
      <section className="admin-edit-section admin-edit-section--status">
        <h3 className="admin-section-title">Estado y acciones</h3>
        <div className="row" style={{ gap: 12, alignItems: "center" }}>
          <span className={product.isActive ? "admin-status-active" : "admin-status-inactive"}>
            {product.isActive ? "ACTIVO" : "INACTIVO"}
          </span>
          <button type="button" onClick={toggleProductStatus} disabled={saving}>
            {product.isActive ? "Desactivar" : "Reactivar"}
          </button>
          <button
            type="button"
            onClick={deleteProduct}
            disabled={saving}
            className="admin-btn-danger"
          >
            Eliminar producto
          </button>
        </div>
      </section>

      {lightboxUrl && (
        <div className="admin-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Vista completa" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="admin-lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
        </div>
      )}

      <MediaLibraryPickerModal
        isOpen={showMainImagePicker}
        onClose={() => setShowMainImagePicker(false)}
        onConfirm={(urls) => setProduct((prev) => (prev ? { ...prev, imageUrl: urls[0] ?? prev.imageUrl ?? "" } : prev))}
        title="Seleccionar imagen principal"
        multiple={false}
        filterType="image"
      />
      <MediaLibraryPickerModal
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onConfirm={(urls) =>
          setProduct((prev) =>
            prev
              ? { ...prev, imageUrls: [...(prev.imageUrls ?? []), ...urls.filter((url) => !(prev.imageUrls ?? []).includes(url))] }
              : prev
          )
        }
        title="Agregar imágenes a galería"
        multiple
        filterType="image"
      />
      <MediaLibraryPickerModal
        isOpen={showContentPicker}
        onClose={() => setShowContentPicker(false)}
        onConfirm={(urls) =>
          setProduct((prev) =>
            prev
              ? { ...prev, contentImages: [...(prev.contentImages ?? []), ...urls.filter((url) => !(prev.contentImages ?? []).includes(url))] }
              : prev
          )
        }
        title="Agregar imágenes de contenido"
        multiple
        filterType="image"
      />
    </div>
  );
}
