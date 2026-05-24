import type {
  Contribution,
  CreateContributionInput,
  EvidenceDocument,
  PublicContribution,
  ReviewContributionInput,
} from "./contribution-types";
import type { IssueRoomSlug } from "./civic-logos";
import type { DebateLane } from "./reasoning-types";
import {
  createDatabaseContributionStore,
  isDatabaseContributionStoreConfigured,
} from "./database-contribution-store";

type ListContributionFilters = {
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
  status?: string;
  lane?: DebateLane;
};

export type ContributionStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};

type ContributionStoreAdapter = {
  getContributionStoreMetadata: () => Promise<ContributionStoreMetadata>;
  listPublicContributions: (
    filters?: ListContributionFilters,
  ) => Promise<PublicContribution[]>;
  listAllContributions: (
    filters?: ListContributionFilters,
  ) => Promise<Contribution[]>;
  getContributionById: (id: string) => Promise<Contribution | null>;
  createContribution: (
    input: CreateContributionInput,
  ) => Promise<PublicContribution>;
  reviewContribution: (
    id: string,
    input: ReviewContributionInput,
  ) => Promise<Contribution | null>;
  refreshContributionAiIntake: (id: string) => Promise<Contribution | null>;
  updateContributionEvidenceDocument: (
    id: string,
    evidenceDocument: EvidenceDocument,
  ) => Promise<Contribution | null>;
  updateContributionEvidenceExcerpt: (
    id: string,
    evidenceExcerpt: string,
  ) => Promise<Contribution | null>;
};

const databaseStore = createDatabaseContributionStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype store for this request.`;
}

async function loadPrototypeContributionStore() {
  return import("./prototype-contribution-store");
}

async function withContributionStore<T>(
  action: (store: ContributionStoreAdapter) => Promise<T>,
) {
  if (isDatabaseContributionStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Contribution database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeContributionStore();
  const metadata = await prototypeStoreModule.getContributionStoreMetadata();
  const prototypeStore = {
    getContributionStoreMetadata: async () =>
      isDatabaseContributionStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : {
            ...metadata,
            mode: "prototype" as const,
          },
    listPublicContributions: prototypeStoreModule.listPublicContributions,
    listAllContributions: prototypeStoreModule.listAllContributions,
    getContributionById: prototypeStoreModule.getContributionById,
    createContribution: prototypeStoreModule.createContribution,
    reviewContribution: prototypeStoreModule.reviewContribution,
    refreshContributionAiIntake: prototypeStoreModule.refreshContributionAiIntake,
    updateContributionEvidenceDocument:
      prototypeStoreModule.updateContributionEvidenceDocument,
    updateContributionEvidenceExcerpt:
      prototypeStoreModule.updateContributionEvidenceExcerpt,
  };

  return action(prototypeStore);
}

export async function getContributionStoreMetadata() {
  return withContributionStore((store) => store.getContributionStoreMetadata());
}

export async function listPublicContributions(filters: ListContributionFilters = {}) {
  return withContributionStore((store) => store.listPublicContributions(filters));
}

export async function listAllContributions(filters: ListContributionFilters = {}) {
  return withContributionStore((store) => store.listAllContributions(filters));
}

export async function getContributionById(id: string) {
  return withContributionStore((store) => store.getContributionById(id));
}

export async function createContribution(input: CreateContributionInput) {
  return withContributionStore((store) => store.createContribution(input));
}

export async function reviewContribution(
  id: string,
  input: ReviewContributionInput,
) {
  return withContributionStore((store) => store.reviewContribution(id, input));
}

export async function refreshContributionAiIntake(id: string) {
  return withContributionStore((store) => store.refreshContributionAiIntake(id));
}

export async function updateContributionEvidenceDocument(
  id: string,
  evidenceDocument: EvidenceDocument,
) {
  return withContributionStore((store) =>
    store.updateContributionEvidenceDocument(id, evidenceDocument),
  );
}

export async function updateContributionEvidenceExcerpt(
  id: string,
  evidenceExcerpt: string,
) {
  return withContributionStore((store) =>
    store.updateContributionEvidenceExcerpt(id, evidenceExcerpt),
  );
}
