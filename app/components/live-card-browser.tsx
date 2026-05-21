"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { LiveCardIndexItem } from "../lib/civic-logos";
import styles from "./live-card-browser.module.css";

type LiveCardBrowserProps = {
  cards: readonly LiveCardIndexItem[];
  initialQuery?: string;
  initialRoom?: string;
};

type RoomFilter = {
  key: string;
  label: string;
  count: number;
};

const ALL_ROOMS_KEY = "all";
const ALL_ROOMS_LABEL = "All rooms";

function getRoomKey(roomHref: string) {
  if (roomHref === "/healthcare") {
    return "healthcare";
  }

  return roomHref.split("/").at(-1) ?? "unknown-room";
}

function getValidRoomKey(
  roomKey: string | null | undefined,
  roomFilters: readonly RoomFilter[],
) {
  if (!roomKey) {
    return ALL_ROOMS_KEY;
  }

  return roomFilters.some((room) => room.key === roomKey)
    ? roomKey
    : ALL_ROOMS_KEY;
}

export default function LiveCardBrowser({
  cards,
  initialQuery = "",
  initialRoom,
}: LiveCardBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();

  const roomFilters = useMemo(
    () => {
      const roomCounts = new Map<string, Omit<RoomFilter, "count">>();
      const counts = new Map<string, number>();

      cards.forEach((card) => {
        const key = getRoomKey(card.roomHref);

        roomCounts.set(key, {
          key,
          label: card.roomTitle,
        });
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      return [
        {
          key: ALL_ROOMS_KEY,
          label: ALL_ROOMS_LABEL,
          count: cards.length,
        },
        ...Array.from(roomCounts.values())
          .sort((left, right) => left.label.localeCompare(right.label))
          .map((room) => ({
            ...room,
            count: counts.get(room.key) ?? 0,
          })),
      ];
    },
    [cards],
  );

  const [activeRoom, setActiveRoom] = useState(() =>
    getValidRoomKey(initialRoom, roomFilters),
  );
  const [query, setQuery] = useState(initialQuery);

  const updateUrl = useCallback(
    (nextRoom: string, nextQuery: string) => {
      const params = new URLSearchParams();

      if (nextRoom === ALL_ROOMS_KEY) {
        params.delete("room");
      } else {
        params.set("room", nextRoom);
      }

      const trimmedQuery = nextQuery.trim();

      if (!trimmedQuery) {
        params.delete("q");
      } else {
        params.set("q", trimmedQuery);
      }

      const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const activeRoomLabel =
    roomFilters.find((room) => room.key === activeRoom)?.label ??
    ALL_ROOMS_LABEL;
  const hasActiveFilters =
    activeRoom !== ALL_ROOMS_KEY || normalizedQuery.length > 0;

  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        const roomMatch =
          activeRoom === ALL_ROOMS_KEY ||
          getRoomKey(card.roomHref) === activeRoom;

        if (!roomMatch) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = [
          card.title,
          card.summary,
          card.roomTitle,
          card.metric,
          card.roomStage,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      }),
    [activeRoom, cards, normalizedQuery],
  );

  return (
    <div className={styles.shell}>
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          {roomFilters.map((room) => (
            <button
              aria-pressed={room.key === activeRoom}
              className={
                room.key === activeRoom
                  ? styles.filterChipActive
                  : styles.filterChip
              }
              key={room.key}
              onClick={() => {
                setActiveRoom(room.key);
                updateUrl(room.key, query);
              }}
              type="button"
            >
              <span>{room.label}</span>
              <strong>{room.count}</strong>
            </button>
          ))}
        </div>

        <label className={styles.searchWrap}>
          <span className={styles.searchLabel}>Search live cards</span>
          <input
            className={styles.searchInput}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              updateUrl(activeRoom, nextQuery);
            }}
            placeholder="Search by room, title, or pressure point"
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className={styles.resultsMeta}>
        <span className={styles.resultsSummary}>
          Showing {filteredCards.length} live topic card
          {filteredCards.length === 1 ? "" : "s"}
          {activeRoom === ALL_ROOMS_KEY ? "" : ` in ${activeRoomLabel}`}
          {normalizedQuery ? ` matching “${query.trim()}”` : ""}
        </span>
        {hasActiveFilters ? (
          <button
            className={styles.resetButton}
            onClick={() => {
              setActiveRoom(ALL_ROOMS_KEY);
              setQuery("");
              updateUrl(ALL_ROOMS_KEY, "");
            }}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredCards.length ? (
        <div className={styles.cardGrid}>
          {filteredCards.map((card) => (
            <article className={styles.card} key={card.href}>
              <div className={styles.cardMeta}>
                <span>{card.roomTitle}</span>
                <strong>{card.metric}</strong>
              </div>

              <h3>{card.title}</h3>
              <p>{card.summary}</p>

              <div className={styles.cardFooter}>
                <span>{card.roomStage}</span>

                <div className={styles.cardActions}>
                  <Link className={styles.primaryAction} href={card.href!}>
                    Open card
                  </Link>
                  <Link className={styles.secondaryAction} href={card.roomHref}>
                    Open room
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3>No cards match this view yet.</h3>
          <p>
            Try a broader room filter or clear the search to return to the full
            live card index.
          </p>
        </div>
      )}
    </div>
  );
}
