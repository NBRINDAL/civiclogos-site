import type { EvidenceDocument } from "./contribution-types";
import {
  createDatabaseReviewEvidenceStore,
  isDatabaseReviewEvidenceStoreConfigured,
} from "./database-review-evidence-store";
import type {
  CreateReviewEvidenceRecordInput,
  ReviewEvidenceRecord,
  ReviewEvidenceStoreMetadata,
} from "./review-evidence-types";

type ListReviewEvidenceFilters = {
  contributionId: string;
  limit?: number;
};

type ReviewEvidenceStoreAdapter = {
  getReviewEvidenceStoreMetadata: () => Promise<ReviewEvidenceStoreMetadata>;
  listReviewEvidenceRecords: (
    filters: ListReviewEvidenceFilters,
  ) => Promise<ReviewEvidenceRecord[]>;
  getReviewEvidenceRecord: (id: string) => Promise<ReviewEvidenceRecord | null>;
  createReviewEvidenceRecord: (
    input: CreateReviewEvidenceRecordInput,
  ) => Promise<ReviewEvidenceRecord>;
  updateReviewEvidenceDocument: (
    id: string,
    document: EvidenceDocument,
  ) => Promise<ReviewEvidenceRecord | null>;
};

const databaseStore = createDatabaseReviewEvidenceStore();

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype reviewer evidence store for this request.`;
}

async function loadPrototypeReviewEvidenceStore() {
  return import("./prototype-review-evidence-store");
}

async function withReviewEvidenceStore<T>(
  action: (store: ReviewEvidenceStoreAdapter) => Promise<T>,
) {
  if (isDatabaseReviewEvidenceStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Reviewer evidence database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeReviewEvidenceStore();
  const metadata = await prototypeStoreModule.getReviewEvidenceStoreMetadata();
  const prototypeStore = {
    getReviewEvidenceStoreMetadata: async () =>
      isDatabaseReviewEvidenceStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : {
            ...metadata,
            mode: "prototype" as const,
          },
    listReviewEvidenceRecords: prototypeStoreModule.listReviewEvidenceRecords,
    getReviewEvidenceRecord: prototypeStoreModule.getReviewEvidenceRecord,
    createReviewEvidenceRecord: prototypeStoreModule.createReviewEvidenceRecord,
    updateReviewEvidenceDocument: prototypeStoreModule.updateReviewEvidenceDocument,
  };

  return action(prototypeStore);
}

export async function getReviewEvidenceStoreMetadata() {
  return withReviewEvidenceStore((store) => store.getReviewEvidenceStoreMetadata());
}

export async function listReviewEvidenceRecords(filters: ListReviewEvidenceFilters) {
  return withReviewEvidenceStore((store) => store.listReviewEvidenceRecords(filters));
}

export async function getReviewEvidenceRecord(id: string) {
  return withReviewEvidenceStore((store) => store.getReviewEvidenceRecord(id));
}

export async function createReviewEvidenceRecord(
  input: CreateReviewEvidenceRecordInput,
) {
  return withReviewEvidenceStore((store) =>
    store.createReviewEvidenceRecord(input),
  );
}

export async function updateReviewEvidenceDocument(
  id: string,
  document: EvidenceDocument,
) {
  return withReviewEvidenceStore((store) =>
    store.updateReviewEvidenceDocument(id, document),
  );
}
