import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/preferences/${user_id}`, {
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/preferences/${user_id}`, {
    method: "DELETE",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
