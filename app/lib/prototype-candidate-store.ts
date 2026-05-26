import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type {
  CandidateRecord,
  CandidateReviewStatus,
  CandidateStoreDocument,
  CreateCandidateInput,
} from "./candidate-types";

type ListCandidateFilters = {
  roomId?: string;
  topicId?: string;
  reviewStatus?: CandidateReviewStatus;
  limit?: number;
};

const defaultDocument: CandidateStoreDocument = {
  prototype: true,
  note: "Prototype candidate storage is active while the pre-ledger candidate workflow is being finalized.",
  updatedAt: new Date().toISOString(),
  candidates: [],
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
        "prototype-candidates.runtime.json",
      );

      try {
        await ensureStoreFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          /*turbopackIgnore: true*/ tmpdir(),
          "civiclogos-prototype-candidates.runtime.json",
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
  return JSON.parse(raw) as CandidateStoreDocument;
}

async function writeStoreDocument(document: CandidateStoreDocument) {
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

function sortNewestFirst<T extends { createdAt: string }>(items: readonly T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function getCandidateStoreMetadata() {
  const storePath = await resolveStorePath();
  return {
    prototype: true as const,
    mode: "prototype" as const,
    storePath,
    note: defaultDocument.note,
  };
}

export async function listCandidateRecords(filters: ListCandidateFilters = {}) {
  const document = await readStoreDocument();

  return sortNewestFirst(document.candidates)
    .filter((item) => {
      if (filters.roomId && item.roomId !== filters.roomId) {
        return false;
      }

      if (filters.topicId && item.topicId !== filters.topicId) {
        return false;
      }

      if (filters.reviewStatus && item.reviewStatus !== filters.reviewStatus) {
        return false;
      }

      return true;
    })
    .slice(0, filters.limit ?? 20);
}

export async function getCandidateById(id: string) {
  const document = await readStoreDocument();
  return document.candidates.find((item) => item.id === id) ?? null;
}

export async function createCandidateRecord(input: CreateCandidateInput) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const timestamp = new Date().toISOString();
    const candidate: CandidateRecord = {
      ...input,
      id: randomUUID(),
      reviewStatus: input.reviewStatus ?? "pending_human_review",
      promotedContributionId: input.promotedContributionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    document.candidates.push(candidate);
    await writeStoreDocument(document);

    return candidate;
  });
}

export async function updateCandidateReviewStatus(
  id: string,
  reviewStatus: CandidateReviewStatus,
  promotedContributionId?: string,
) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const candidate = document.candidates.find((item) => item.id === id);

    if (!candidate) {
      return null;
    }

    candidate.reviewStatus = reviewStatus;
    candidate.promotedContributionId = promotedContributionId;
    candidate.updatedAt = new Date().toISOString();
    await writeStoreDocument(document);

    return candidate;
  });
}
