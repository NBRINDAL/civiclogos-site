import {
  createDatabaseCandidateStore,
  isDatabaseCandidateStoreConfigured,
} from "./database-candidate-store";
import type {
  CandidateRecord,
  CandidateReviewStatus,
  CreateCandidateInput,
} from "./candidate-types";

type ListCandidateFilters = {
  roomId?: string;
  topicId?: string;
  reviewStatus?: CandidateReviewStatus;
  limit?: number;
};

export type CandidateStoreMetadata = {
  prototype: boolean;
  mode: "prototype" | "database" | "fallback";
  note: string;
  storePath?: string;
};

type CandidateStoreAdapter = {
  getCandidateStoreMetadata: () => Promise<CandidateStoreMetadata>;
  listCandidateRecords: (
    filters?: ListCandidateFilters,
  ) => Promise<CandidateRecord[]>;
  getCandidateById: (id: string) => Promise<CandidateRecord | null>;
  createCandidateRecord: (input: CreateCandidateInput) => Promise<CandidateRecord>;
  updateCandidateReviewStatus: (
    id: string,
    reviewStatus: CandidateReviewStatus,
    promotedContributionId?: string,
  ) => Promise<CandidateRecord | null>;
};

const databaseStore = createDatabaseCandidateStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype candidate store for this request.`;
}

async function loadPrototypeCandidateStore() {
  return import("./prototype-candidate-store");
}

async function withCandidateStore<T>(
  action: (store: CandidateStoreAdapter) => Promise<T>,
) {
  if (isDatabaseCandidateStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Candidate database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeCandidateStore();
  const metadata = await prototypeStoreModule.getCandidateStoreMetadata();
  const prototypeStore = {
    getCandidateStoreMetadata: async () =>
      isDatabaseCandidateStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : metadata,
    listCandidateRecords: prototypeStoreModule.listCandidateRecords,
    getCandidateById: prototypeStoreModule.getCandidateById,
    createCandidateRecord: prototypeStoreModule.createCandidateRecord,
    updateCandidateReviewStatus: prototypeStoreModule.updateCandidateReviewStatus,
  };

  return action(prototypeStore);
}

export async function getCandidateStoreMetadata() {
  return withCandidateStore((store) => store.getCandidateStoreMetadata());
}

export async function inspectCandidateStoreMetadata(args?: {
  avoidPrototypeInitialization?: boolean;
}) {
  if (isDatabaseCandidateStoreConfigured()) {
    try {
      return await databaseStore.getCandidateStoreMetadata();
    } catch (error) {
      console.error("Candidate database store failed while inspecting metadata.", error);

      if (args?.avoidPrototypeInitialization) {
        return {
          prototype: true,
          mode: "fallback" as const,
          note: withFallbackNote(
            "Persistent candidate storage is unavailable.",
          ),
        };
      }
    }
  }

  if (args?.avoidPrototypeInitialization) {
    return {
      prototype: true,
      mode: "prototype" as const,
      note: "Prototype candidate storage is active while the pre-ledger candidate workflow is being finalized.",
    };
  }

  return getCandidateStoreMetadata();
}

export async function listCandidateRecords(filters: ListCandidateFilters = {}) {
  return withCandidateStore((store) => store.listCandidateRecords(filters));
}

export async function getCandidateById(id: string) {
  return withCandidateStore((store) => store.getCandidateById(id));
}

export async function createCandidateRecord(input: CreateCandidateInput) {
  return withCandidateStore((store) => store.createCandidateRecord(input));
}

export async function updateCandidateReviewStatus(
  id: string,
  reviewStatus: CandidateReviewStatus,
  promotedContributionId?: string,
) {
  return withCandidateStore((store) =>
    store.updateCandidateReviewStatus(id, reviewStatus, promotedContributionId),
  );
}
