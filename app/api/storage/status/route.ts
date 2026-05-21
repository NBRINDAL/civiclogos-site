import { NextResponse } from "next/server";
import { getContributionStoreMetadata } from "@/app/lib/contribution-store";
import { getHomeIntakeStoreMetadata } from "@/app/lib/home-intake-store";

export const runtime = "nodejs";

export async function GET() {
  const [contributions, intake] = await Promise.all([
    getContributionStoreMetadata(),
    getHomeIntakeStoreMetadata(),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    sharedDatabaseActive:
      contributions.mode === "database" && intake.mode === "database",
    contributions,
    intake,
  });
}
