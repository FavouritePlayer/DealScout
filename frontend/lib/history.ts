import type { HistoryEntry } from "./types";

export function loadHistory(key: string): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function appendHistory(
  key: string,
  entry: Omit<HistoryEntry, "id" | "timestamp">
): HistoryEntry[] {
  const next: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const items = [next, ...loadHistory(key)].slice(0, 100);
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // non-fatal
  }
  return items;
}
