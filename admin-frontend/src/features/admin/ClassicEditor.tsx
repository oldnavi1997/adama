import { useCallback, useEffect, useRef, useState } from "react";

type EditorMode = "visual" | "code";

type ClassicEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
};

export function ClassicEditor({
  value,
  onChange,
  placeholder = "Escribe la descripción del producto…",
  disabled = false,
  className = "",
  minHeight = 280,
}: ClassicEditorProps) {
  const [mode, setMode] = useState<EditorMode>("code");
  const editableRef = useRef<HTMLDivElement>(null);

  const syncVisualToValue = useCallback(() => {
    if (editableRef.current) {
      const html = editableRef.current.innerHTML;
      if (html !== value) onChange(html);
    }
  }, [value, onChange]);

  useEffect(() => {
    if (mode === "visual" && editableRef.current && value !== editableRef.current.innerHTML) {
      editableRef.current.innerHTML = value || "";
    }
  }, [mode, value]);

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del producto</label>

      <div className="flex items-center gap-0 border border-gray-300 border-b-0 rounded-t-md overflow-hidden">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            syncVisualToValue();
            setMode("code");
          }}
          className={`px-3 py-1.5 text-sm ${mode === "code" ? "bg-white border-b-2 border-gray-800 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Código
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            syncVisualToValue();
            setMode("visual");
          }}
          className={`px-3 py-1.5 text-sm ${mode === "visual" ? "bg-white border-b-2 border-gray-800 font-medium" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Visual
        </button>
      </div>

      <div className="border border-gray-300 bg-white">
        {mode === "code" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full p-3 font-mono text-sm text-gray-800 border-0 outline-none resize-y min-w-0"
            style={{ minHeight }}
            spellCheck={false}
          />
        ) : (
          <div
            ref={editableRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            data-placeholder={placeholder}
            className="min-w-0 w-full p-3 outline-none overflow-auto"
            style={{ minHeight }}
            onInput={syncVisualToValue}
            onBlur={syncVisualToValue}
          />
        )}
      </div>
    </div>
  );
}
