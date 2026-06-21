"use client";

import type { QueueItem } from "@/lib/types";
import QueueCard from "./QueueCard";

type Props = {
  items: QueueItem[];
  onRemove: (item: QueueItem) => void;
};

export default function SavedFlips({ items, onRemove }: Props) {
  const totalProfit = items.reduce((sum, item) => sum + item.projected_profit, 0);

  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Saved flips</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Flips you&rsquo;ve saved from the queue.
          </p>
        </div>
        <span className="text-xs text-[var(--muted)] font-medium whitespace-nowrap">
          {items.length} saved
          {items.length > 0 && (
            <span className="text-emerald-700 font-semibold">
              {" · "}${totalProfit} potential
            </span>
          )}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-sm font-medium">No saved flips yet.</p>
          <p className="text-xs mt-1">
            Hit &ldquo;Save flip&rdquo; on a queue card and it&rsquo;ll show up
            here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {items.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              mode="saved"
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}
