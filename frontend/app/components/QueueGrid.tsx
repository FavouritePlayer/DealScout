"use client";

import type { QueueItem } from "@/lib/types";
import QueueCard from "./QueueCard";

type Props = {
  items: QueueItem[];
  explanation?: string;
  loading?: boolean;
  onReject: (item: QueueItem) => void;
  onAccept: (item: QueueItem) => void;
  busy?: boolean;
};

export default function QueueGrid({
  items,
  explanation,
  loading,
  onReject,
  onAccept,
  busy,
}: Props) {
  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Flip queue</h2>
          {explanation && (
            <p className="text-sm text-[var(--muted)] mt-1">{explanation}</p>
          )}
        </div>
        <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">
          {loading ? "Scanning…" : `${items.length} undervalued`}
        </span>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-50 border border-[var(--border)] rounded-2xl h-72 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-sm font-medium">
            No undervalued listings in your queue.
          </p>
          <p className="text-xs mt-1">
            Either every category has been rejected or the scan came up empty.
            Try Rescan from scratch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {items.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              onReject={onReject}
              onAccept={onAccept}
              busy={busy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
