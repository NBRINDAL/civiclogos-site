import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import {
  CandidateAttachmentTarget,
  CandidateEvidentialDistance,
  CandidateEvidenceStatus,
  CandidateInternalAiNote,
  CandidateOrigin,
  CandidateRecord,
  CandidateRejectedRoute,
  CandidateReviewStatus,
  CreateCandidateInput,
  RouteCandidateToTopicInput,
  resolveCandidateRoutingMetadata,
} from "./candidate-types";

type ListCandidateFilters = {
  roomId?: string;
  topicId?: string;
  reviewStatus?: CandidateReviewStatus;
  limit?: number;
};

type CandidateRow = {
  id: string;
  source_message_id: string;
  room_id: string;
  topic_id: string;
  raw_user_text: string;
  normalized_title: string;
  normalized_body: string;
  proposed_lane: CandidateRecord["proposedLane"];
  proposed_attachment_target: CandidateAttachmentTarget;
  scale_map: string[];
  evidence_status: CandidateEvidenceStatus;
  evidence_anchor: string | null;
  evidential_distance: CandidateEvidentialDistance;
  impact_field: string[];
  internal_ai_notes: CandidateInternalAiNote[];
  review_status: CandidateReviewStatus;
  promoted_contribution_id: string | null;
  routing_status: CandidateRecord["routingStatus"] | null;
  routed_room_id: string | null;
  routed_topic_id: string | null;
  route_confidence: CandidateRecord["routeConfidence"] | null;
  route_reason: string | null;
  matched_signals: string[] | null;
  rejected_routes: CandidateRejectedRoute[] | null;
  ai_assisted: boolean;
  origin: CandidateOrigin;
  created_at: string | Date;
  updated_at: string | Date;
};

type CandidateStoreMetadata = {
  prototype: false;
  mode: "database";
  note: string;
};

type DatabaseCandidateStore = {
  getCandidateStoreMetadata: () => Promise<CandidateStoreMetadata>;
  listCandidateRecords: (
    filters?: ListCandidateFilters,
  ) => Promise<CandidateRecord[]>;
  getCandidateById: (id: string) => Promise<CandidateRecord | null>;
  createCandidateRecord: (input: CreateCandidateInput) => Promise<CandidateRecord>;
  routeCandidateToTopic: (
    id: string,
    input: RouteCandidateToTopicInput,
  ) => Promise<CandidateRecord | null>;
  updateCandidateReviewStatus: (
    id: string,
    reviewStatus: CandidateReviewStatus,
    promotedContributionId?: string,
  ) => Promise<CandidateRecord | null>;
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

export function isDatabaseCandidateStoreConfigured() {
  return Boolean(getDatabaseUrl());
}

function getSqlClient() {
  if (!sqlClient) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("Candidate database is not configured.");
    }

    sqlClient = postgres(connectionString, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureCandidateTable() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSqlClient();

      await sql`
        create table if not exists civiclogos_candidate_records (
          id text primary key,
          source_message_id text not null,
          room_id text not null,
          topic_id text not null,
          raw_user_text text not null,
          normalized_title text not null,
          normalized_body text not null,
          proposed_lane text not null,
          proposed_attachment_target jsonb not null,
          scale_map jsonb not null,
          evidence_status text not null,
          evidence_anchor text,
          evidential_distance text not null,
          impact_field jsonb not null,
          internal_ai_notes jsonb not null,
          review_status text not null,
          promoted_contribution_id text,
          routing_status text,
          routed_room_id text,
          routed_topic_id text,
          route_confidence text,
          route_reason text,
          matched_signals jsonb,
          rejected_routes jsonb,
          ai_assisted boolean not null,
          origin text not null,
          created_at timestamptz not null,
          updated_at timestamptz not null
        )
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists routing_status text
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists routed_room_id text
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists routed_topic_id text
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists route_confidence text
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists route_reason text
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists matched_signals jsonb
      `;

      await sql`
        alter table civiclogos_candidate_records
        add column if not exists rejected_routes jsonb
      `;

      await sql`
        create index if not exists civiclogos_candidate_records_topic_idx
        on civiclogos_candidate_records (room_id, topic_id, created_at desc)
      `;

      await sql`
        create index if not exists civiclogos_candidate_records_review_idx
        on civiclogos_candidate_records (review_status, created_at desc)
      `;
    })();
  }

  return initPromise;
}

function normalizeDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToCandidate(row: CandidateRow): CandidateRecord {
  const routing = resolveCandidateRoutingMetadata({
    roomId: row.room_id,
    topicId: row.topic_id,
    reviewStatus: row.review_status,
    routingStatus: row.routing_status ?? undefined,
    routedRoomId: row.routed_room_id ?? undefined,
    routedTopicId: row.routed_topic_id ?? undefined,
    routeConfidence: row.route_confidence ?? undefined,
    routeReason: row.route_reason ?? undefined,
    matchedSignals: row.matched_signals ?? undefined,
    rejectedRoutes: row.rejected_routes ?? undefined,
  });

  return {
    id: row.id,
    sourceMessageId: row.source_message_id,
    roomId: row.room_id,
    topicId: row.topic_id,
    rawUserText: row.raw_user_text,
    normalizedTitle: row.normalized_title,
    normalizedBody: row.normalized_body,
    proposedLane: row.proposed_lane,
    proposedAttachmentTarget: row.proposed_attachment_target,
    scaleMap: row.scale_map,
    evidenceStatus: row.evidence_status,
    evidenceAnchor: row.evidence_anchor ?? undefined,
    evidentialDistance: row.evidential_distance,
    impactField: row.impact_field,
    internalAiNotes: row.internal_ai_notes,
    reviewStatus: row.review_status,
    promotedContributionId: row.promoted_contribution_id ?? undefined,
    ...routing,
    aiAssisted: true,
    origin: row.origin,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}

async function listRows(filters: ListCandidateFilters = {}) {
  await ensureCandidateTable();
  const sql = getSqlClient();
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);

  return sql<CandidateRow[]>`
    select *
    from civiclogos_candidate_records
    where (${filters.roomId ?? null}::text is null or room_id = ${filters.roomId ?? null})
      and (${filters.topicId ?? null}::text is null or topic_id = ${filters.topicId ?? null})
      and (${filters.reviewStatus ?? null}::text is null or review_status = ${filters.reviewStatus ?? null})
    order by created_at desc
    limit ${limit}
  `;
}

