import { NextResponse } from "next/server";
import { addPreference, parseRejection } from "@/lib/mockStore";

export async function POST(req: Request) {
  const { user_id, decision, note } = (await req.json()) as {
    user_id: string;
    item_id: string;
    decision: "reject" | "accept";
    note: string;
  };

  if (decision === "accept") {
    return NextResponse.json({ ok: true, preference_added: null });
  }

  // Simulate HydraDB's ~12-17s indexing latency so the UI's "remembering…"
  // state has something real to render against. Tuned shorter than the real
  // measured latency to keep mock iteration tolerable; bump up to test the
  // real-world UX.
  await new Promise((r) => setTimeout(r, 1400));

  const pref = parseRejection(note);
  if (pref) {
    addPreference(user_id, pref);
  }

  return NextResponse.json({
    ok: true,
    preference_added: pref
      ? { key: pref.key, value: pref.value, polarity: pref.polarity }
      : null,
  });
}
