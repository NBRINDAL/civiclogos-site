import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import seedStore from "@/data/prototype-home-intakes.seed.json";
import { buildHomeIntakeRouting } from "./home-intake-ai";
import type {
  HomeIntakeRecord,
  HomeIntakeRouteKind,
  HomeIntakeRouting,
  HomeIntakeStoreDocument,
  HomeIntakeStoreMetadata,
} from "./home-intake-types";

type ListHomeIntakeFilters = {
  routeKind?: HomeIntakeRouteKind;
  limit?: number;
};

type HomeIntakeRow = {
  id: string;
  prompt: string;
  created_at: string | Date;
  updated_at: string | Date;
  routing: HomeIntakeRouting;
};

type DatabaseHomeIntakeStore = {
  getHomeIntakeStoreMetadata: () => Promise<HomeIntakeStoreMetadata>;
  createHomeIntakeEntry: (prompt: string) => Promise<HomeIntakeRecord>;
  getHomeIntakeEntry: (id: string) => Promise<HomeIntakeRecord | null>;
  listHomeIntakeEntries: (
    filters?: ListHomeIntakeFilters,
  ) => Promise<HomeIntakeRecord[]>;
};

let sqlClient: Sql | null = null;
let initPromise: Promise<void> | null = null;
const seedDocument = seedStore as HomeIntakeStoreDocument;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    ""
  );
}

export function isDatabaseHomeIntakeStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Home intake database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureHomeIntakeTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_home_intakes (
          id text primary key,
          prompt text not null,
          created_at timestamptz not null,
          updated_at timestamptz not null,
          routing jsonb not null
        )
      `;

      await sql`
        create index if not exists civiclogos_home_intakes_created_idx
        on civiclogos_home_intakes (created_at desc)
      `;

      const rowCountResult = await sql<{ count: string }[]>`
        select count(*)::text as count
        from civiclogos_home_intakes
      `;
      const rowCount = Number(rowCountResult[0]?.count ?? "0");

      if (rowCount === 0 && seedDocument.entries.length) {
        for (const entry of seedDocument.entries) {
          await sql`
            insert into civiclogos_home_intakes (
              id,
              prompt,
              created_at,
              updated_at,
              routing
            ) values (
              ${entry.id},
              ${entry.prompt},
              ${entry.createdAt},
              ${entry.updatedAt},
              ${sql.json(entry.routing)}
            )
            on conflict (id) do nothing
          `;
        }
      }
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToEntry(row: HomeIntakeRow): HomeIntakeRecord {
  return {
    id: row.id,
    prompt: row.prompt,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
    routing: row.routing,
  };
}

export function createDatabaseHomeIntakeStore(): DatabaseHomeIntakeStore {
  return {
    async getHomeIntakeStoreMetadata() {
      await ensureHomeIntakeTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent intake draft storage is active. Routed prompts and provisional room drafts are being stored in the configured database.",
      };
    },

    async createHomeIntakeEntry(prompt: string) {
      await ensureHomeIntakeTable();
      const sql = getSqlClient();
      const timestamp = new Date().toISOString();
      const routing = await buildHomeIntakeRouting(prompt);

      const entry: HomeIntakeRecord = {
        id: randomUUID(),
        prompt,
        createdAt: timestamp,
        updatedAt: timestamp,
        routing,
      };

      await sql`
        insert into civiclogos_home_intakes (
          id,
          prompt,
          created_at,
          updated_at,
          routing
        ) values (
          ${entry.id},
          ${entry.prompt},
          ${entry.createdAt},
          ${entry.updatedAt},
          ${sql.json(entry.routing)}
        )
      `;

      return entry;
    },

    async getHomeIntakeEntry(id: string) {
      await ensureHomeIntakeTable();
      const sql = getSqlClient();
      const rows = await sql<HomeIntakeRow[]>`
        select *
        from civiclogos_home_intakes
        where id = ${id}
        limit 1
      `;

      const row = rows[0];
      return row ? rowToEntry(row) : null;
    },

    async listHomeIntakeEntries(filters = {}) {
      await ensureHomeIntakeTable();
      const sql = getSqlClient();
      const limit = Math.min(Math.max(filters.limit ?? 12, 1), 50);
      const rows = await sql<HomeIntakeRow[]>`
        select *
        from civiclogos_home_intakes
        where (${filters.routeKind ?? null}::text is null or routing ->> 'routeKind' = ${filters.routeKind ?? null})
        order by created_at desc
        limit ${limit}
      `;

      return rows.map(rowToEntry);
    },
  };
}
