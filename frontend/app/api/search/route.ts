import { NextResponse } from "next/server";
import {
  applyPreferences,
  buildExplanation,
  getPreferences,
  loadFixture,
} from "@/lib/mockStore";

export async function POST(req: Request) {
  const { user_id } = (await req.json()) as { user_id: string; query: string };

  const listings = loadFixture();
  const prefs = getPreferences(user_id);
  const filtered = applyPreferences(listings, prefs);

  return NextResponse.json({
    results: filtered,
    explanation: buildExplanation(prefs),
    memory_used: prefs,
  });
}
