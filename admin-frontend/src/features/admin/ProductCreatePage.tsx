import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../app/api";
import { ClassicEditor } from "./ClassicEditor";
import { ProductGalleryManager } from "./ProductGalleryManager";
import { MediaLibraryPickerModal } from "./MediaLibraryPickerModal";

type Category = {
  id: string;
  name: string;
};

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showMainImagePicker, setShowMainImagePicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    productDetails: "",
    price: 0,
    stock: 0,
    category: "",
    imageUrl: ""
  });
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const normalizedName = form.name.trim();
  const normalizedDescription = form.description.trim();
  const canCreateProduct = normalizedName.length >= 2 && normalizedDescription.length >= 2 && form.price > 0;

  useEffect(() => {
    setLoading(true);
    api<Category[]>("/products/categories", { auth: true })
      .then((res) => {
        setCategories(res);
        setError("");
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    if (!canCreateProduct) {
      setError("Completa los campos requeridos: nombre (min 2), descripcion (min 2) y precio mayor a 0.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api("/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          ...form,
          imageUrls: galleryUrls,
          name: normalizedName,
          description: normalizedDescription,
          productDetails: form.productDetails.trim()
        })
      });
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Cargando formulario...</p>;
  }

  return (
    <section className="card admin-product-edit">
      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={() => navigate("/")} className="admin-back-btn">
          ← Volver a la lista
        </button>
        <button type="button" onClick={() => navigate("/")} disabled={saving}>
          Cancelar
        </button>
      </div>

      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Añadir nuevo producto</h3>
      {error && <p className="error">{error}</p>}

      <form onSubmit={createProduct} className="admin-product-edit-grid">
        <div>
          <label className="admin-field-label">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="admin-field-input"
          />
        </div>
        <div>
          <label className="admin-field-label">Descripción</label>
          <ClassicEditor
            value={form.description}
            onChange={(html) => setForm((p) => ({ ...p, description: html }))}
            placeholder="Descripción del producto"
            minHeight={220}
          />
        </div>
        <div>
          <label className="admin-field-label">Detalles del producto</label>
          <ClassicEditor
            value={form.productDetails}
            onChange={(html) => setForm((p) => ({ ...p, productDetails: html }))}
            placeholder="Detalles del producto (materiales, medidas, cuidados...)"
            minHeight={140}
          />
        </div>
        <div>
          <label className="admin-field-label">Imagen principal (URL)</label>
          <div className="row">
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              className="admin-field-input"
              placeholder="https://..."
            />
            <button type="button" onClick={() => setShowMainImagePicker(true)} disabled={saving}>
              Elegir de biblioteca
            </button>
          </div>
        </div>
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <label className="admin-field-label" style={{ marginBottom: 0 }}>Galería del producto</label>
            <button type="button" onClick={() => setShowGalleryPicker(true)} disabled={saving}>
              Añadir desde biblioteca
            </button>
          </div>
          <ProductGalleryManager urls={galleryUrls} onChange={setGalleryUrls} disabled={saving} />
        </div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <label className="admin-field-label">Precio</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.price}
              onChange={(e) => {
                const value = e.currentTarget.valueAsNumber;
                setForm((p) => ({ ...p, price: Number.isFinite(value) ? value : 0 }));
              }}
              className="admin-field-input"
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label className="admin-field-label">Stock</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => {
                const value = e.currentTarget.valueAsNumber;
                setForm((p) => ({ ...p, stock: Number.isFinite(value) ? value : 0 }));
              }}
              className="admin-field-input"
              style={{ width: 90 }}
            />
          </div>
          <div>
            <label className="admin-field-label">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
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
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
          <button type="submit" disabled={!canCreateProduct || saving}>
            {saving ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </form>

      <MediaLibraryPickerModal
        isOpen={showMainImagePicker}
        onClose={() => setShowMainImagePicker(false)}
        onConfirm={(urls) => setForm((p) => ({ ...p, imageUrl: urls[0] ?? p.imageUrl }))}
        title="Seleccionar imagen principal"
        multiple={false}
        filterType="image"
      />
      <MediaLibraryPickerModal
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onConfirm={(urls) => {
          setGalleryUrls((prev) => [...prev, ...urls.filter((url) => !prev.includes(url))]);
        }}
        title="Agregar imágenes a galería"
        multiple
        filterType="image"
      />
    </section>
  );
}
