import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import seedStore from "@/data/prototype-contributions.seed.json";
import type {
  Contribution,
  ContributionStoreDocument,
  CreateContributionInput,
  ReviewContributionInput,
} from "./contribution-types";
import { toPublicContributionRecord } from "./contribution-types";
import { buildContributionAiIntake } from "./contribution-ai";
import type { IssueRoomSlug } from "./civic-logos";
import type { DebateLane } from "./reasoning-types";

type ListContributionFilters = {
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
  status?: string;
  lane?: DebateLane;
};

const seedDocument = seedStore as ContributionStoreDocument;
const seedContributionById = new Map(
  seedDocument.contributions.map((item) => [item.id, item]),
);

let storePathPromise: Promise<string> | null = null;
let writeQueue = Promise.resolve();

async function ensureStoreFile(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(seedDocument, null, 2), "utf8");
  }
}

async function resolveStorePath() {
  if (!storePathPromise) {
    storePathPromise = (async () => {
      const preferredPath = path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        "prototype-contributions.runtime.json",
      );

      try {
        await ensureStoreFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          /*turbopackIgnore: true*/ tmpdir(),
          "civiclogos-prototype-contributions.runtime.json",
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
  const document = JSON.parse(raw) as ContributionStoreDocument;

  for (const contribution of document.contributions) {
    const seedContribution = seedContributionById.get(contribution.id);
    if (!seedContribution?.review?.publicRecordNote) {
      continue;
    }

    contribution.review = {
      ...seedContribution.review,
      ...contribution.review,
      publicRecordNote:
        contribution.review?.publicRecordNote ??
        seedContribution.review.publicRecordNote,
    };
  }

  return document;
}

async function writeStoreDocument(document: ContributionStoreDocument) {
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

export async function getContributionStoreMetadata() {
  const storePath = await resolveStorePath();
  return {
    prototype: true as const,
    storePath,
    note: seedDocument.note,
  };
}

export async function listPublicContributions(filters: ListContributionFilters = {}) {
  const document = await readStoreDocument();

  return sortNewestFirst(document.contributions)
    .filter((item) => {
      if (filters.roomSlug && item.roomSlug !== filters.roomSlug) {
        return false;
      }

      if (filters.topicId && item.topicId !== filters.topicId) {
        return false;
      }

      if (filters.status && item.status !== filters.status) {
        return false;
      }

      if (filters.lane && item.lane !== filters.lane) {
        return false;
      }

      return true;
    })
    .slice(0, filters.limit ?? 12)
    .map(toPublicContributionRecord);
}

export async function listAllContributions(filters: ListContributionFilters = {}) {
  const document = await readStoreDocument();

  return sortNewestFirst(document.contributions).filter((item) => {
    if (filters.roomSlug && item.roomSlug !== filters.roomSlug) {
      return false;
    }

    if (filters.topicId && item.topicId !== filters.topicId) {
      return false;
    }

    if (filters.status && item.status !== filters.status) {
      return false;
    }

    if (filters.lane && item.lane !== filters.lane) {
      return false;
    }

    return true;
  });
}

export async function getContributionById(id: string) {
  const document = await readStoreDocument();
  return document.contributions.find((item) => item.id === id) ?? null;
}

export async function createContribution(input: CreateContributionInput) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const timestamp = new Date().toISOString();
    const aiIntake = await buildContributionAiIntake(input);

    const contribution: Contribution = {
      id: randomUUID(),
      roomSlug: input.roomSlug,
      topicId: input.topicId,
      topicTitle: input.topicTitle,
      lane: input.lane,
      title: input.title,
      body: input.body,
      evidenceSource: input.evidenceSource ?? undefined,
      evidenceDocument: input.evidenceDocument ?? undefined,
      author: input.author,
      referralSource: input.referralSource,
      draftSource: input.draftSource,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      aiIntake,
    };

    document.contributions.push(contribution);
    await writeStoreDocument(document);

    return toPublicContributionRecord(contribution);
  });
}

export async function reviewContribution(
  id: string,
  input: ReviewContributionInput,
) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const existing = document.contributions.find((item) => item.id === id);

    if (!existing) {
      return null;
    }

    existing.status = input.status;
    existing.updatedAt = new Date().toISOString();
    existing.review = {
      reviewerLabel: input.reviewerLabel,
      reviewerDisclosureNote: input.reviewerDisclosureNote,
      reviewerConflictNote: input.reviewerConflictNote,
      assignedToKind: input.assignedToKind,
      assignedToLabel: input.assignedToLabel,
      changedSynthesis: input.changedSynthesis ?? null,
      publicRecordNote: input.publicRecordNote,
      decisionReason: input.decisionReason,
      reviewerNote: input.reviewerNote,
      revisionSummary: input.revisionSummary,
      synthesisUpdate: input.synthesisUpdate,
      publicRecordSnapshot: input.publicRecordSnapshot,
      reviewedAt: new Date().toISOString(),
    };

    await writeStoreDocument(document);

    return existing;
  });
}

export async function refreshContributionAiIntake(id: string) {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const existing = document.contributions.find((item) => item.id === id);

    if (!existing) {
      return null;
    }

    existing.aiIntake = await buildContributionAiIntake({
      roomSlug: existing.roomSlug,
      topicId: existing.topicId,
      topicTitle: existing.topicTitle,
      lane: existing.lane,
      title: existing.title,
      body: existing.body,
      evidenceSource: existing.evidenceSource,
      evidenceDocument: existing.evidenceDocument,
      author: existing.author,
      referralSource: existing.referralSource,
      draftSource: existing.draftSource,
    });
    existing.updatedAt = new Date().toISOString();

    await writeStoreDocument(document);

    return existing;
  });
}
