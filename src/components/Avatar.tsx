import { User } from "lucide-react";
import { useFileUrl } from "../hooks/useFileUrl";

type Props = {
  fileId?: string;
  name: string;
  size?: number;
  className?: string;
};

export function Avatar({ fileId, name, size = 56, className = "" }: Props) {
  const url = useFileUrl(fileId);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-ink-100 text-ink-500 flex items-center justify-center font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User size={size * 0.5} />
      )}
    </div>
  );
}
