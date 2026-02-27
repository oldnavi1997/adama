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

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: string;
  signature: string;
};

type MediaLibraryPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
  title?: string;
  multiple?: boolean;
  filterType?: "" | "image" | "video";
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    setSelectedUrls([]);
    setSearch("");
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

  async function handleUpload(files: FileList) {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setError("");
      const sig = await api<SignatureResponse>("/media/signature", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ folder: "adama/products" })
      });
      const uploaded: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", sig.timestamp);
        body.append("folder", sig.folder);
        body.append("signature", sig.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body });
        if (!res.ok) throw new Error(`Upload falló para ${file.name}`);
        const data = (await res.json()) as { secure_url?: string; public_id?: string };
        const url = String(data.secure_url ?? "").trim();
        if (!url) throw new Error(`Cloudinary no retornó URL para ${file.name}`);
        const saved = await api<MediaAsset>("/media/assets", {
          method: "POST",
          auth: true,
          body: JSON.stringify({ url, resourceType: "image", originalName: file.name, bytes: file.size, folder: sig.folder })
        });
        uploaded.push(saved);
      }
      setAssets((prev) => [...uploaded, ...prev]);
      setSelectedUrls((prev) => [...prev, ...uploaded.map((a) => a.url)]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) return null;

  const selectionLabel = selectedUrls.length === 0
    ? null
    : selectedUrls.length === 1
      ? "1 seleccionada"
      : `${selectedUrls.length} seleccionadas`;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <section className="admin-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-picker-header">
          <div>
            <h3 className="admin-picker-title">{title}</h3>
            {selectionLabel && <span className="admin-picker-count">{selectionLabel}</span>}
          </div>
          <button type="button" className="admin-picker-close" onClick={onClose} title="Cerrar">✕</button>
        </div>

        {/* Toolbar */}
        <div className="admin-picker-toolbar">
          <div className="admin-picker-search-wrap">
            <svg className="admin-picker-search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="admin-picker-search"
            />
          </div>
          <label className="admin-picker-upload-btn" style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files) handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <span>{uploading ? "Subiendo..." : "Subir nuevas"}</span>
          </label>
        </div>

        {error && <p className="error" style={{ margin: "0 0 8px", padding: "0 4px" }}>{error}</p>}

        {/* Grid */}
        <div className="admin-picker-body">
          {loading ? (
            <div className="admin-picker-empty">Cargando biblioteca...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="admin-picker-empty">
              {search ? "Sin resultados para esta búsqueda." : "No hay medios disponibles."}
            </div>
          ) : (
            <div className="admin-picker-grid">
              {filteredAssets.map((asset) => {
                const isSelected = selectedUrls.includes(asset.url);
                const selIndex = selectedUrls.indexOf(asset.url);
                return (
                  <article
                    key={asset.id}
                    className={`admin-picker-card${isSelected ? " is-selected" : ""}`}
                    onClick={() => toggleSelect(asset.url)}
                  >
                    <div className="admin-picker-img-wrap">
                      {asset.resourceType === "video" ? (
                        <video src={asset.url} className="admin-picker-img" />
                      ) : (
                        <img src={asset.url} alt={asset.originalName} className="admin-picker-img" loading="lazy" />
                      )}
                      {isSelected && (
                        <div className="admin-picker-check">
                          {multiple && <span>{selIndex + 1}</span>}
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="admin-picker-card-info">
                      <span className="admin-picker-card-name" title={asset.originalName}>
                        {asset.originalName || "Sin nombre"}
                      </span>
                      <span className="admin-picker-card-size">{formatBytes(asset.bytes)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="admin-picker-footer">
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {filteredAssets.length} {filteredAssets.length === 1 ? "archivo" : "archivos"}
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={selectedUrls.length === 0}
              onClick={() => {
                onConfirm(selectedUrls);
                onClose();
              }}
            >
              {multiple
                ? selectedUrls.length > 0
                  ? `Agregar ${selectedUrls.length} ${selectedUrls.length === 1 ? "imagen" : "imágenes"}`
                  : "Agregar seleccionadas"
                : "Usar imagen"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
