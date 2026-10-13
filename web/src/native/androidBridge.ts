/** Android-only, local bridge. Never loaded from an external URL. */
export interface DailyTasksBridge {
  syncState: (json: string) => void;
  syncWidgetPrefs: (json: string) => void;
  getWidgetPrefs: () => string;
  getState: () => string;
}
declare global {
  interface Window { DailyTasksNative?: DailyTasksBridge; }
}
export function readNativeState(): { tasks: unknown[]; completedArchive: unknown[]; theme?: string } | null {
  try {
    const raw = window.DailyTasksNative?.getState();
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (Array.isArray(state.tasks) && Array.isArray(state.completedArchive)) return state;
  } catch { /* local fallback */ }
  return null;
}
