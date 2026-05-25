import { NextResponse, type NextRequest } from "next/server";
import { getContributionStoreMetadata } from "@/app/lib/contribution-store";
import { getHomeIntakeStoreMetadata } from "@/app/lib/home-intake-store";
import {
  isValidMaintainerSessionValue,
  maintainerSessionCookieName,
} from "@/app/lib/maintainer-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const hasMaintainerAccess = isValidMaintainerSessionValue(
    request.cookies.get(maintainerSessionCookieName)?.value,
  );

  if (!hasMaintainerAccess) {
    return NextResponse.json(
      { error: "Maintainer access is required to inspect storage status." },
      { status: 401 },
    );
  }

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
