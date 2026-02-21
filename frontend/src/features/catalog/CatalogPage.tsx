import { useEffect, useState } from "react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl?: string | null;
};

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    api<{ data: Product[] }>(`/products?search=${encodeURIComponent(search)}`)
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [search]);

  return (
    <section>
      <h1>Catalogo</h1>
      <div className="row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos" />
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        {products.map((p) => (
          <article key={p.id} className="card">
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: 150, objectFit: "cover" }} />}
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p>S/ {Number(p.price).toFixed(2)}</p>
            <p>Stock: {p.stock}</p>
            <button
              onClick={() =>
                addItem({
                  productId: p.id,
                  name: p.name,
                  price: Number(p.price)
                })
              }
              disabled={p.stock < 1}
            >
              Agregar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
