import { Download, FileText } from "lucide-react";
import { useFileRefUrl } from "../hooks/useFileUrl";
import type { FileRef } from "../types";

type Props = {
  title: string;
  file?: FileRef;
};

export function PdfPane({ title, file }: Props) {
  const url = useFileRefUrl(file);

  return (
    <div className="flex flex-col h-full bg-ink-100/50 rounded-xl overflow-hidden border border-ink-100">
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-ink-100 shrink-0">
        <FileText size={14} className="text-ink-400" />
        <span className="text-xs font-medium text-ink-700 truncate flex-1">
          {file?.name ?? title}
        </span>
        {url && (
          <a
            href={url}
            download={file?.name}
            className="btn-ghost !p-1.5"
            aria-label="Herunterladen"
          >
            <Download size={14} />
          </a>
        )}
      </div>
      <div className="flex-1 min-h-0 bg-ink-200">
        {file && url ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            title={title}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-ink-400 gap-2 p-6 text-center">
            <FileText size={32} className="opacity-50" />
            <p className="text-sm">Kein {title} hinterlegt</p>
          </div>
        )}
      </div>
    </div>
  );
}
