import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "restaurant-3d-planner",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });
}
