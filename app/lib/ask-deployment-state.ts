import type { CandidateStoreMetadata } from "./candidate-store";
import type { TopicChatStoreMetadata } from "./topic-chat-types";

function normalizeHost(host: string | null | undefined) {
  if (!host) {
    return "";
  }

  return host.toLowerCase().replace(/:\d+$/, "");
}

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
}

export function isPublicRuntimeHost(args: {
  host?: string | null;
  protocol?: string | null;
}) {
  const host = normalizeHost(args.host);
  const protocol = args.protocol?.toLowerCase() ?? "";

  if (!host || isLocalHost(host)) {
    return false;
  }

  return (
    protocol === "https" ||
    protocol === "https:" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  );
}

export type AskDeploymentState = {
  candidateIntakeEnabled: boolean;
  durableStorageRequired: boolean;
  durableCandidateStorage: boolean;
  durableTopicChatStorage: boolean;
  prototypeReadOnlyMode: boolean;
  publicRuntimeHost: boolean;
  statusLabel: "candidate-intake-active" | "prototype-read-only";
  notice: string | null;
};

export function getAskDeploymentState(args: {
  candidateStore: CandidateStoreMetadata;
  chatStore: TopicChatStoreMetadata;
  host?: string | null;
  protocol?: string | null;
}): AskDeploymentState {
  const publicRuntimeHost = isPublicRuntimeHost({
    host: args.host,
    protocol: args.protocol,
  });
  const durableStorageRequired = publicRuntimeHost;
  const durableCandidateStorage = args.candidateStore.mode === "database";
  const durableTopicChatStorage = args.chatStore.mode === "database";
  const candidateIntakeEnabled =
    !durableStorageRequired ||
    (durableCandidateStorage && durableTopicChatStorage);
  const prototypeReadOnlyMode = durableStorageRequired && !candidateIntakeEnabled;

  return {
    candidateIntakeEnabled,
    durableStorageRequired,
    durableCandidateStorage,
    durableTopicChatStorage,
    prototypeReadOnlyMode,
    publicRuntimeHost,
    statusLabel: prototypeReadOnlyMode
      ? "prototype-read-only"
      : "candidate-intake-active",
    notice: prototypeReadOnlyMode
      ? "Prototype read-only mode: durable storage is not configured. Read-only ledger questions are available, but candidate submission is disabled until persistent topic chat and candidate storage are active."
      : null,
  };
}
