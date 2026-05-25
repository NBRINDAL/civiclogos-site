import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type {
  CreateReviewChatMessageInput,
  ReviewChatMessage,
  ReviewChatStoreMetadata,
} from "./review-chat-types";

type ListReviewChatFilters = {
  contributionId: string;
  limit?: number;
};

type ReviewChatRow = {
  id: string;
  contribution_id: string;
  role: ReviewChatMessage["role"];
  provider: ReviewChatMessage["provider"] | null;
  model: string | null;
  body: string;
  created_at: string | Date;
  mode: ReviewChatMessage["mode"] | null;
};

type DatabaseReviewChatStore = {
  getReviewChatStoreMetadata: () => Promise<ReviewChatStoreMetadata>;
  listReviewChatMessages: (
    filters: ListReviewChatFilters,
  ) => Promise<ReviewChatMessage[]>;
  createReviewChatMessage: (
    input: CreateReviewChatMessageInput,
  ) => Promise<ReviewChatMessage>;
};

let sqlClient: Sql | null = null;
let initPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    ""
  );
}

export function isDatabaseReviewChatStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Review chat database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureReviewChatTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_review_chat_messages (
          id text primary key,
          contribution_id text not null,
          role text not null,
          provider text,
          model text,
          body text not null,
          created_at timestamptz not null,
          mode text
        )
      `;

      await sql`
        create index if not exists civiclogos_review_chat_contribution_idx
        on civiclogos_review_chat_messages (contribution_id, created_at desc)
      `;
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToMessage(row: ReviewChatRow): ReviewChatMessage {
  return {
    id: row.id,
    contributionId: row.contribution_id,
    role: row.role,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    body: row.body,
    createdAt: normalizeDate(row.created_at),
    mode: row.mode ?? undefined,
  };
}

export function createDatabaseReviewChatStore(): DatabaseReviewChatStore {
  return {
    async getReviewChatStoreMetadata() {
      await ensureReviewChatTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent reviewer chat storage is active. Contribution-scoped review discussions are stored with the review record.",
      };
    },

    async listReviewChatMessages(filters) {
      await ensureReviewChatTable();
      const sql = getSqlClient();
      const limit = Math.min(Math.max(filters.limit ?? 40, 1), 80);
      const rows = await sql<ReviewChatRow[]>`
        select *
        from (
          select *
          from civiclogos_review_chat_messages
          where contribution_id = ${filters.contributionId}
          order by created_at desc
          limit ${limit}
        ) recent
        order by created_at asc
      `;

      return rows.map(rowToMessage);
    },

    async createReviewChatMessage(input) {
      await ensureReviewChatTable();
      const sql = getSqlClient();
      const message: ReviewChatMessage = {
        ...input,
        id: randomUUID(),
      };

      await sql`
        insert into civiclogos_review_chat_messages (
          id,
          contribution_id,
          role,
          provider,
          model,
          body,
          created_at,
          mode
        ) values (
          ${message.id},
          ${message.contributionId},
          ${message.role},
          ${message.provider ?? null},
          ${message.model ?? null},
          ${message.body},
          ${message.createdAt},
          ${message.mode ?? null}
        )
      `;

      return message;
    },
  };
}
