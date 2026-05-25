import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type { EvidenceDocument } from "./contribution-types";
import type {
  CreateReviewEvidenceRecordInput,
  ReviewEvidenceRecord,
  ReviewEvidenceStoreMetadata,
  ReviewEvidenceVisibility,
} from "./review-evidence-types";

type ListReviewEvidenceFilters = {
  contributionId: string;
  limit?: number;
};

type ReviewEvidenceRow = {
  id: string;
  contribution_id: string;
  document: EvidenceDocument;
  label: string;
  reviewer_label: string;
  visibility: ReviewEvidenceVisibility;
  note: string | null;
  created_at: string | Date;
};

type DatabaseReviewEvidenceStore = {
  getReviewEvidenceStoreMetadata: () => Promise<ReviewEvidenceStoreMetadata>;
  listReviewEvidenceRecords: (
    filters: ListReviewEvidenceFilters,
  ) => Promise<ReviewEvidenceRecord[]>;
  getReviewEvidenceRecord: (id: string) => Promise<ReviewEvidenceRecord | null>;
  createReviewEvidenceRecord: (
    input: CreateReviewEvidenceRecordInput,
  ) => Promise<ReviewEvidenceRecord>;
  updateReviewEvidenceDocument: (
    id: string,
    document: EvidenceDocument,
  ) => Promise<ReviewEvidenceRecord | null>;
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

export function isDatabaseReviewEvidenceStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Review evidence database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureReviewEvidenceTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_review_evidence_records (
          id text primary key,
          contribution_id text not null,
          document jsonb not null,
          label text not null,
          reviewer_label text not null,
          visibility text not null,
          note text,
          created_at timestamptz not null
        )
      `;

      await sql`
        create index if not exists civiclogos_review_evidence_contribution_idx
        on civiclogos_review_evidence_records (contribution_id, created_at desc)
      `;
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToRecord(row: ReviewEvidenceRow): ReviewEvidenceRecord {
  return {
    id: row.id,
    contributionId: row.contribution_id,
    document: row.document,
    label: row.label,
    reviewerLabel: row.reviewer_label,
    visibility: row.visibility,
    note: row.note ?? undefined,
    createdAt: normalizeDate(row.created_at),
  };
}

export function createDatabaseReviewEvidenceStore(): DatabaseReviewEvidenceStore {
  return {
    async getReviewEvidenceStoreMetadata() {
      await ensureReviewEvidenceTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent reviewer evidence storage is active. Reviewer-supplied papers stay attached to the review record separately from contributor evidence.",
      };
    },

    async listReviewEvidenceRecords(filters) {
      await ensureReviewEvidenceTable();
      const sql = getSqlClient();
      const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);
      const rows = await sql<ReviewEvidenceRow[]>`
        select *
        from (
          select *
          from civiclogos_review_evidence_records
          where contribution_id = ${filters.contributionId}
          order by created_at desc
          limit ${limit}
        ) recent
        order by created_at asc
      `;

      return rows.map(rowToRecord);
    },

    async getReviewEvidenceRecord(id) {
      await ensureReviewEvidenceTable();
      const sql = getSqlClient();
      const rows = await sql<ReviewEvidenceRow[]>`
        select *
        from civiclogos_review_evidence_records
        where id = ${id}
        limit 1
      `;
      const row = rows[0];

      return row ? rowToRecord(row) : null;
    },

    async createReviewEvidenceRecord(input) {
      await ensureReviewEvidenceTable();
      const sql = getSqlClient();
      const record: ReviewEvidenceRecord = {
        ...input,
        id: randomUUID(),
      };

      await sql`
        insert into civiclogos_review_evidence_records (
          id,
          contribution_id,
          document,
          label,
          reviewer_label,
          visibility,
          note,
          created_at
        ) values (
          ${record.id},
          ${record.contributionId},
          ${sql.json(record.document)},
          ${record.label},
          ${record.reviewerLabel},
          ${record.visibility},
          ${record.note ?? null},
          ${record.createdAt}
        )
      `;

      return record;
    },

    async updateReviewEvidenceDocument(id, document) {
      await ensureReviewEvidenceTable();
      const sql = getSqlClient();
      const rows = await sql<ReviewEvidenceRow[]>`
        update civiclogos_review_evidence_records
        set document = ${sql.json(document)}
        where id = ${id}
        returning *
      `;
      const row = rows[0];

      return row ? rowToRecord(row) : null;
    },
  };
}
