import { useEffect, useState } from "react";
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
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
};

export function ProductEditPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showMainImagePicker, setShowMainImagePicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

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
        setCategories(categoriesRes);
        setError("");
      })
      .catch((err) => {
        setError((err as Error).message);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function saveProduct() {
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
          isActive: product.isActive
        })
      });
      navigate("/");
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
      setProduct((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (!product) {
    return (
      <section className="card">
        <p>{error || "Producto no encontrado."}</p>
        <button type="button" onClick={() => navigate("/")}>
          Volver a productos
        </button>
      </section>
    );
  }

  return (
    <section className="card admin-product-edit">
      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={() => navigate("/")} className="admin-back-btn">
          ← Volver a la lista
        </button>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" onClick={saveProduct} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" onClick={toggleProductStatus} disabled={saving}>
            {product.isActive ? "Desactivar" : "Reactivar"}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

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
          <ClassicEditor
            value={product.description}
            onChange={(html) => setProduct((prev) => (prev ? { ...prev, description: html } : prev))}
            placeholder="Descripcion del producto"
            minHeight={220}
          />
        </div>
        <div>
          <label className="admin-field-label">Imagen principal (URL)</label>
          <div className="row">
            <input
              value={product.imageUrl ?? ""}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, imageUrl: e.target.value } : prev))}
              className="admin-field-input"
              placeholder="https://..."
            />
            <button type="button" onClick={() => setShowMainImagePicker(true)} disabled={saving}>
              Elegir de biblioteca
            </button>
          </div>
          {(product.imageUrl || product.imageUrls?.[0]) && (
            <img
              src={product.imageUrl || product.imageUrls?.[0]}
              alt={product.name}
              style={{ marginTop: 8, maxWidth: 200, height: 120, objectFit: "cover", borderRadius: 6 }}
            />
          )}
        </div>
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <label className="admin-field-label" style={{ marginBottom: 0 }}>Galería del producto</label>
            <button type="button" onClick={() => setShowGalleryPicker(true)} disabled={saving}>
              Añadir desde biblioteca
            </button>
          </div>
          <ProductGalleryManager
            urls={product.imageUrls ?? []}
            onChange={(nextUrls) => setProduct((prev) => (prev ? { ...prev, imageUrls: nextUrls } : prev))}
            disabled={saving}
          />
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <label className="admin-field-label">Precio</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={Number(product.price)}
              onChange={(e) =>
                setProduct((prev) => (prev ? { ...prev, price: String(Number(e.target.value) || 0) } : prev))
              }
              className="admin-field-input"
              style={{ width: 120 }}
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
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label className="admin-field-label">Categoría</label>
            <select
              value={product.category ?? ""}
              onChange={(e) => setProduct((prev) => (prev ? { ...prev, category: e.target.value || null } : prev))}
              className="admin-field-input"
              style={{ minWidth: 180 }}
            >
              <option value="">Sin categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          Estado: {product.isActive ? "ACTIVO" : "INACTIVO"}
        </p>
      </div>

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
              ? {
                  ...prev,
                  imageUrls: [...(prev.imageUrls ?? []), ...urls.filter((url) => !(prev.imageUrls ?? []).includes(url))]
                }
              : prev
          )
        }
        title="Agregar imágenes a galería"
        multiple
        filterType="image"
      />
    </section>
  );
}
