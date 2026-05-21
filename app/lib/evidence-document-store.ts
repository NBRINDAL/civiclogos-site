import type { EvidenceDocument } from "./contribution-types";
import type { IssueRoomSlug } from "./civic-logos";
import {
  createDatabaseEvidenceDocumentStore,
  isDatabaseEvidenceDocumentStoreConfigured,
} from "./database-evidence-document-store";
import {
  createEvidenceDocument as createPrototypeEvidenceDocument,
  getEvidenceDocument as getPrototypeEvidenceDocument,
} from "./prototype-evidence-document-store";

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

const databaseStore = createDatabaseEvidenceDocumentStore();

async function withEvidenceDocumentStore<T>(
  action: (
    store: {
      createEvidenceDocument: (
        input: CreateEvidenceDocumentInput,
      ) => Promise<EvidenceDocument>;
      getEvidenceDocument: (id: string) => Promise<StoredEvidenceDocument | null>;
    },
  ) => Promise<T>,
) {
  if (isDatabaseEvidenceDocumentStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error("Evidence document database store failed, falling back to prototype store.", error);
    }
  }

  return action({
    createEvidenceDocument: createPrototypeEvidenceDocument,
    getEvidenceDocument: getPrototypeEvidenceDocument,
  });
}

export async function createEvidenceDocument(input: CreateEvidenceDocumentInput) {
  return withEvidenceDocumentStore((store) => store.createEvidenceDocument(input));
}

export async function getEvidenceDocument(id: string) {
  return withEvidenceDocumentStore((store) => store.getEvidenceDocument(id));
}
