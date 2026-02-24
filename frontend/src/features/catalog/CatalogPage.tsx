import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../app/api";
import { productDetailPath, slugify } from "../../app/slug";

const META_TITLE = "Adamantio | Anillos de Promesa y Joyería Plata 925 – Regalos con Significado en Perú";
const META_DESCRIPTION =
  "Joyas con mensajes ocultos y conexión eterna. Anillos de promesa, pulseras para parejas y plata de ley 925. Regalos únicos para ella y él. Envíos a todo Perú.";

const FEATURED_CATEGORIES = [
  {
    name: "Anillos de Pareja",
    slug: "anillos-de-pareja",
    description:
      "Símbolos de un compromiso que trasciende lo visible. Cada anillo guarda un mensaje secreto que solo ustedes dos pueden revelar. Diseños en plata 925 que cuentan vuestra historia.",
    cta: "Ver anillos de pareja"
  },
  {
    name: "Pulseras Vínculo Eterno",
    slug: "pulseras-vinculo-eterno",
    description:
      "Dos piezas que se complementan, como dos almas unidas. Pulseras de plata de ley para llevar el vínculo siempre cerca. El regalo perfecto para decir «siempre contigo».",
    cta: "Ver pulseras"
  }
] as const;

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
    document.title = META_TITLE;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", META_DESCRIPTION);
  }, []);

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
    <section className="home-page">
      <section className="home-hero" aria-label="Hero">
        <div className="home-hero-overlay" aria-hidden="true" />
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Revela tu Histora de Amor
          </h1>
          <p className="home-hero-subtitle">
            Anillos con mensajes ocultos que brillan a la luz.
          </p>
          <Link to="/producto/proyeccion-de-amor-anillo-de-plata-925-con-mensaje-oculto-para-ella-y-el-cmlyd257v002mibs03iig5yl3" className="home-hero-cta">
            DESCUBRE LA MAGIA
          </Link>
        </div>
      </section>

      <section className="home-intro">
        <h2 className="home-intro-title">
          No solo joyas: mensajes ocultos y una conexión eterna
        </h2>
        <p className="home-intro-subtitle">
          Piezas en plata 925 que guardan un secreto solo para ustedes dos. Regalos con significado que cuentan vuestra historia.
        </p>
        <Link to="#productos" className="home-intro-cta">
          Mira la colección
        </Link>
      </section>

      <section className="home-value" aria-label="Por qué Adamantio">
        <h2 className="home-value-heading">Por qué Adamantio</h2>
        <div className="home-value-grid">
          <div className="home-value-block">
            <h3>Plata 925 de ley</h3>
            <p>
              Cada pieza está elaborada en plata de ley que perdura en el tiempo. Calidad que se siente y se ve, para un regalo que perdure tanto como vuestro vínculo.
            </p>
          </div>
          <div className="home-value-block">
            <h3>Talla única, para todos</h3>
            <p>
              Diseños pensados para adaptarse a cada mano. Sin preocuparte por la talla: una sola pieza que se ajusta con elegancia a quien la lleve.
            </p>
          </div>
          <div className="home-value-block">
            <h3>Mensajes secretos</h3>
            <p>
              Grabados ocultos que solo ustedes conocen. Un detalle íntimo que convierte cada joya en un símbolo único de vuestra conexión.
            </p>
          </div>
        </div>
      </section>

      <section className="home-categories" aria-label="Categorías destacadas">
        {FEATURED_CATEGORIES.map((cat) => (
          <div key={cat.slug} className="home-category-card card">
            <h3 className="home-category-title">{cat.name}</h3>
            <p className="home-category-desc">{cat.description}</p>
            <Link to={`/categoria/${cat.slug}`} className="home-category-cta">
              {cat.cta}
            </Link>
          </div>
        ))}
      </section>

      <div id="productos" className="catalog-hero">
        <h2 className="catalog-hero-title">Nuestra colección</h2>
        <p className="muted">Mostrando {sortedProducts.length} resultados</p>
      </div>

      <div className="catalog-toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
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
          <option value="name-asc">Nombre: A–Z</option>
          <option value="name-desc">Nombre: Z–A</option>
        </select>
      </div>

      <div className="grid catalog-grid" style={{ marginTop: 12 }}>
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
          No se encontraron productos para esta búsqueda.
        </div>
      )}
    </section>
  );
}
