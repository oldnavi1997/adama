import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../app/api";
import { productDetailPath, slugify } from "../../app/slug";

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

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const params = new URLSearchParams({
      search
    });
    if (category) {
      params.set("category", category);
    }

    api<{ data: Product[] }>(`/products?${params.toString()}`)
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [search, category]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort() as string[];
  }, [products]);

  const sortedProducts = useMemo(() => {
    const base = [...products];
    if (sortBy === "price-asc") {
      return base.sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sortBy === "price-desc") {
      return base.sort((a, b) => Number(b.price) - Number(a.price));
    }
    if (sortBy === "name-asc") {
      return base.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "name-desc") {
      return base.sort((a, b) => b.name.localeCompare(a.name));
    }
    return base;
  }, [products, sortBy]);

  return (
    <section>
      <div className="catalog-hero">
        <h1>Catalogo de productos</h1>
        <p className="muted">Mostrando {sortedProducts.length} resultados</p>
      </div>

      <div className="catalog-toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorias</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="default">Orden predeterminado</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        {sortedProducts.map((p) => (
          <article key={p.id} className="card catalog-card">
            {(p.imageUrl || p.imageUrls?.[0]) && (
              <Link to={productDetailPath(p)}>
                <img src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} className="catalog-image" />
              </Link>
            )}
            {p.category && (
              <p className="catalog-category">
                <Link to={`/categoria/${slugify(p.category)}`}>{p.category}</Link>
              </p>
            )}
            <h3>
              <Link to={productDetailPath(p)}>{p.name}</Link>
            </h3>
            <p className="catalog-price">S/ {Number(p.price).toFixed(2)}</p>
          </article>
        ))}
      </div>

      {sortedProducts.length === 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          No se encontraron productos para esta busqueda.
        </div>
      )}
    </section>
  );
}
