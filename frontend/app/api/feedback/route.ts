import { NextResponse } from "next/server";
import { addPreference, parsePreferenceFromNote } from "@/lib/mockStore";

export async function POST(req: Request) {
  const { user_id, note } = (await req.json()) as {
    user_id: string;
    category: string;
    note: string;
  };

  // Simulate HydraDB's async indexing latency so the UI's "remembering..."
  // state has something real to render against.
  await new Promise((r) => setTimeout(r, 900));

  const pref = parsePreferenceFromNote(note);
  if (pref) {
    addPreference(user_id, pref);
  }

  return NextResponse.json({ ok: true, preference_added: pref });
}
