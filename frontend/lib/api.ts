import type {
  FeedbackResponse,
  HistoryEntry,
  Preference,
  PreferencesResponse,
  ScanResponse,
} from "./types";

export async function scan(userId: string): Promise<ScanResponse> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : `scan failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function reject(
  userId: string,
  itemId: string,
  note: string
): Promise<FeedbackResponse> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      item_id: itemId,
      decision: "reject",
      note,
    }),
  });
  if (!res.ok) throw new Error(`reject failed: ${res.status}`);
  return res.json();
}

export async function accept(
  userId: string,
  itemId: string
): Promise<FeedbackResponse> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      item_id: itemId,
      decision: "accept",
      note: "",
    }),
  });
  if (!res.ok) throw new Error(`accept failed: ${res.status}`);
  return res.json();
}

export async function getPreferences(
  userId: string
): Promise<PreferencesResponse> {
  const res = await fetch(`/api/preferences/${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`preferences failed: ${res.status}`);
  return res.json();
}

export async function updatePreferences(
  userId: string,
  preferences: Preference[]
): Promise<PreferencesResponse> {
  const res = await fetch(`/api/preferences/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preferences }),
  });
  if (!res.ok) throw new Error(`update preferences failed: ${res.status}`);
  return res.json();
}

export async function clearSession(userId: string): Promise<void> {
  await fetch(`/api/preferences/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export type { HistoryEntry, Preference };
