import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "restaurant-3d-planner",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });
}
