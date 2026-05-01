import type { Person } from "../types";
import { Avatar } from "./Avatar";

export function PersonDragOverlay({ person }: { person: Person }) {
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  return (
    <div className="rotate-2 scale-105 cursor-grabbing">
      <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-cardHover w-[280px]">
        <Avatar file={person.photo} name={fullName} size={52} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink-900 truncate">
            {fullName || "Unbenannt"}
          </h3>
          {person.jobWish && (
            <p className="text-xs text-ink-500 truncate mt-0.5">
              {person.jobWish}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
