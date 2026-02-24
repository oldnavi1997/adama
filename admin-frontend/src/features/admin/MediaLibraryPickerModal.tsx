import { useEffect, useMemo, useState } from "react";
import { api } from "../../app/api";

type MediaAsset = {
  id: string;
  url: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  bytes: number;
  folder?: string;
};

type MediaLibraryPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
  title?: string;
  multiple?: boolean;
  filterType?: "" | "image" | "video";
};

export function MediaLibraryPickerModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Biblioteca de medios",
  multiple = false,
  filterType = "image"
}: MediaLibraryPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelectedUrls([]);
    const typeQuery = filterType ? `&type=${filterType}` : "";
    api<MediaAsset[]>(`/media/assets?limit=200${typeQuery}`, { auth: true })
      .then((res) => setAssets(res))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [isOpen, filterType]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => `${asset.originalName} ${asset.url}`.toLowerCase().includes(query));
  }, [assets, search]);

  const toggleSelect = (url: string) => {
    if (!multiple) {
      setSelectedUrls((prev) => (prev[0] === url ? [] : [url]));
      return;
    }
    setSelectedUrls((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]));
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <section className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="row" style={{ marginBottom: 10 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en biblioteca"
            style={{ minWidth: 260 }}
          />
        </div>

        {loading ? (
          <p>Cargando biblioteca...</p>
        ) : filteredAssets.length === 0 ? (
          <p className="muted">No hay medios disponibles.</p>
        ) : (
          <div className="admin-media-grid">
            {filteredAssets.map((asset) => {
              const isSelected = selectedUrls.includes(asset.url);
              return (
                <article
                  key={asset.id}
                  className={`admin-media-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => toggleSelect(asset.url)}
                >
                  {asset.resourceType === "video" ? (
                    <video src={asset.url} className="admin-media-preview" />
                  ) : (
                    <img src={asset.url} alt={asset.originalName} className="admin-media-preview" />
                  )}
                  <p style={{ margin: 0 }}>{asset.originalName || "Sin nombre"}</p>
                </article>
              );
            })}
          </div>
        )}

        <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={selectedUrls.length === 0}
            onClick={() => {
              onConfirm(selectedUrls);
              onClose();
            }}
          >
            {multiple ? "Agregar seleccionadas" : "Usar imagen"}
          </button>
        </div>
      </section>
    </div>
  );
}
