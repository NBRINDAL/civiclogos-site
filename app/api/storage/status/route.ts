import { NextResponse, type NextRequest } from "next/server";
import { getAskDeploymentState } from "@/app/lib/ask-deployment-state";
import { inspectCandidateStoreMetadata } from "@/app/lib/candidate-store";
import { getContributionStoreMetadata } from "@/app/lib/contribution-store";
import { getHomeIntakeStoreMetadata } from "@/app/lib/home-intake-store";
import {
  isValidMaintainerSessionValue,
  maintainerSessionCookieName,
} from "@/app/lib/maintainer-auth";
import { inspectTopicChatStoreMetadata } from "@/app/lib/topic-chat-store";

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

  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const requestProtocol =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  const [contributions, intake, candidateIntake, topicChat] = await Promise.all([
    getContributionStoreMetadata(),
    getHomeIntakeStoreMetadata(),
    inspectCandidateStoreMetadata({
      avoidPrototypeInitialization: true,
    }),
    inspectTopicChatStoreMetadata({
      avoidPrototypeInitialization: true,
    }),
  ]);
  const ask = getAskDeploymentState({
    candidateStore: candidateIntake,
    chatStore: topicChat,
    host: requestHost,
    protocol: requestProtocol,
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    sharedDatabaseActive:
      contributions.mode === "database" && intake.mode === "database",
    contributions,
    intake,
    candidateIntake,
    topicChat,
    ask,
  });
}
