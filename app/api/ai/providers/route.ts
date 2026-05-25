import { NextRequest, NextResponse } from "next/server";
import {
  getAiProviderConfigs,
  type AiProviderName,
} from "@/app/lib/ai-provider-config";
import {
  testAllProviderConnectivity,
  testProviderConnectivity,
} from "@/app/lib/ai-provider-test";
import {
  isValidMaintainerSessionValue,
  maintainerSessionCookieName,
} from "@/app/lib/maintainer-auth";

export const runtime = "nodejs";

type ProviderTestPayload = {
  provider?: unknown;
};

function normalizeProvider(value: unknown): AiProviderName | "all" | null {
  if (typeof value !== "string") {
    return "all";
  }

  const trimmed = value.trim().toLowerCase();

  if (!trimmed || trimmed === "all") {
    return "all";
  }

  if (trimmed === "openai" || trimmed === "anthropic") {
    return trimmed;
  }

  return null;
}

export async function GET() {
  const providers = getAiProviderConfigs().map((provider) => ({
    provider: provider.provider,
    configured: provider.configured,
    model: provider.model,
  }));

  return NextResponse.json({
    server: "vercel-node-runtime",
    providers,
    note: "This endpoint confirms which providers are configured on the server. It does not expose secrets.",
  });
}

export async function POST(request: NextRequest) {
  if (
    !isValidMaintainerSessionValue(
      request.cookies.get(maintainerSessionCookieName)?.value,
    )
  ) {
    return NextResponse.json(
      { error: "Maintainer access is required to test provider connectivity." },
      { status: 401 },
    );
  }

  let payload: ProviderTestPayload = {};

  try {
    payload = (await request.json()) as ProviderTestPayload;
  } catch {
    payload = {};
  }

  const provider = normalizeProvider(payload.provider);

  if (!provider) {
    return NextResponse.json(
      { error: "Provider must be openai, anthropic, or all." },
      { status: 400 },
    );
  }

  const results =
    provider === "all"
      ? await testAllProviderConnectivity()
      : [await testProviderConnectivity(provider)];

  return NextResponse.json({
    testedAt: new Date().toISOString(),
    results,
  });
}
