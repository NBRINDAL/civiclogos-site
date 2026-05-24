import { NextResponse } from "next/server";
import { buildHealthcareTopic001ProtocolExport } from "@/app/lib/reasoning-ledger-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ledgerExport = await buildHealthcareTopic001ProtocolExport();

  return NextResponse.json(ledgerExport);
}
