import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../app/api";
import { productDetailPath } from "../../app/slug";

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

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: PublicCategory[];
};

export function CategoryPage() {
  const { categorySlug } = useParams();
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
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
    api<PublicCategory[]>("/products/categories/public")
      .then((res) => setCategories(res))
      .catch(() => setCategories([]));
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

  if (!currentCategory) {
    return (
      <section>
        <h1>Categoria no encontrada</h1>
        <Link to="/">Volver al catalogo</Link>
      </section>
    );
  }

  return (
    <section>
      <div className="catalog-hero">
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
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div className="grid" style={{ marginTop: 12 }}>
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

      {totalPages > 1 && (
        <div className="row" style={{ marginTop: 12 }}>
          {pageNumbers.map((pageNumber) => (
            <button key={pageNumber} onClick={() => setPage(pageNumber)} disabled={pageNumber === page}>
              {pageNumber}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
