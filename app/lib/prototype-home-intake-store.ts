import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import seedStore from "@/data/prototype-home-intakes.seed.json";
import { buildHomeIntakeRouting } from "./home-intake-ai";
import {
  appendPromptToCandidate,
  buildNewCandidateRecord,
  findMatchingRoomCandidate,
} from "./home-intake-candidates";
import type {
  HomeIntakeRecord,
  HomeIntakeRouteKind,
  HomeIntakeStoreDocument,
} from "./home-intake-types";
import type { IssueRoomSlug } from "./civic-logos";

type ListHomeIntakeFilters = {
  routeKind?: HomeIntakeRouteKind;
  roomSlug?: IssueRoomSlug;
  limit?: number;
};

const seedDocument = seedStore as HomeIntakeStoreDocument;

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
        /* turbopackIgnore: true */ process.cwd(),
        "data",
        "prototype-home-intakes.runtime.json",
      );

      try {
        await ensureStoreFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          tmpdir(),
          "civiclogos-prototype-home-intakes.runtime.json",
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
  return JSON.parse(raw) as HomeIntakeStoreDocument;
}

async function writeStoreDocument(document: HomeIntakeStoreDocument) {
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

export async function getHomeIntakeStoreMetadata() {
  const storePath = await resolveStorePath();
  return {
    prototype: true as const,
    mode: "prototype" as const,
    storePath,
    note: seedDocument.note,
  };
}

export async function createHomeIntakeEntry(prompt: string): Promise<HomeIntakeRecord> {
  return enqueueWrite(async () => {
    const document = await readStoreDocument();
    const timestamp = new Date().toISOString();
    const routing = await buildHomeIntakeRouting(prompt);
    const entry: HomeIntakeRecord = {
      id: randomUUID(),
      prompt,
      createdAt: timestamp,
      updatedAt: timestamp,
      routing,
    };

    if (routing.routeKind === "new-room-draft" || routing.routeKind === "room-topic-draft") {
      const matchingEntry = findMatchingRoomCandidate(
        prompt,
        document.entries.filter(
          (item) =>
            item.routing.routeKind === routing.routeKind &&
            (!routing.roomSlug || item.routing.roomSlug === routing.roomSlug),
        ),
      );

      if (matchingEntry) {
        const updatedEntry = appendPromptToCandidate(
          matchingEntry,
          prompt,
          timestamp,
          routing,
        );
        document.entries = document.entries.map((item) =>
          item.id === updatedEntry.id ? updatedEntry : item,
        );
        await writeStoreDocument(document);
        return updatedEntry;
      }
    }

    const storedEntry =
      routing.routeKind === "new-room-draft" || routing.routeKind === "room-topic-draft"
        ? buildNewCandidateRecord(entry, prompt, timestamp)
        : entry;

    document.entries.push(storedEntry);
    await writeStoreDocument(document);

    return storedEntry;
  });
}

export async function getHomeIntakeEntry(id: string) {
  const document = await readStoreDocument();
  return document.entries.find((item) => item.id === id) ?? null;
}

export async function listHomeIntakeEntries(filters: ListHomeIntakeFilters = {}) {
  const document = await readStoreDocument();

  return [...document.entries]
    .filter((item) => {
      if (filters.routeKind && item.routing.routeKind !== filters.routeKind) {
        return false;
      }

      if (filters.roomSlug && item.routing.roomSlug !== filters.roomSlug) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, filters.limit ?? 12);
}
