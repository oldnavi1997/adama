import { useEffect, useMemo, useState } from "react";
import { api } from "../../app/api";

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: string;
  signature: string;
};

type UploadedAsset = {
  id?: string;
  url: string;
  resourceType: "image" | "video" | "raw";
  originalName: string;
  bytes: number;
  folder?: string;
  createdAt?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  resource_type?: "image" | "video" | "raw";
  bytes?: number;
};

export function MediaManagerTab() {
  const [folder, setFolder] = useState("adama/products");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<UploadedAsset[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "image" | "video">("");

  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const filteredAssets = useMemo(
    () =>
      uploaded.filter((asset) => {
        const matchesType = !typeFilter || asset.resourceType === typeFilter;
        if (!matchesType) return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return `${asset.originalName} ${asset.url}`.toLowerCase().includes(query);
      }),
    [uploaded, search, typeFilter]
  );

  async function deleteAsset(asset: UploadedAsset) {
    if (!asset.id) return;
    const confirmed = window.confirm("¿Eliminar este medio de la biblioteca?");
    if (!confirmed) return;
    try {
      await api<void>(`/media/assets/${asset.id}`, {
        method: "DELETE",
        auth: true
      });
      setUploaded((prev) => prev.filter((item) => item.id !== asset.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadLibrary() {
    try {
      setLoadingLibrary(true);
      const assets = await api<UploadedAsset[]>(`/media/assets?limit=150`, { auth: true });
      setUploaded(assets);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingLibrary(false);
    }
  }

  useEffect(() => {
    loadLibrary().catch(() => {
      // no-op
    });
  }, []);

  async function uploadAll() {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setError("");

      const signature = await api<SignatureResponse>("/media/signature", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ folder: folder.trim() })
      });

      const uploadedBatch: UploadedAsset[] = [];
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signature.apiKey);
        body.append("timestamp", signature.timestamp);
        body.append("folder", signature.folder);
        body.append("signature", signature.signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`, {
          method: "POST",
          body
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(`Cloudinary upload failed for ${file.name}: ${message}`);
        }

        const payload = (await response.json()) as CloudinaryUploadResponse;
        const secureUrl = String(payload.secure_url ?? "").trim();
        if (!secureUrl) {
          throw new Error(`Cloudinary did not return secure_url for ${file.name}`);
        }

        uploadedBatch.push({
          url: secureUrl,
          resourceType: payload.resource_type ?? "raw",
          originalName: file.name,
          bytes: Number(payload.bytes ?? file.size),
          folder: signature.folder
        });
      }

      const persistedAssets: UploadedAsset[] = [];
      for (const asset of uploadedBatch) {
        const saved = await api<UploadedAsset>("/media/assets", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            url: asset.url,
            resourceType: asset.resourceType,
            originalName: asset.originalName,
            bytes: asset.bytes,
            folder: asset.folder ?? folder.trim()
          })
        });
        persistedAssets.push(saved);
      }

      setUploaded((prev) => [...persistedAssets, ...prev]);
      setFiles([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card">
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Medios</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Sube imágenes y videos directo a Cloudinary para reutilizarlos en productos.
      </p>

      {error && <p className="error">{error}</p>}

      <div className="row" style={{ marginBottom: 10 }}>
        <input
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="Carpeta Cloudinary"
          style={{ minWidth: 220 }}
        />
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          disabled={uploading}
        />
        <button type="button" onClick={uploadAll} disabled={uploading || files.length === 0}>
          {uploading ? "Subiendo..." : "Subir a Cloudinary"}
        </button>
        <button type="button" onClick={() => loadLibrary()} disabled={uploading || loadingLibrary}>
          {loadingLibrary ? "Cargando..." : "Actualizar biblioteca"}
        </button>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Archivos seleccionados: {files.length} · {(totalBytes / (1024 * 1024)).toFixed(2)} MB
      </p>

      <div className="row" style={{ marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o URL"
          style={{ minWidth: 260 }}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "" | "image" | "video")}>
          <option value="">Todos</option>
          <option value="image">Imágenes</option>
          <option value="video">Videos</option>
        </select>
      </div>

      {filteredAssets.length > 0 ? (
        <div className="admin-media-grid">
          {filteredAssets.map((asset, index) => (
            <article key={`${asset.url}-${index}`} className="admin-media-card">
              {asset.resourceType === "video" ? (
                <video src={asset.url} className="admin-media-preview" controls />
              ) : (
                <img src={asset.url} alt={asset.originalName} className="admin-media-preview" />
              )}
              <div>
                <p style={{ margin: "0 0 4px 0" }}>{asset.originalName}</p>
                <p className="muted" style={{ margin: 0 }}>
                  {(asset.bytes / (1024 * 1024)).toFixed(2)} MB
                </p>
                {asset.folder ? (
                  <p className="muted" style={{ margin: "2px 0 0 0" }}>
                    {asset.folder}
                  </p>
                ) : null}
              </div>
              <div className="row">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(asset.url);
                    } catch {
                      // no-op
                    }
                  }}
                >
                  Copiar URL
                </button>
                <a href={asset.url} target="_blank" rel="noreferrer">
                  Abrir
                </a>
                {asset.id ? (
                  <button type="button" onClick={() => deleteAsset(asset)}>
                    Eliminar
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No hay medios guardados con ese filtro.</p>
      )}
    </section>
  );
}
