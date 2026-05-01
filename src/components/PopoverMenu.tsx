import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
};

/**
 * Renders its children in a portal anchored to the given element.
 * Auto-flips above the anchor if there isn't enough room below.
 * Closes on outside click / Escape / scroll.
 */
export function PopoverMenu({
  open,
  anchor,
  onClose,
  width = 192,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setPos(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const menuHeight = ref.current?.offsetHeight ?? 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const flip = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;
    const top = flip ? rect.top - menuHeight - 6 : rect.bottom + 6;
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setPos({ top, left });
  }, [open, anchor, width]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        ref.current?.contains(e.target as Node) ||
        anchor?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose, anchor]);

  if (!open) return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[60] rounded-lg border border-ink-100 bg-white shadow-cardHover py-1 animate-scaleIn origin-top-right"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width,
        visibility: pos ? "visible" : "hidden",
      }}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  );
}

export function PopoverItem({
  icon,
  children,
  onClick,
  variant = "default",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-ink-700 hover:bg-ink-50",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
