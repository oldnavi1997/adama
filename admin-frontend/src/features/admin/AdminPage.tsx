import { FormEvent, useEffect, useMemo, useState } from "react";
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
  createdAt: string;
};

type ProductSortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc";

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
  shippingCost: string;
  mpCommission: string;
  createdAt: string;
  user?: { email: string; fullName: string } | null;
  guestEmail?: string | null;
  address?: {
    fullName: string;
    phone: string;
    documentType: string;
    documentNumber: string;
    street: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{ id: string; productName: string; quantity: number; productPrice: string }>;
  payments: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"; amount: string }>;
};

type TabKey = "products" | "categories" | "orders" | "media";

const STATUS_BADGE: Record<string, string> = {
  PAID: "admin-status-badge--paid",
  PENDING: "admin-status-badge--pending",
  CANCELLED: "admin-status-badge--cancelled",
  SHIPPED: "admin-status-badge--shipped",
  APPROVED: "admin-status-badge--approved",
  REJECTED: "admin-status-badge--rejected",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
  SHIPPED: "Enviado",
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`admin-order-chevron${open ? " is-open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("products");

  const [productQuery, setProductQuery] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productSort, setProductSort] = useState<ProductSortKey>("newest");

  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | Order["status"]>("ALL");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  async function loadProducts() {
    const pageSize = 50;
    let page = 1;
    const all: Product[] = [];
    while (true) {
      const res = await api<ProductsResponse>(`/products?page=${page}&pageSize=${pageSize}&includeInactive=true`, { auth: true });
      all.push(...res.data);
      if (all.length >= res.total || res.data.length === 0) break;
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

  // --- KPIs ---
  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + Number(o.total), 0), [orders]);
  const paidOrders = useMemo(() => orders.filter((o) => o.status === "PAID" || o.status === "SHIPPED").length, [orders]);

  // --- Product filtering, sorting & pagination ---
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = !productCategoryFilter || (product.category ?? "") === productCategoryFilter;
      const query = productQuery.trim().toLowerCase();
      const matchesQuery = !query || [product.name, product.description, product.category ?? ""].some((v) => v.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });

    const sorted = [...filtered];
    switch (productSort) {
      case "name-asc":   sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc":  sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price-asc":  sorted.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price-desc": sorted.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "stock-asc":  sorted.sort((a, b) => a.stock - b.stock); break;
      case "stock-desc": sorted.sort((a, b) => b.stock - a.stock); break;
      case "oldest":     sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "newest":
      default:           sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return sorted;
  }, [products, productQuery, productCategoryFilter, productSort]);

  function toggleProductSort(column: "name" | "price" | "stock") {
    setProductSort((prev) => {
      if (prev === `${column}-asc`) return `${column}-desc`;
      if (prev === `${column}-desc`) return `${column}-asc`;
      return `${column}-asc`;
    });
  }

  function sortArrow(column: "name" | "price" | "stock") {
    if (productSort === `${column}-asc`) return " ▲";
    if (productSort === `${column}-desc`) return " ▼";
    return "";
  }

  const productsPerPage = 12;
  const totalProductPages = Math.max(1, Math.ceil(visibleProducts.length / productsPerPage));
  const currentProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = visibleProducts.slice(
    (currentProductPage - 1) * productsPerPage,
    currentProductPage * productsPerPage
  );
  const productStart = (currentProductPage - 1) * productsPerPage + 1;
  const productEnd = Math.min(currentProductPage * productsPerPage, visibleProducts.length);

  useEffect(() => { setProductPage(1); }, [productQuery, productCategoryFilter, productSort]);
  useEffect(() => { if (productPage > totalProductPages) setProductPage(totalProductPages); }, [productPage, totalProductPages]);

  // --- Order filtering & pagination ---
  const visibleOrders = orders.filter((order) => {
    const matchesStatus = orderStatusFilter === "ALL" || order.status === orderStatusFilter;
    const query = orderQuery.trim().toLowerCase();
    if (!matchesStatus) return false;
    if (!query) return true;
    return [order.id, order.user?.email ?? "", order.user?.fullName ?? "", order.guestEmail ?? "", order.address?.fullName ?? ""].some((v) =>
      v.toLowerCase().includes(query)
    );
  });

  const ordersPerPage = 10;
  const totalOrderPages = Math.max(1, Math.ceil(visibleOrders.length / ordersPerPage));
  const currentOrderPage = Math.min(orderPage, totalOrderPages);
  const paginatedOrders = visibleOrders.slice(
    (currentOrderPage - 1) * ordersPerPage,
    currentOrderPage * ordersPerPage
  );
  const orderStart = (currentOrderPage - 1) * ordersPerPage + 1;
  const orderEnd = Math.min(currentOrderPage * ordersPerPage, visibleOrders.length);

  useEffect(() => { setOrderPage(1); }, [orderQuery, orderStatusFilter]);
  useEffect(() => { if (orderPage > totalOrderPages) setOrderPage(totalOrderPages); }, [orderPage, totalOrderPages]);

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
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) return;
    try {
      setError("");
      await api(`/products/categories/${categoryId}`, { method: "DELETE", auth: true });
      await Promise.all([loadCategories(), loadProducts()]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "products", label: "Productos" },
    { key: "categories", label: "Categorías" },
    { key: "orders", label: "Órdenes" },
    { key: "media", label: "Medios" },
  ];

  return (
    <section className="admin-shell">
      <div className="admin-header">
        <h1>Panel Admin</h1>
        <p>Plataforma de gestión separada del sitio principal.</p>
      </div>

      {!loading && (
        <div className="admin-kpi-row">
          <div className="admin-kpi-card">
            <p className="admin-kpi-label">Productos</p>
            <p className="admin-kpi-value">{products.length}</p>
          </div>
          <div className="admin-kpi-card">
            <p className="admin-kpi-label">Órdenes</p>
            <p className="admin-kpi-value">{orders.length}</p>
          </div>
          <div className="admin-kpi-card">
            <p className="admin-kpi-label">Pagadas</p>
            <p className="admin-kpi-value">{paidOrders}</p>
          </div>
          <div className="admin-kpi-card">
            <p className="admin-kpi-label">Ingresos totales</p>
            <p className="admin-kpi-value">S/ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="admin-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-tab${activeTab === tab.key ? " admin-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando panel...</p>
      ) : activeTab === "products" ? (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Productos</h3>
            <button type="button" className="admin-btn-primary" onClick={() => navigate("/products/new")}>
              + Añadir nuevo
            </button>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, descripción o categoría"
              style={{ flex: 1, minWidth: 200 }}
            />
          </div>

          <div className="row admin-category-pills" style={{ gap: 6 }}>
            <button
              type="button"
              onClick={() => setProductCategoryFilter("")}
              className={productCategoryFilter === "" ? "active" : ""}
            >
              Todas ({products.length})
            </button>
            {categories.map((category) => {
              const count = products.filter((p) => (p.category ?? "") === category.name).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setProductCategoryFilter(category.name)}
                  className={productCategoryFilter === category.name ? "active" : ""}
                >
                  {category.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="card" style={{ overflowX: "auto" }}>
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th className="sortable-th" onClick={() => toggleProductSort("name")}>Nombre{sortArrow("name")}</th>
                  <th className="sortable-th" onClick={() => toggleProductSort("price")}>Precio{sortArrow("price")}</th>
                  <th>Categoría</th>
                  <th className="sortable-th" onClick={() => toggleProductSort("stock")}>Stock{sortArrow("stock")}</th>
                  <th>Estado</th>
                  <th>
                    <button
                      type="button"
                      className="sort-date-btn"
                      onClick={() => setProductSort((p) => p === "newest" ? "oldest" : "newest")}
                      title="Ordenar por fecha"
                    >
                      Fecha {productSort === "newest" ? "▼" : productSort === "oldest" ? "▲" : ""}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const previewImage = product.imageUrl || product.imageUrls?.[0] || "";
                  return (
                    <tr key={product.id} className="admin-products-row" onClick={() => navigate(`/products/${product.id}`)}>
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
                        <button type="button" onClick={() => navigate(`/products/${product.id}`)}>Editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalProductPages > 1 && (
            <Pagination
              current={currentProductPage}
              total={totalProductPages}
              onChange={setProductPage}
              showing={`Mostrando ${productStart}–${productEnd} de ${visibleProducts.length}`}
            />
          )}
        </>
      ) : activeTab === "categories" ? (
        <section className="card">
          <h3>Categorías</h3>
          <form className="row" onSubmit={createCategory} style={{ marginBottom: 12 }}>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoría"
              style={{ minWidth: 260 }}
            />
            <select value={newCategoryParentId} onChange={(e) => setNewCategoryParentId(e.target.value)}>
              <option value="">Sin categoría padre</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <button type="submit" className="admin-btn-primary">Agregar</button>
          </form>

          <div className="grid">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.id;
              return (
                <article key={category.id} className={`admin-category-card${isEditing ? " is-editing" : ""}`}>
                  <p className="admin-category-parent">
                    Padre: {category.parent_name ?? "Ninguno"}
                  </p>
                  <input
                    value={category.name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, name: e.target.value } : item)))
                    }
                    className="admin-category-input"
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
                                parent_name: categories.find((c) => c.id === e.target.value)?.name ?? null
                              }
                            : item
                        )
                      )
                    }
                    className="admin-category-input"
                  >
                    <option value="">Sin categoría padre</option>
                    {categories
                      .filter((c) => c.id !== category.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  <div className="row">
                    {isEditing ? (
                      <>
                        <button type="button" className="admin-btn-primary" onClick={() => renameCategory(category)}>Guardar</button>
                        <button type="button" onClick={() => setEditingCategoryId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setEditingCategoryId(category.id)}>Editar</button>
                    )}
                    <button type="button" className="admin-btn-danger" onClick={() => deleteCategory(category.id)}>Eliminar</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : activeTab === "media" ? (
        <MediaManagerTab />
      ) : (
        <section>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Órdenes</h3>
          </div>
          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Buscar por ID, email o nombre"
              style={{ flex: 1, minWidth: 200 }}
            />
            <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value as "ALL" | Order["status"])}>
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="PAID">Pagado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="SHIPPED">Enviado</option>
            </select>
          </div>

          {paginatedOrders.length === 0 ? (
            <p className="muted">No hay órdenes que coincidan con la búsqueda.</p>
          ) : (
            paginatedOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const subtotal = order.items.reduce((acc, item) => acc + Number(item.productPrice) * item.quantity, 0);
              const customerName = order.address?.fullName ?? order.user?.fullName ?? order.user?.email ?? order.guestEmail ?? "Sin datos";
              const customerEmail = order.user?.email ?? order.guestEmail ?? "—";
              const customerPhone = order.address?.phone ?? "—";

              return (
                <div key={order.id} className="admin-order-card">
                  <div className="admin-order-summary" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                    <span className="admin-order-id">#{order.id.slice(-6)}</span>
                    <span className="admin-order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span className={`admin-status-badge ${STATUS_BADGE[order.status] ?? ""}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="admin-order-customer">{customerName}</span>
                    <span className="admin-order-total">S/ {Number(order.total).toFixed(2)}</span>
                    <Chevron open={isExpanded} />
                  </div>

                  {isExpanded && (
                    <div className="admin-order-details">
                      <div className="admin-order-status-row">
                        <span className="admin-order-label" style={{ margin: 0 }}>Cambiar estado:</span>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="PAID">Pagado</option>
                          <option value="CANCELLED">Cancelado</option>
                          <option value="SHIPPED">Enviado</option>
                        </select>
                      </div>

                      <div className="admin-order-grid">
                        <div>
                          <p className="admin-order-label">Cliente</p>
                          <p className="admin-order-text">{customerName}</p>
                          <p className="admin-order-text">{customerEmail}</p>
                          <p className="admin-order-text">Tel: {customerPhone}</p>
                          {order.address?.documentNumber && (
                            <p className="admin-order-text">
                              {(order.address.documentType || "DNI").toUpperCase()}: {order.address.documentNumber}
                            </p>
                          )}
                        </div>

                        {order.address && (
                          <div>
                            <p className="admin-order-label">Envío</p>
                            <p className="admin-order-text">{order.address.street}</p>
                            <p className="admin-order-text">
                              {order.address.district ? `${order.address.district}, ` : ""}{order.address.city}, {order.address.state}
                            </p>
                            <p className="admin-order-text">
                              CP: {order.address.postalCode} — {order.address.country}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="admin-order-items">
                        <p className="admin-order-label">Productos</p>
                        {order.items.map((item) => (
                          <div key={item.id} className="admin-order-item-row">
                            <span>{item.productName} x{item.quantity}</span>
                            <span>S/ {(Number(item.productPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="admin-order-totals">
                        <div className="admin-order-total-row">
                          <span>Subtotal productos</span>
                          <span>S/ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="admin-order-total-row">
                          <span>Envío</span>
                          <span>S/ {Number(order.shippingCost).toFixed(2)}</span>
                        </div>
                        <div className="admin-order-total-row">
                          <span>Comisión MP</span>
                          <span>S/ {Number(order.mpCommission).toFixed(2)}</span>
                        </div>
                        <div className="admin-order-total-row admin-order-total-row--bold">
                          <span>Total</span>
                          <span>S/ {Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>

                      {order.payments.length > 0 && (
                        <div className="admin-order-payment">
                          Pago: {order.payments.map((p) => (
                            <span key={p.id}>
                              <span className={`admin-status-badge ${STATUS_BADGE[p.status] ?? ""}`}>{p.status}</span>
                              {" "}S/ {Number(p.amount).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {totalOrderPages > 1 && (
            <Pagination
              current={currentOrderPage}
              total={totalOrderPages}
              onChange={setOrderPage}
              showing={`Mostrando ${orderStart}–${orderEnd} de ${visibleOrders.length}`}
            />
          )}
        </section>
      )}
    </section>
  );
}

function Pagination({ current, total, onChange, showing }: { current: number; total: number; onChange: (p: number) => void; showing: string }) {
  const pages: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    }
  }

  const items: (number | "...")[] = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) items.push("...");
    items.push(pages[i]);
  }

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">{showing}</span>
      <div className="admin-pagination-buttons">
        <button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)}>‹</button>
        {items.map((item, idx) =>
          item === "..." ? (
            <span key={`dots-${idx}`} style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={current === item ? "is-current" : ""}
              onClick={() => onChange(item)}
              disabled={current === item}
            >
              {item}
            </button>
          )
        )}
        <button type="button" disabled={current >= total} onClick={() => onChange(current + 1)}>›</button>
      </div>
    </div>
  );
}