export function createDatabaseCandidateStore(): DatabaseCandidateStore {
  return {
    async getCandidateStoreMetadata() {
      await ensureCandidateTable();

      return {
        prototype: false,
        mode: "database",
        note: "Persistent candidate storage is active. Pre-ledger candidate suggestions are stored in the configured database.",
      };
    },

    async listCandidateRecords(filters = {}) {
      const rows = await listRows(filters);
      return rows.map(rowToCandidate);
    },

    async getCandidateById(id) {
      await ensureCandidateTable();
      const sql = getSqlClient();
      const rows = await sql<CandidateRow[]>`
        select *
        from civiclogos_candidate_records
        where id = ${id}
        limit 1
      `;

      const row = rows[0];
      return row ? rowToCandidate(row) : null;
    },

    async createCandidateRecord(input) {
      await ensureCandidateTable();
      const sql = getSqlClient();
      const timestamp = new Date().toISOString();
      const routing = resolveCandidateRoutingMetadata({
        roomId: input.roomId,
        topicId: input.topicId,
        reviewStatus: input.reviewStatus ?? "pending_human_review",
        routingStatus: input.routingStatus,
        routedRoomId: input.routedRoomId,
        routedTopicId: input.routedTopicId,
        routeConfidence: input.routeConfidence,
        routeReason: input.routeReason,
        matchedSignals: input.matchedSignals,
        rejectedRoutes: input.rejectedRoutes,
      });
      const candidate: CandidateRecord = {
        ...input,
        id: randomUUID(),
        reviewStatus: input.reviewStatus ?? "pending_human_review",
        promotedContributionId: input.promotedContributionId,
        ...routing,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await sql`
        insert into civiclogos_candidate_records (
          id,
          source_message_id,
          room_id,
          topic_id,
          raw_user_text,
          normalized_title,
          normalized_body,
          proposed_lane,
          proposed_attachment_target,
          scale_map,
          evidence_status,
          evidence_anchor,
          evidential_distance,
          impact_field,
          internal_ai_notes,
          review_status,
          promoted_contribution_id,
          routing_status,
          routed_room_id,
          routed_topic_id,
          route_confidence,
          route_reason,
          matched_signals,
          rejected_routes,
          ai_assisted,
          origin,
          created_at,
          updated_at
        ) values (
          ${candidate.id},
          ${candidate.sourceMessageId},
          ${candidate.roomId},
          ${candidate.topicId},
          ${candidate.rawUserText},
          ${candidate.normalizedTitle},
          ${candidate.normalizedBody},
          ${candidate.proposedLane},
          ${sql.json(candidate.proposedAttachmentTarget)},
          ${sql.json(candidate.scaleMap)},
          ${candidate.evidenceStatus},
          ${candidate.evidenceAnchor ?? null},
          ${candidate.evidentialDistance},
          ${sql.json(candidate.impactField)},
          ${sql.json(candidate.internalAiNotes)},
          ${candidate.reviewStatus},
          ${candidate.promotedContributionId ?? null},
          ${candidate.routingStatus},
          ${candidate.routedRoomId ?? null},
          ${candidate.routedTopicId ?? null},
          ${candidate.routeConfidence},
          ${candidate.routeReason},
          ${sql.json(candidate.matchedSignals)},
          ${sql.json(candidate.rejectedRoutes)},
          ${candidate.aiAssisted},
          ${candidate.origin},
          ${candidate.createdAt},
          ${candidate.updatedAt}
        )
      `;

      return candidate;
    },

    async routeCandidateToTopic(id, input) {
      await ensureCandidateTable();
      const sql = getSqlClient();
      const updatedAt = new Date().toISOString();
      const rows = input.scaleMap
        ? await sql<CandidateRow[]>`
            update civiclogos_candidate_records
            set
              room_id = ${input.roomId},
              topic_id = ${input.topicId},
              review_status = ${input.reviewStatus},
              routing_status = ${input.routingStatus},
              routed_room_id = ${input.routedRoomId ?? input.roomId},
              routed_topic_id = ${input.routedTopicId ?? input.topicId},
              route_confidence = ${input.routeConfidence ?? null},
              route_reason = ${input.routeReason ?? null},
              matched_signals = ${
                input.matchedSignals ? sql.json(input.matchedSignals) : null
              },
              rejected_routes = ${
                input.rejectedRoutes ? sql.json(input.rejectedRoutes) : null
              },
              scale_map = ${sql.json(input.scaleMap)},
              updated_at = ${updatedAt}
            where id = ${id}
            returning *
          `
        : await sql<CandidateRow[]>`
            update civiclogos_candidate_records
            set
              room_id = ${input.roomId},
              topic_id = ${input.topicId},
              review_status = ${input.reviewStatus},
              routing_status = ${input.routingStatus},
              routed_room_id = ${input.routedRoomId ?? input.roomId},
              routed_topic_id = ${input.routedTopicId ?? input.topicId},
              route_confidence = ${input.routeConfidence ?? null},
              route_reason = ${input.routeReason ?? null},
              matched_signals = ${
                input.matchedSignals ? sql.json(input.matchedSignals) : null
              },
              rejected_routes = ${
                input.rejectedRoutes ? sql.json(input.rejectedRoutes) : null
              },
              updated_at = ${updatedAt}
            where id = ${id}
            returning *
          `;

      const row = rows[0];
      return row ? rowToCandidate(row) : null;
    },

    async updateCandidateReviewStatus(id, reviewStatus, promotedContributionId) {
      await ensureCandidateTable();
      const sql = getSqlClient();
      const updatedAt = new Date().toISOString();
      const rows = await sql<CandidateRow[]>`
        update civiclogos_candidate_records
        set
          review_status = ${reviewStatus},
          promoted_contribution_id = ${promotedContributionId ?? null},
          updated_at = ${updatedAt}
        where id = ${id}
        returning *
      `;

      const row = rows[0];
      return row ? rowToCandidate(row) : null;
    },
  };
}
