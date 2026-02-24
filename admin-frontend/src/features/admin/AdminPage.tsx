import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../app/api";
import { MediaManagerTab } from "./MediaManagerTab";

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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "orders" | "media">("products");
  const [productQuery, setProductQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | Order["status"]>("ALL");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

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
    const matchesCategory =
      !productCategoryFilter || (product.category ?? "") === productCategoryFilter;
    const query = productQuery.trim().toLowerCase();
    const matchesQuery = !query || [product.name, product.description, product.category ?? ""].some((v) => v.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
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
  }, [productQuery, productCategoryFilter]);

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
        <button onClick={() => setActiveTab("media")} disabled={activeTab === "media"}>
          Medios
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando panel...</p>
      ) : activeTab === "products" ? (
        <>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Productos</h3>
            <button type="button" onClick={() => navigate("/products/new")}>
              Añadir nuevo
            </button>
          </div>

          <div className="row" style={{ marginTop: 12, marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, descripcion o categoria"
              style={{ minWidth: 280 }}
            />
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              style={{ minWidth: 180 }}
              title="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row admin-category-pills" style={{ marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <button
              type="button"
              onClick={() => setProductCategoryFilter("")}
              className={productCategoryFilter === "" ? "active" : ""}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setProductCategoryFilter(category.name)}
                className={productCategoryFilter === category.name ? "active" : ""}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const previewImage = product.imageUrl || product.imageUrls?.[0] || "";
                  return (
                    <tr
                      key={product.id}
                      className="admin-products-row"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <td>
                        {previewImage ? (
                          <img src={previewImage} alt="" className="admin-products-thumb" />
                        ) : (
                          <span className="admin-products-no-thumb">—</span>
                        )}
                      </td>
                      <td className="admin-products-name">{product.name}</td>
                      <td>S/ {Number(product.price).toFixed(2)}</td>
                      <td>{product.category ?? "—"}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={product.isActive ? "admin-status-active" : "admin-status-inactive"}>
                          {product.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => navigate(`/products/${product.id}`)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
      ) : activeTab === "media" ? (
        <MediaManagerTab />
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
