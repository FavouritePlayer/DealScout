"use client";

import { useEffect, useState } from "react";
import type { QueueItem } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  furniture: "Furniture",
  electronics: "Electronics",
  tools: "Tools",
  collectibles: "Collectibles",
  sporting_goods: "Sporting goods",
  appliances: "Appliances",
  instruments: "Instruments",
  clothing: "Clothing",
  toys: "Toys",
  books: "Books",
  other: "Other",
};

type Props = {
  items: QueueItem[];
  explanation?: string;
  loading?: boolean;
  onReject: (item: QueueItem) => void;
  onAccept: (item: QueueItem) => void;
  busy?: boolean;
};

export default function CarouselView({
  items,
  explanation,
  loading,
  onReject,
  onAccept,
  busy,
}: Props) {
  const [index, setIndex] = useState(0);

  // Items shrink as the user rejects/accepts — keep the index in range
  // rather than pointing past the end of a shorter list.
  useEffect(() => {
    if (index >= items.length) {
      setIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, index]);

  if (loading) {
    return (
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6">
        <div className="bg-neutral-50 border border-[var(--border)] rounded-2xl h-96 animate-pulse" />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6">
        <div className="text-center py-16 text-[var(--muted)] border border-dashed border-[var(--border)] rounded-2xl">
          <p className="text-sm font-medium">
            No undervalued listings in your queue.
          </p>
        </div>
      </section>
    );
  }

  const item = items[index];
  const catLabel = CATEGORY_LABEL[item.category] ?? item.category;

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
          {index + 1} of {items.length}
        </span>
      </header>

      <article className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-neutral-100 overflow-hidden h-72 md:h-full flex items-center justify-center">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm text-[var(--muted)]">No image available</span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold rounded-full px-2.5 py-1 border bg-neutral-50 text-neutral-800 border-neutral-200">
              {catLabel}
            </span>
            <span className="text-[11px] text-neutral-600 font-medium">
              {item.condition}
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              {item.distance_miles.toFixed(1)} mi
            </span>
          </div>

          <h3 className="text-xl font-bold leading-snug mt-3">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-[var(--muted)] mt-2">{item.description}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900 mt-3"
            >
              View original listing ↗
            </a>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 px-5 py-4 mt-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-700">
                Projected profit
              </span>
              <span className="text-xs font-bold text-emerald-700">
                +{Math.round(item.margin_pct * 100)}%
              </span>
            </div>
            <div className="text-4xl font-bold text-emerald-900 mt-1 leading-none">
              ${item.projected_profit}
            </div>
            <div className="text-sm text-emerald-800 mt-3 flex items-center justify-between">
              <span>
                Asking <span className="font-semibold">${item.asking_price}</span>
              </span>
              <span>
                Resale ~<span className="font-semibold">${item.estimated_resale_value}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => onReject(item)}
              disabled={busy}
              className="flex-1 text-sm font-semibold rounded-full px-4 py-2.5 bg-white border border-[var(--border)] text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition"
            >
              Reject
            </button>
            <button
              onClick={() => onAccept(item)}
              disabled={busy}
              className="flex-1 text-sm font-semibold rounded-full px-4 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              Save flip
            </button>
          </div>
        </div>
      </article>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-sm font-semibold rounded-full px-4 py-2 bg-white border border-[var(--border)] hover:bg-neutral-50 disabled:opacity-40 transition"
        >
          ← Prev
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          disabled={index >= items.length - 1}
          className="text-sm font-semibold rounded-full px-4 py-2 bg-white border border-[var(--border)] hover:bg-neutral-50 disabled:opacity-40 transition"
        >
          Next →
        </button>
      </div>
    </section>
  );
}
