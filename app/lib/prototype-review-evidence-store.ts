import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type { EvidenceDocument } from "./contribution-types";
import type {
  CreateReviewEvidenceRecordInput,
  ReviewEvidenceRecord,
  ReviewEvidenceStoreDocument,
} from "./review-evidence-types";

type ListReviewEvidenceFilters = {
  contributionId: string;
  limit?: number;
};

const defaultDocument: ReviewEvidenceStoreDocument = {
  prototype: true,
  note: "Prototype reviewer evidence storage is active while persistent storage is being finalized.",
  updatedAt: new Date().toISOString(),
  records: [],
};

let storePathPromise: Promise<string> | null = null;
let writeQueue = Promise.resolve();

async function ensureStoreFile(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(defaultDocument, null, 2), "utf8");
  }
}

async function resolveStorePath() {
  if (!storePathPromise) {
    storePathPromise = (async () => {
      const preferredPath = path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        "prototype-review-evidence.runtime.json",
      );

      try {
        await ensureStoreFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          /*turbopackIgnore: true*/ tmpdir(),
          "civiclogos-prototype-review-evidence.runtime.json",
        );
        await ensureStoreFile(fallbackPath);
        return fallbackPath;
      }
    })();
  }

  return storePathPromise;
}

async function readStoreDocument() {
  const storePath = await resolveStorePath();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as ReviewEvidenceStoreDocument;
}

async function writeStoreDocument(document: ReviewEvidenceStoreDocument) {
  const storePath = await resolveStorePath();
  document.updatedAt = new Date().toISOString();
  await writeFile(storePath, JSON.stringify(document, null, 2), "utf8");
}

function enqueueWrite<T>(task: () => Promise<T>) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function getReviewEvidenceStoreMetadata() {
  const storePath = await resolveStorePath();

  return {
    prototype: true as const,
    mode: "prototype" as const,
    storePath,
    note: defaultDocument.note,
  };
}

export async function listReviewEvidenceRecords(filters: ListReviewEvidenceFilters) {
  const document = await readStoreDocument();
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);

  return [...document.records]
    .filter((item) => item.contributionId === filters.contributionId)
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    )
    .slice(-limit);
}

export async function getReviewEvidenceRecord(id: string) {
  const document = await readStoreDocument();
  return document.records.find((item) => item.id === id) ?? null;
}

export async function createReviewEvidenceRecord(
  input: CreateReviewEvidenceRecordInput,
): Promise<ReviewEvidenceRecord> {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const record: ReviewEvidenceRecord = {
      ...input,
      id: randomUUID(),
    };

    document.records.push(record);
    await writeStoreDocument(document);
    return record;
  });
}

export async function updateReviewEvidenceDocument(
  id: string,
  evidenceDocument: EvidenceDocument,
) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const record = document.records.find((item) => item.id === id);

    if (!record) {
      return null;
    }

    record.document = evidenceDocument;
    await writeStoreDocument(document);
    return record;
  });
}
