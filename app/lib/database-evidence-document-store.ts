import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import type { EvidenceDocument } from "./contribution-types";
import { extractEvidenceDocument } from "./evidence-extraction";
import type { CreateEvidenceDocumentInput, StoredEvidenceDocument } from "./evidence-document-store";

type EvidenceDocumentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string | Date;
  extraction: EvidenceDocument["extraction"];
  content: Buffer;
};

type DatabaseEvidenceDocumentStore = {
  createEvidenceDocument: (
    input: CreateEvidenceDocumentInput,
  ) => Promise<EvidenceDocument>;
  getEvidenceDocument: (id: string) => Promise<StoredEvidenceDocument | null>;
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

export function isDatabaseEvidenceDocumentStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Evidence document database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureEvidenceDocumentTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_evidence_documents (
          id text primary key,
          room_slug text not null,
          topic_id text not null,
          topic_title text not null,
          file_name text not null,
          mime_type text not null,
          size_bytes integer not null,
          uploaded_at timestamptz not null,
          extraction jsonb not null,
          content bytea not null
        )
      `;

      await sql`
        create index if not exists civiclogos_evidence_documents_topic_idx
        on civiclogos_evidence_documents (room_slug, topic_id, uploaded_at desc)
      `;
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToDocument(row: EvidenceDocumentRow): EvidenceDocument {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: normalizeDate(row.uploaded_at),
    downloadHref: `/api/evidence/${row.id}`,
    extraction: row.extraction,
  };
}

export function createDatabaseEvidenceDocumentStore(): DatabaseEvidenceDocumentStore {
  return {
    async createEvidenceDocument(input) {
      await ensureEvidenceDocumentTable();
      const sql = getSqlClient();
      const id = randomUUID();
      const uploadedAt = new Date().toISOString();
      const extraction = await extractEvidenceDocument(
        input.fileName,
        input.mimeType,
        input.bytes,
      );

      await sql`
        insert into civiclogos_evidence_documents (
          id,
          room_slug,
          topic_id,
          topic_title,
          file_name,
          mime_type,
          size_bytes,
          uploaded_at,
          extraction,
          content
        ) values (
          ${id},
          ${input.roomSlug},
          ${input.topicId},
          ${input.topicTitle},
          ${input.fileName},
          ${input.mimeType},
          ${input.bytes.byteLength},
          ${uploadedAt},
          ${sql.json(extraction)},
          ${input.bytes}
        )
      `;

      return {
        id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.bytes.byteLength,
        uploadedAt,
        downloadHref: `/api/evidence/${id}`,
        extraction,
      };
    },

    async getEvidenceDocument(id) {
      await ensureEvidenceDocumentTable();
      const sql = getSqlClient();
      const rows = await sql<EvidenceDocumentRow[]>`
        select id, file_name, mime_type, size_bytes, uploaded_at, extraction, content
        from civiclogos_evidence_documents
        where id = ${id}
        limit 1
      `;

      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        document: rowToDocument(row),
        bytes: row.content,
      };
    },
  };
}
