import type { EvidenceDocument } from "./contribution-types";
import type { IssueRoomSlug } from "./civic-logos";
import {
  createDatabaseEvidenceDocumentStore,
  isDatabaseEvidenceDocumentStoreConfigured,
} from "./database-evidence-document-store";

export type CreateEvidenceDocumentInput = {
  roomSlug: IssueRoomSlug;
  topicId: string;
  topicTitle: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

export type StoredEvidenceDocument = {
  document: EvidenceDocument;
  bytes: Buffer;
};

type EvidenceDocumentStoreAdapter = {
  createEvidenceDocument: (
    input: CreateEvidenceDocumentInput,
  ) => Promise<EvidenceDocument>;
  getEvidenceDocument: (id: string) => Promise<StoredEvidenceDocument | null>;
};

const databaseStore = createDatabaseEvidenceDocumentStore();

async function loadPrototypeEvidenceDocumentStore() {
  return import("./prototype-evidence-document-store");
}

async function withEvidenceDocumentStore<T>(
  action: (store: EvidenceDocumentStoreAdapter) => Promise<T>,
) {
  if (isDatabaseEvidenceDocumentStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Evidence document database store failed, falling back to prototype store.", error);
    }
  }

  const prototypeStoreModule = await loadPrototypeEvidenceDocumentStore();
  return action(prototypeStoreModule);
}

export async function createEvidenceDocument(input: CreateEvidenceDocumentInput) {
  return withEvidenceDocumentStore((store) => store.createEvidenceDocument(input));
}

export async function getEvidenceDocument(id: string) {
  return withEvidenceDocumentStore((store) => store.getEvidenceDocument(id));
}
