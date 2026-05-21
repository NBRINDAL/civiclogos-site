import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import seedStore from "@/data/prototype-contributions.seed.json";
import type {
  Contribution,
  ContributionStoreDocument,
  CreateContributionInput,
  PublicContribution,
  ReviewContributionInput,
} from "./contribution-types";
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

type ContributionRow = {
  id: string;
  room_slug: string;
  topic_id: string;
  topic_title: string;
  lane: string;
  title: string;
  body: string;
  evidence_source: Contribution["evidenceSource"] | null;
  author: Contribution["author"];
  status: Contribution["status"];
  created_at: string | Date;
  updated_at: string | Date;
  is_seed_example: boolean;
  ai_intake: Contribution["aiIntake"] | null;
  review: Contribution["review"] | null;
};

type ContributionStoreMetadata = {
  prototype: false;
  mode: "database";
  note: string;
};

type DatabaseContributionStore = {
  getContributionStoreMetadata: () => Promise<ContributionStoreMetadata>;
  listPublicContributions: (
    filters?: ListContributionFilters,
  ) => Promise<PublicContribution[]>;
  listAllContributions: (
    filters?: ListContributionFilters,
  ) => Promise<Contribution[]>;
  createContribution: (
    input: CreateContributionInput,
  ) => Promise<PublicContribution>;
  reviewContribution: (
    id: string,
    input: ReviewContributionInput,
  ) => Promise<Contribution | null>;
};

let sqlClient: Sql | null = null;
let initPromise: Promise<void> | null = null;
const seedDocument = seedStore as ContributionStoreDocument;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    ""
  );
}

