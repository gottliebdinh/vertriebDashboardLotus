import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import type { FileRef } from "../types";

type Props = {
  label: string;
  accept: string;
  current?: FileRef;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  icon?: "image" | "file";
};

export function FileInput({
  label,
  accept,
  current,
  onSelect,
  onRemove,
  icon = "file",
}: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const Icon = icon === "image" ? ImageIcon : FileText;

  return (
    <div>
      <span className="label">{label}</span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
      {current ? (
        <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2">
          <Icon size={16} className="text-ink-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-900 truncate">{current.name}</p>
            <p className="text-xs text-ink-500">
              {(current.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost !p-1.5"
            onClick={() => ref.current?.click()}
          >
            Ersetzen
          </button>
          {onRemove && (
            <button
              type="button"
              className="btn-ghost !p-1.5 text-red-600 hover:!bg-red-50"
              onClick={onRemove}
              aria-label="Entfernen"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-200 px-3 py-3 text-sm text-ink-500 hover:text-ink-800 hover:border-ink-300 hover:bg-ink-50 transition-colors"
        >
          <Upload size={16} />
          Datei auswählen
        </button>
      )}
    </div>
  );
}
