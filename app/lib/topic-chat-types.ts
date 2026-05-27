import type { AiProviderName } from "./ai-provider-config";
import type {
  AskReadOnlyIntent,
  AskRecordReference,
} from "./ask-types";
import type { CandidateReviewStatus } from "./candidate-types";
import type { IssueRoomSlug } from "./civic-logos";
import type { DebateLane, ReviewStatus, ReviewTargetKind } from "./reasoning-types";

export type TopicChatRoomSlug = IssueRoomSlug | "unrouted";

export type TopicChatPromotionState =
  | "read-only-answer"
  | "candidate-suggested"
  | "auto-recorded"
  | "sent-to-review"
  | "not-added";

export type TopicChatPromotion = {
  state: TopicChatPromotionState;
  note: string;
  candidateId?: string;
  candidateReviewStatus?: CandidateReviewStatus;
  actualCardChange?: false;
  publicSubmission?: boolean;
  contributionId?: string;
  contributionStatus?: ReviewStatus;
  lane?: DebateLane;
  assignmentKind?: ReviewTargetKind;
  assignmentLabel?: string;
  changedSynthesis?: boolean | null;
  readOnlyIntent?: AskReadOnlyIntent;
  recordsUsed?: AskRecordReference[];
};

export type TopicChatMessage = {
  id: string;
  sessionId: string;
  runId: string;
  roomSlug: TopicChatRoomSlug;
  topicId: string;
  topicTitle: string;
  role: "user" | "assistant";
  provider?: AiProviderName;
  model?: string;
  body: string;
  createdAt: string;
  promptCategory?: "topic-chat";
  promotion?: TopicChatPromotion;
};

export type CreateTopicChatMessageInput = Omit<TopicChatMessage, "id">;

export type TopicChatStoreDocument = {
  prototype: true;
  note: string;
  updatedAt: string;
  messages: TopicChatMessage[];
};

export type TopicChatStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};
