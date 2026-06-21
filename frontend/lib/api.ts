import type {
  FeedbackResponse,
  PreferencesResponse,
  SearchResponse,
} from "./types";

export async function search(
  userId: string,
  query: string
): Promise<SearchResponse> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user_id: userId, query }),
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function sendFeedback(
  userId: string,
  category: string,
  note: string
): Promise<FeedbackResponse> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user_id: userId, category, note }),
  });
  if (!res.ok) throw new Error(`feedback failed: ${res.status}`);
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

export async function clearSession(userId: string): Promise<void> {
  await fetch(`/api/preferences/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}
