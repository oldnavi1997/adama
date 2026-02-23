import { FormEvent, useEffect, useState } from "react";
import { api } from "../../app/api";

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

type ProductsResponse = {
  data: Product[];
  page: number;
  pageSize: number;
  total: number;
};

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
  parent_name?: string | null;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "SHIPPED";
  total: string;
  createdAt: string;
  user?: { email: string; fullName: string } | null;
  guestEmail?: string | null;
  items: Array<{ id: string; productName: string; quantity: number; productPrice: string }>;
  payments: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"; amount: string }>;
};

export function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "orders">("products");
  const [productQuery, setProductQuery] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | Order["status"]>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    imageUrl: "",
    imageUrlsText: ""
  });

  const normalizedName = form.name.trim();
  const normalizedDescription = form.description.trim();
  const canCreateProduct = normalizedName.length >= 2 && normalizedDescription.length >= 2 && form.price > 0;
  const parseGalleryInput = (value: string): string[] =>
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  async function loadProducts() {
    const pageSize = 50;
    let page = 1;
    const all: Product[] = [];

    while (true) {
      const res = await api<ProductsResponse>(`/products?page=${page}&pageSize=${pageSize}&includeInactive=true`, {
        auth: true
      });
      all.push(...res.data);

      if (all.length >= res.total || res.data.length === 0) {
        break;
      }
      page += 1;
    }

    setProducts(all);
  }

  async function loadOrders() {
    const res = await api<Order[]>("/orders", { auth: true });
    setOrders(res);
  }

  async function loadCategories() {
    const res = await api<Category[]>("/products/categories", { auth: true });
    setCategories(res);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProducts(), loadCategories(), loadOrders()])
      .catch((err) => {
        setError((err as Error).message);
        setProducts([]);
        setCategories([]);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    if (!canCreateProduct) {
      setError("Completa los campos requeridos: nombre (min 2), descripcion (min 2) y precio mayor a 0.");
      return;
    }

    try {
      setError("");
      await api("/products", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          ...form,
          imageUrls: parseGalleryInput(form.imageUrlsText),
          name: normalizedName,
          description: normalizedDescription
        })
      });
      setForm({ name: "", description: "", price: 0, stock: 0, category: "", imageUrl: "", imageUrlsText: "" });
      await loadProducts();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function updateProduct(product: Product) {
    try {
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
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleProductStatus(product: Product) {
    try {
      setError("");
      await api(`/products/${product.id}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ isActive: !product.isActive })
      });
      await loadProducts();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    try {
      setError("");
      await api(`/orders/${orderId}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status })
      });
      await loadOrders();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createCategory(e: FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name.length < 2) {
      setError("El nombre de categoria debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setError("");
      await api("/products/categories", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ name, parentId: newCategoryParentId || null })
      });
      setNewCategoryName("");
      setNewCategoryParentId("");
      await loadCategories();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function renameCategory(category: Category) {
    const name = category.name.trim();
    if (name.length < 2) {
      setError("El nombre de categoria debe tener al menos 2 caracteres.");
      return;
    }

    try {
      setError("");
      await api(`/products/categories/${category.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ name, parentId: category.parent_id ?? null })
      });
      setEditingCategoryId(null);
      await Promise.all([loadCategories(), loadProducts()]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      setError("");
      await api(`/products/categories/${categoryId}`, {
        method: "DELETE",
        auth: true
      });
      await Promise.all([loadCategories(), loadProducts()]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const visibleProducts = products.filter((product) => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return true;
    return [product.name, product.description, product.category ?? ""].some((v) => v.toLowerCase().includes(query));
  });

  const productsPerPage = 12;
  const totalProductPages = Math.max(1, Math.ceil(visibleProducts.length / productsPerPage));
  const currentProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = visibleProducts.slice(
    (currentProductPage - 1) * productsPerPage,
    currentProductPage * productsPerPage
  );
  const productPageNumbers = Array.from({ length: totalProductPages }, (_, index) => index + 1);

  useEffect(() => {
    setProductPage(1);
  }, [productQuery]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  const visibleOrders = orders.filter((order) => {
    const matchesStatus = orderStatusFilter === "ALL" || order.status === orderStatusFilter;
    const query = orderQuery.trim().toLowerCase();
    if (!matchesStatus) return false;
    if (!query) return true;
    return [order.id, order.user?.email ?? "", order.user?.fullName ?? "", order.guestEmail ?? ""].some((v) =>
      v.toLowerCase().includes(query)
    );
  });

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <h1>Panel Admin</h1>
        <p>Plataforma de gestion separada del sitio principal.</p>
      </div>

      <div className="row">
        <button onClick={() => setActiveTab("products")} disabled={activeTab === "products"}>
          Productos
        </button>
        <button onClick={() => setActiveTab("categories")} disabled={activeTab === "categories"}>
          Categorias
        </button>
        <button onClick={() => setActiveTab("orders")} disabled={activeTab === "orders"}>
          Ordenes
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando panel...</p>
      ) : activeTab === "products" ? (
        <>
          <form className="card admin-form" onSubmit={createProduct}>
            <h3>Nuevo producto</h3>
            <div className="grid">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre" />
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripcion"
              />
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={form.price}
                onChange={(e) => {
                  const value = e.currentTarget.valueAsNumber;
                  setForm((p) => ({ ...p, price: Number.isFinite(value) ? value : 0 }));
                }}
                placeholder="Precio"
              />
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => {
                  const value = e.currentTarget.valueAsNumber;
                  setForm((p) => ({ ...p, stock: Number.isFinite(value) ? value : 0 }));
                }}
                placeholder="Stock"
              />
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Sin categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="Imagen URL" />
              <input
                value={form.imageUrlsText}
                onChange={(e) => setForm((p) => ({ ...p, imageUrlsText: e.target.value }))}
                placeholder="Galeria URLs (separadas por coma o salto de linea)"
              />
            </div>
            <button type="submit" disabled={!canCreateProduct}>
              Crear producto
            </button>
          </form>

          <div className="row" style={{ marginTop: 12, marginBottom: 10 }}>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, descripcion o categoria"
              style={{ minWidth: 320 }}
            />
          </div>

          <div className="grid">
            {paginatedProducts.map((product) => {
              const isEditing = editingId === product.id;
              const previewImage = product.imageUrl || product.imageUrls?.[0] || "";
              const galleryUrls = product.imageUrls ?? [];
              return (
                <article key={product.id} className="card">
                  {previewImage && (
                    <img src={previewImage} alt={product.name} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }} />
                  )}
                  {galleryUrls.length > 0 && (
                    <div className="admin-gallery-preview">
                      {galleryUrls.slice(0, 6).map((url, index) => (
                        <img key={`${product.id}-gallery-${index}`} src={url} alt={`${product.name} ${index + 1}`} />
                      ))}
                    </div>
                  )}
                  <input
                    disabled={!isEditing}
                    value={product.name}
                    onChange={(e) =>
                      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, name: e.target.value } : p)))
                    }
                    style={{ marginTop: 8, width: "100%" }}
                  />
                  <input
                    disabled={!isEditing}
                    value={product.description}
                    onChange={(e) =>
                      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, description: e.target.value } : p)))
                    }
                    style={{ marginTop: 8, width: "100%" }}
                  />
                  <input
                    disabled={!isEditing}
                    value={product.imageUrl ?? ""}
                    onChange={(e) =>
                      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, imageUrl: e.target.value } : p)))
                    }
                    style={{ marginTop: 8, width: "100%" }}
                    placeholder="Imagen principal URL"
                  />
                  <textarea
                    disabled={!isEditing}
                    value={galleryUrls.join("\n")}
                    onChange={(e) =>
                      setProducts((prev) =>
                        prev.map((p) =>
                          p.id === product.id ? { ...p, imageUrls: parseGalleryInput(e.target.value) } : p
                        )
                      )
                    }
                    style={{ marginTop: 8, width: "100%", minHeight: 92, resize: "vertical" }}
                    placeholder="Galeria URLs (una por linea o separadas por coma)"
                  />
                  <div className="row" style={{ marginTop: 8 }}>
                    <input
                      disabled={!isEditing}
                      type="number"
                      step="0.01"
                      value={Number(product.price)}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, price: String(Number(e.target.value)) } : p)))
                      }
                      style={{ width: 110 }}
                    />
                    <input
                      disabled={!isEditing}
                      type="number"
                      value={product.stock}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: Number(e.target.value) } : p)))
                      }
                      style={{ width: 90 }}
                    />
                    <select
                      disabled={!isEditing}
                      value={product.category ?? ""}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, category: e.target.value || null } : p)))
                      }
                    >
                      <option value="">Sin categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p style={{ marginBottom: 6 }}>Estado: {product.isActive ? "ACTIVO" : "INACTIVO"}</p>
                  <div className="row">
                    {isEditing ? (
                      <>
                        <button onClick={() => updateProduct(product)}>Guardar</button>
                        <button onClick={() => setEditingId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setEditingId(product.id)}>Editar</button>
                    )}
                    <button onClick={() => toggleProductStatus(product)}>
                      {product.isActive ? "Desactivar" : "Reactivar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {productPageNumbers.map((page) => (
              <button key={page} onClick={() => setProductPage(page)} disabled={currentProductPage === page}>
                {page}
              </button>
            ))}
          </div>
        </>
      ) : activeTab === "categories" ? (
        <section className="card">
          <h3>Categorias</h3>
          <form className="row" onSubmit={createCategory} style={{ marginBottom: 12 }}>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoria"
              style={{ minWidth: 260 }}
            />
            <select value={newCategoryParentId} onChange={(e) => setNewCategoryParentId(e.target.value)}>
              <option value="">Sin categoria padre</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button type="submit">Agregar</button>
          </form>

          <div className="grid">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.id;
              return (
                <article key={category.id} className="card">
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Padre: {category.parent_name ?? "Ninguno"}
                  </p>
                  <input
                    value={category.name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, name: e.target.value } : item)))
                    }
                    style={{ width: "100%", marginBottom: 10 }}
                  />
                  <select
                    disabled={!isEditing}
                    value={category.parent_id ?? ""}
                    onChange={(e) =>
                      setCategories((prev) =>
                        prev.map((item) =>
                          item.id === category.id
                            ? {
                                ...item,
                                parent_id: e.target.value || null,
                                parent_name: categories.find((candidate) => candidate.id === e.target.value)?.name ?? null
                              }
                            : item
                        )
                      )
                    }
                    style={{ width: "100%", marginBottom: 10 }}
                  >
                    <option value="">Sin categoria padre</option>
                    {categories
                      .filter((candidate) => candidate.id !== category.id)
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                  </select>
                  <div className="row">
                    {isEditing ? (
                      <>
                        <button onClick={() => renameCategory(category)}>Guardar</button>
                        <button onClick={() => setEditingCategoryId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setEditingCategoryId(category.id)}>Editar</button>
                    )}
                    <button onClick={() => deleteCategory(category.id)}>Eliminar</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card">
          <h3>Ordenes</h3>
          <div className="row" style={{ marginBottom: 10 }}>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Buscar por ID, email o nombre"
              style={{ minWidth: 320 }}
            />
            <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as "ALL" | Order["status"])}>
              <option value="ALL">TODAS</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="SHIPPED">SHIPPED</option>
            </select>
          </div>

          {visibleOrders.map((order) => (
            <div key={order.id} className="card" style={{ marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{order.id}</strong>
                  <p style={{ margin: 0 }}>
                    Cliente: {order.user?.fullName ?? order.user?.email ?? order.guestEmail ?? "Sin email"} - Total: S/{" "}
                    {Number(order.total).toFixed(2)}
                  </p>
                </div>
                <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="SHIPPED">SHIPPED</option>
                </select>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong>Items:</strong>
                {order.items.map((item) => (
                  <p key={item.id} style={{ margin: "4px 0 0 0" }}>
                    {item.productName} x{item.quantity} - S/ {Number(item.productPrice).toFixed(2)}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