export function isDatabaseContributionStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Contribution database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureContributionTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_contributions (
          id text primary key,
          room_slug text not null,
          topic_id text not null,
          topic_title text not null,
          lane text not null,
          title text not null,
          body text not null,
          evidence_source jsonb,
          author jsonb not null,
          status text not null,
          created_at timestamptz not null,
          updated_at timestamptz not null,
          is_seed_example boolean not null default false,
          ai_intake jsonb,
          review jsonb
        )
      `;

      await sql`
        create index if not exists civiclogos_contributions_room_topic_idx
        on civiclogos_contributions (room_slug, topic_id, created_at desc)
      `;

      await sql`
        create index if not exists civiclogos_contributions_status_idx
        on civiclogos_contributions (status, created_at desc)
      `;

      const rowCountResult = await sql<{ count: string }[]>`
        select count(*)::text as count
        from civiclogos_contributions
      `;
      const rowCount = Number(rowCountResult[0]?.count ?? "0");

      if (rowCount === 0 && seedDocument.contributions.length) {
        for (const contribution of seedDocument.contributions) {
          await sql`
            insert into civiclogos_contributions (
              id,
              room_slug,
              topic_id,
              topic_title,
              lane,
              title,
              body,
              evidence_source,
              author,
              status,
              created_at,
              updated_at,
              is_seed_example,
              ai_intake,
              review
            ) values (
              ${contribution.id},
              ${contribution.roomSlug},
              ${contribution.topicId},
              ${contribution.topicTitle},
              ${contribution.lane},
              ${contribution.title},
              ${contribution.body},
              ${sql.json(contribution.evidenceSource ?? null)},
              ${sql.json(contribution.author)},
              ${contribution.status},
              ${contribution.createdAt},
              ${contribution.updatedAt},
              ${Boolean(contribution.isSeedExample)},
              ${sql.json(contribution.aiIntake ?? null)},
              ${sql.json(contribution.review ?? null)}
            )
            on conflict (id) do nothing
          `;
        }
      }

      for (const contribution of seedDocument.contributions) {
        const publicRecordNote = contribution.review?.publicRecordNote;

        if (!publicRecordNote) {
          continue;
        }

        await sql`
          update civiclogos_contributions
          set review = coalesce(review, '{}'::jsonb) || ${sql.json({
            publicRecordNote,
          })}
          where id = ${contribution.id}
            and coalesce(review ->> 'publicRecordNote', '') = ''
        `;
      }
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    roomSlug: row.room_slug as IssueRoomSlug,
    topicId: row.topic_id,
    topicTitle: row.topic_title,
    lane: row.lane as Contribution["lane"],
    title: row.title,
    body: row.body,
    evidenceSource: row.evidence_source ?? undefined,
    author: row.author,
    status: row.status,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
    isSeedExample: row.is_seed_example,
    aiIntake: row.ai_intake ?? undefined,
    review: row.review ?? undefined,
  };
}

function toPublicContribution(item: Contribution): PublicContribution {
  return {
    ...item,
    author: {
      name: item.author.name,
      expertise: item.author.expertise,
    },
  };
}

async function listRows(filters: ListContributionFilters = {}) {
  await ensureContributionTable();
  const sql = getSqlClient();
  const limit = Math.min(Math.max(filters.limit ?? 12, 1), 50);

  return sql<ContributionRow[]>`
    select *
    from civiclogos_contributions
    where (${filters.roomSlug ?? null}::text is null or room_slug = ${filters.roomSlug ?? null})
      and (${filters.topicId ?? null}::text is null or topic_id = ${filters.topicId ?? null})
      and (${filters.status ?? null}::text is null or status = ${filters.status ?? null})
      and (${filters.lane ?? null}::text is null or lane = ${filters.lane ?? null})
    order by created_at desc
    limit ${limit}
  `;
}

export function createDatabaseContributionStore(): DatabaseContributionStore {
  return {
    async getContributionStoreMetadata() {
      await ensureContributionTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent contribution storage is active. Submissions and review states are being stored in the configured database.",
      };
    },

    async listPublicContributions(filters = {}) {
      const rows = await listRows(filters);
      return rows.map((row) => toPublicContribution(rowToContribution(row)));
    },

    async listAllContributions(filters = {}) {
      const rows = await listRows(filters);
      return rows.map(rowToContribution);
    },

    async createContribution(input) {
      await ensureContributionTable();
      const sql = getSqlClient();
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
        author: input.author,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        aiIntake,
      };

      await sql`
        insert into civiclogos_contributions (
          id,
          room_slug,
          topic_id,
          topic_title,
          lane,
          title,
          body,
          evidence_source,
          author,
          status,
          created_at,
          updated_at,
          is_seed_example,
          ai_intake,
          review
        ) values (
          ${contribution.id},
          ${contribution.roomSlug},
          ${contribution.topicId},
          ${contribution.topicTitle},
          ${contribution.lane},
          ${contribution.title},
          ${contribution.body},
          ${sql.json(contribution.evidenceSource ?? null)},
          ${sql.json(contribution.author)},
          ${contribution.status},
          ${contribution.createdAt},
          ${contribution.updatedAt},
          ${false},
          ${sql.json(contribution.aiIntake ?? null)},
          ${sql.json(null)}
        )
      `;

      return toPublicContribution(contribution);
    },

    async reviewContribution(id, input) {
      await ensureContributionTable();
      const sql = getSqlClient();
      const reviewedAt = new Date().toISOString();
      const nextReview: Contribution["review"] = {
        assignedToKind: input.assignedToKind,
        assignedToLabel: input.assignedToLabel,
        changedSynthesis: input.changedSynthesis ?? null,
        publicRecordNote: input.publicRecordNote,
        decisionReason: input.decisionReason,
        reviewerNote: input.reviewerNote,
        reviewedAt,
      };

      const rows = await sql<ContributionRow[]>`
        update civiclogos_contributions
        set
          status = ${input.status},
          updated_at = ${reviewedAt},
          review = ${sql.json(nextReview)}
        where id = ${id}
        returning *
      `;

      const row = rows[0];
      return row ? rowToContribution(row) : null;
    },
  };
}
