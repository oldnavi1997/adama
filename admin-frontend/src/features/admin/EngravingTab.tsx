import { useState } from "react";
import { api } from "../../app/api";

type Product = {
  id: string;
  name: string;
  category?: string | null;
  engravingEnabled?: boolean;
};

type Category = {
  id: string;
  name: string;
};

type EngravingTabProps = {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
};

type Scope = "all" | "category" | "product";

export function EngravingTab({ products, categories, onRefresh }: EngravingTabProps) {
  const [scope, setScope] = useState<Scope>("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function applyAll(enabled: boolean) {
    try {
      setSaving(true);
      setError("");
      await api("/products/engraving/all", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ engravingEnabled: enabled })
      });
      await onRefresh();
      showToast(enabled ? "Grabado activado en todos los productos" : "Grabado desactivado en todos los productos");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function applyCategory(enabled: boolean) {
    if (selectedCategoryIds.length === 0) return;
    try {
      setSaving(true);
      setError("");
      for (const id of selectedCategoryIds) {
        await api(`/products/categories/${id}/engraving`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({ engravingEnabled: enabled })
        });
      }
      await onRefresh();
      setSelectedCategoryIds([]);
      showToast(enabled ? "Grabado activado en categorías seleccionadas" : "Grabado desactivado en categorías seleccionadas");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function applyBulk(enabled: boolean) {
    if (selectedProductIds.length === 0) return;
    try {
      setSaving(true);
      setError("");
      await api("/products/engraving/bulk", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ engravingEnabled: enabled, productIds: selectedProductIds })
      });
      await onRefresh();
      setSelectedProductIds([]);
      showToast(enabled ? "Grabado activado en productos seleccionados" : "Grabado desactivado en productos seleccionados");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  const engravingCount = products.filter((p) => p.engravingEnabled).length;

  return (
    <section className="card">
      {toast && <div className="admin-toast">{toast}</div>}
      <h3>Control de Grabado</h3>

      <div className="row" style={{ gap: 8, marginBottom: 20 }}>
        {(["all", "category", "product"] as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`admin-tab${scope === s ? " admin-tab--active" : ""}`}
            onClick={() => setScope(s)}
          >
            {s === "all" ? "Todos los productos" : s === "category" ? "Por Categoría" : "Por Producto"}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {scope === "all" && (
        <div>
          <p style={{ marginBottom: 16 }}>
            Actualmente <strong>{engravingCount}</strong> de <strong>{products.length}</strong> productos tienen grabado activo.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => applyAll(true)}
              disabled={saving}
            >
              Activar en todos
            </button>
            <button
              type="button"
              onClick={() => applyAll(false)}
              disabled={saving}
            >
              Desactivar en todos
            </button>
          </div>
        </div>
      )}

      {scope === "category" && (
        <div>
          <p style={{ marginBottom: 12 }}>Selecciona las categorías sobre las que aplicar el cambio:</p>
          <div className="grid" style={{ marginBottom: 16 }}>
            {categories.map((cat) => (
              <label key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => applyCategory(true)}
              disabled={saving || selectedCategoryIds.length === 0}
            >
              Activar en seleccionadas
            </button>
            <button
              type="button"
              onClick={() => applyCategory(false)}
              disabled={saving || selectedCategoryIds.length === 0}
            >
              Desactivar en seleccionadas
            </button>
          </div>
        </div>
      )}

      {scope === "product" && (
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            style={{ marginBottom: 12, width: "100%", maxWidth: 400 }}
          />
          <div style={{ marginBottom: 16, maxHeight: 400, overflowY: "auto" }}>
            {filteredProducts.map((p) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{ color: p.engravingEnabled ? "#16a34a" : "#9ca3af", fontSize: 18 }}>
                  {p.engravingEnabled ? "●" : "○"}
                </span>
              </label>
            ))}
            {filteredProducts.length === 0 && <p className="muted">No se encontraron productos.</p>}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => applyBulk(true)}
              disabled={saving || selectedProductIds.length === 0}
            >
              Activar en seleccionados
            </button>
            <button
              type="button"
              onClick={() => applyBulk(false)}
              disabled={saving || selectedProductIds.length === 0}
            >
              Desactivar en seleccionados
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
