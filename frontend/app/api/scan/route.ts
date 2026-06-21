import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/scan`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
