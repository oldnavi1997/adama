import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../app/api";
import { productDetailPath } from "../../app/slug";
import {
  fetchPublicCategories,
  getCachedPublicCategories,
  type PublicCategory
} from "../../app/publicCategories";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
};

type ProductsResponse = {
  data: Product[];
  page: number;
  pageSize: number;
  total: number;
};

export function CategoryPage() {
  const topRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(1);
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState<PublicCategory[]>(getCachedPublicCategories() ?? []);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoriesLoading, setCategoriesLoading] = useState(!getCachedPublicCategories());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 12;

  const flattenCategories = (nodes: PublicCategory[]): PublicCategory[] =>
    nodes.flatMap((node) => [node, ...flattenCategories(node.children)]);

  const findCategoryBySlug = (nodes: PublicCategory[], slug: string): PublicCategory | undefined => {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      const child = findCategoryBySlug(node.children, slug);
      if (child) return child;
    }
    return undefined;
  };

  const currentCategory = useMemo(() => (categorySlug ? findCategoryBySlug(categories, categorySlug) : undefined), [categories, categorySlug]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    const cached = getCachedPublicCategories();
    if (cached) {
      setCategories(cached);
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    fetchPublicCategories(api)
      .then((res) => setCategories(res))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [currentCategory?.id, sortBy]);

  useEffect(() => {
    async function loadCategoryProducts() {
      if (!currentCategory) {
        setProducts([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const descendants = flattenCategories([currentCategory]).map((category) => category.name);
        const categoryQuery =
          descendants.length > 1
            ? `categories=${encodeURIComponent(descendants.join(","))}`
            : `category=${encodeURIComponent(currentCategory.name)}`;
        const res = await api<ProductsResponse>(
          `/products?${categoryQuery}&sortBy=${encodeURIComponent(sortBy)}&page=${page}&pageSize=${pageSize}`
        );
        setProducts(res.data);
        setTotal(res.total);
      } catch (err) {
        setProducts([]);
        setTotal(0);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryProducts().catch((err) => {
      setLoading(false);
      setError((err as Error).message);
    });
  }, [currentCategory, page, sortBy]);

  useEffect(() => {
    if (!loading && page !== prevPageRef.current) {
      prevPageRef.current = page;
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, page]);

  if (categoriesLoading) {
    return (
      <section>
        <p>Cargando categoría…</p>
      </section>
    );
  }

  if (!currentCategory) {
    return (
      <section>
        <h1>Categoria no encontrada</h1>
        <Link to="/">Volver al catalogo</Link>
      </section>
    );
  }

  return (
    <section className="category-page">
      <div ref={topRef} className="catalog-hero">
        <h1>{currentCategory.name}</h1>
        <p className="muted">Mostrando {products.length} de {total} resultados</p>
      </div>
      <div className="catalog-toolbar">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="latest">Orden predeterminado</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
        <ul className="category-view-tabs" role="tablist" aria-label="Vista de productos">
          <li>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "grid"}
              aria-label="Cuadrícula 2 columnas"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              <span className="category-view-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              aria-label="Lista 1 producto"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              <span className="category-view-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </span>
            </button>
          </li>
        </ul>
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div className={`category-products category-products--${viewMode}`}>
      <div className="grid category-products-grid" style={{ marginTop: 12 }}>
        {products.map((product) => (
          <article key={product.id} className="card catalog-card">
            {(product.imageUrl || product.imageUrls?.[0]) && (
              <Link to={productDetailPath(product)}>
                <img src={product.imageUrl || product.imageUrls?.[0]} alt={product.name} className="catalog-image" />
              </Link>
            )}
            <h3>
              <Link to={productDetailPath(product)}>{product.name}</Link>
            </h3>
            <p className="catalog-price">S/ {Number(product.price).toFixed(2)}</p>
          </article>
        ))}
      </div>
      </div>

      {totalPages > 1 && (
        <div className="row" style={{ marginTop: 12 }}>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              disabled={pageNumber === page}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
