const LEGACY_LS_KEY = "dashboard-gevin-store";
const LS_KEY = "lotus-eagle-dashboard-store";

/** Copies persisted Zustand state from the old localStorage key once. */
export function migrateLegacyLocalStorage(): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem(LS_KEY) && localStorage.getItem(LEGACY_LS_KEY)) {
      localStorage.setItem(LS_KEY, localStorage.getItem(LEGACY_LS_KEY)!);
    }
  } catch {
    /* private mode / quota */
  }
}
