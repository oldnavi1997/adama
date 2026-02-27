import { useState } from "react";

type ProductGalleryManagerProps = {
  urls: string[];
  onChange: (nextUrls: string[]) => void;
  disabled?: boolean;
  onPreview?: (url: string) => void;
};

export function ProductGalleryManager({ urls, onChange, disabled = false, onPreview }: ProductGalleryManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const addUrl = () => {
    const value = newUrl.trim();
    if (!value) return;
    onChange([...urls, value]);
    setNewUrl("");
  };

  const removeAt = (index: number) => {
    onChange(urls.filter((_, idx) => idx !== index));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex == null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    move(dragIndex, dropIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      <label className="admin-field-label">Galería del producto</label>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://.../imagen.jpg"
          className="admin-field-input"
          disabled={disabled}
        />
        <button type="button" onClick={addUrl} disabled={disabled || !newUrl.trim()}>
          Añadir
        </button>
      </div>

      {urls.length === 0 ? (
        <p className="muted" style={{ marginTop: 0 }}>Sin imágenes en la galería.</p>
      ) : (
        <div className="admin-gallery-grid">
          {urls.map((url, index) => (
            <article
              key={`${url}-${index}`}
              className={`admin-gallery-card ${overIndex === index ? "is-over" : ""}`}
              draggable={!disabled}
              onDragStart={() => {
                setDragIndex(index);
                setOverIndex(index);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (disabled) return;
                setOverIndex(index);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (disabled) return;
                handleDrop(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <img src={url} alt={`Galería ${index + 1}`} className="admin-gallery-image" onClick={() => onPreview?.(url)} />
              <div className="admin-gallery-meta">
                <small>Posición {index + 1}</small>
                {index === 0 && <small className="admin-gallery-badge">Principal</small>}
              </div>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <small className="muted">Arrastra para reordenar</small>
                <button type="button" onClick={() => removeAt(index)} disabled={disabled}>
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
