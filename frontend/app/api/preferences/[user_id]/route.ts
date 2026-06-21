import { NextResponse } from "next/server";
import { clearPreferences, getPublicPreferences } from "@/lib/mockStore";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  return NextResponse.json({ preferences: getPublicPreferences(user_id) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  clearPreferences(user_id);
  return NextResponse.json({ ok: true });
}
