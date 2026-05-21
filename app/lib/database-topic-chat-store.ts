import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type {
  CreateTopicChatMessageInput,
  TopicChatMessage,
  TopicChatStoreMetadata,
} from "./topic-chat-types";
import type { IssueRoomSlug } from "./civic-logos";

type ListTopicChatFilters = {
  sessionId: string;
  roomSlug?: IssueRoomSlug;
  topicId?: string;
  limit?: number;
};

type TopicChatRow = {
  id: string;
  session_id: string;
  run_id: string;
  room_slug: string;
  topic_id: string;
  topic_title: string;
  role: TopicChatMessage["role"];
  provider: TopicChatMessage["provider"] | null;
  model: string | null;
  body: string;
  created_at: string | Date;
  prompt_category: TopicChatMessage["promptCategory"] | null;
  promotion: TopicChatMessage["promotion"] | null;
};

type DatabaseTopicChatStore = {
  getTopicChatStoreMetadata: () => Promise<TopicChatStoreMetadata>;
  listTopicChatMessages: (
    filters: ListTopicChatFilters,
  ) => Promise<TopicChatMessage[]>;
  createTopicChatMessage: (
    input: CreateTopicChatMessageInput,
  ) => Promise<TopicChatMessage>;
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

export function isDatabaseTopicChatStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Topic chat database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureTopicChatTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_topic_chat_messages (
          id text primary key,
          session_id text not null,
          run_id text not null,
          room_slug text not null,
          topic_id text not null,
          topic_title text not null,
          role text not null,
          provider text,
          model text,
          body text not null,
          created_at timestamptz not null,
          prompt_category text,
          promotion jsonb
        )
      `;

      await sql`
        create index if not exists civiclogos_topic_chat_session_idx
        on civiclogos_topic_chat_messages (session_id, room_slug, topic_id, created_at desc)
      `;
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToMessage(row: TopicChatRow): TopicChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    runId: row.run_id,
    roomSlug: row.room_slug as IssueRoomSlug,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    role: row.role,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    body: row.body,
    createdAt: normalizeDate(row.created_at),
    promptCategory: row.prompt_category ?? undefined,
    promotion: row.promotion ?? undefined,
  };
}

export function createDatabaseTopicChatStore(): DatabaseTopicChatStore {
  return {
    async getTopicChatStoreMetadata() {
      await ensureTopicChatTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent topic chat storage is active. Scoped topic conversations are being stored in the configured database.",
      };
    },

    async listTopicChatMessages(filters) {
      await ensureTopicChatTable();
      const sql = getSqlClient();
      const limit = Math.min(Math.max(filters.limit ?? 18, 1), 60);
      const rows = await sql<TopicChatRow[]>`
        select *
        from (
          select *
          from civiclogos_topic_chat_messages
          where session_id = ${filters.sessionId}
            and (${filters.roomSlug ?? null}::text is null or room_slug = ${filters.roomSlug ?? null})
            and (${filters.topicId ?? null}::text is null or topic_id = ${filters.topicId ?? null})
          order by created_at desc
          limit ${limit}
        ) recent
        order by created_at asc
      `;

      return rows.map(rowToMessage);
    },

    async createTopicChatMessage(input) {
      await ensureTopicChatTable();
      const sql = getSqlClient();
      const message: TopicChatMessage = {
        ...input,
        id: randomUUID(),
      };

      await sql`
        insert into civiclogos_topic_chat_messages (
          id,
          session_id,
          run_id,
          room_slug,
          topic_id,
          topic_title,
          role,
          provider,
          model,
          body,
          created_at,
          prompt_category,
          promotion
        ) values (
          ${message.id},
          ${message.sessionId},
          ${message.runId},
          ${message.roomSlug},
          ${message.topicId},
          ${message.topicTitle},
          ${message.role},
          ${message.provider ?? null},
          ${message.model ?? null},
          ${message.body},
          ${message.createdAt},
          ${message.promptCategory ?? null},
          ${sql.json(message.promotion ?? null)}
        )
      `;

      return message;
    },
  };
}
