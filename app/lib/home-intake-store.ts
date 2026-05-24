import {
  createDatabaseHomeIntakeStore,
  isDatabaseHomeIntakeStoreConfigured,
} from "./database-home-intake-store";
import type {
  HomeIntakeRecord,
  HomeIntakeRouteKind,
  HomeIntakeStoreMetadata,
} from "./home-intake-types";
import type { IssueRoomSlug } from "./civic-logos";

const databaseStore = createDatabaseHomeIntakeStore();

type ListHomeIntakeFilters = {
  routeKind?: HomeIntakeRouteKind;
  roomSlug?: IssueRoomSlug;
  limit?: number;
};

type HomeIntakeStoreAdapter = {
  getHomeIntakeStoreMetadata: () => Promise<HomeIntakeStoreMetadata>;
  createHomeIntakeEntry: (prompt: string) => Promise<HomeIntakeRecord>;
  getHomeIntakeEntry: (id: string) => Promise<HomeIntakeRecord | null>;
  listHomeIntakeEntries: (
    filters?: ListHomeIntakeFilters,
  ) => Promise<HomeIntakeRecord[]>;
};

function withFallbackNote(note: string) {
  return `${note} Database connection was unavailable, so Civic Logos fell back to the local prototype intake store for this request.`;
}

async function loadPrototypeHomeIntakeStore() {
  return import("./prototype-home-intake-store");
}

async function withHomeIntakeStore<T>(
  action: (store: HomeIntakeStoreAdapter) => Promise<T>,
) {
  if (isDatabaseHomeIntakeStoreConfigured()) {
    try {
      return await action(databaseStore);
    } catch (error) {
      console.error(
        "Home intake database store failed, falling back to prototype store.",
        error,
      );
    }
  }

  const prototypeStoreModule = await loadPrototypeHomeIntakeStore();
  const metadata = await prototypeStoreModule.getHomeIntakeStoreMetadata();
  const prototypeStore = {
    getHomeIntakeStoreMetadata: async () =>
      isDatabaseHomeIntakeStoreConfigured()
        ? {
            ...metadata,
            mode: "fallback" as const,
            note: withFallbackNote(metadata.note),
          }
        : metadata,
    createHomeIntakeEntry: prototypeStoreModule.createHomeIntakeEntry,
    getHomeIntakeEntry: prototypeStoreModule.getHomeIntakeEntry,
    listHomeIntakeEntries: prototypeStoreModule.listHomeIntakeEntries,
  };

  return action(prototypeStore);
}

export async function getHomeIntakeStoreMetadata() {
  return withHomeIntakeStore((store) => store.getHomeIntakeStoreMetadata());
}

export async function createHomeIntakeEntry(prompt: string) {
  return withHomeIntakeStore((store) => store.createHomeIntakeEntry(prompt));
}

export async function getHomeIntakeEntry(id: string) {
  return withHomeIntakeStore((store) => store.getHomeIntakeEntry(id));
}

export async function listHomeIntakeEntries(filters: ListHomeIntakeFilters = {}) {
  return withHomeIntakeStore((store) => store.listHomeIntakeEntries(filters));
}
