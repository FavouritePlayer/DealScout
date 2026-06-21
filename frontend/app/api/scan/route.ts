import { NextResponse } from "next/server";
import { buildQueue } from "@/lib/mockStore";

export async function POST(req: Request) {
  const { user_id } = (await req.json()) as { user_id: string };
  return NextResponse.json(buildQueue(user_id));
}
