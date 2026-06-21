"use client";

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

const CATEGORY_ACCENT: Record<string, string> = {
  furniture: "bg-amber-50 text-amber-800 border-amber-200",
  electronics: "bg-sky-50 text-sky-800 border-sky-200",
  tools: "bg-orange-50 text-orange-800 border-orange-200",
  collectibles: "bg-violet-50 text-violet-800 border-violet-200",
  sporting_goods: "bg-emerald-50 text-emerald-800 border-emerald-200",
  appliances: "bg-rose-50 text-rose-800 border-rose-200",
  instruments: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  clothing: "bg-pink-50 text-pink-800 border-pink-200",
  toys: "bg-yellow-50 text-yellow-800 border-yellow-200",
  books: "bg-indigo-50 text-indigo-800 border-indigo-200",
  other: "bg-neutral-50 text-neutral-800 border-neutral-200",
};

const CONDITION_DOT: Record<string, string> = {
  "like new": "bg-emerald-500",
  good: "bg-sky-500",
  fair: "bg-amber-500",
  "needs repair": "bg-red-500",
};

type Props = {
  item: QueueItem;
  onReject: (item: QueueItem) => void;
  onAccept: (item: QueueItem) => void;
  busy?: boolean;
};

export default function QueueCard({ item, onReject, onAccept, busy }: Props) {
  const catLabel = CATEGORY_LABEL[item.category] ?? item.category;
  const accent =
    CATEGORY_ACCENT[item.category] ??
    "bg-neutral-50 text-neutral-800 border-neutral-200";
  const condDot = CONDITION_DOT[item.condition] ?? "bg-neutral-400";

  return (
    <article className="bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold rounded-full px-2.5 py-1 border ${accent}`}
          >
            {catLabel}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium">
            <span className={`w-2 h-2 rounded-full ${condDot}`} />
            {item.condition}
          </span>
        </div>
        <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
          {item.distance_miles.toFixed(1)} mi
        </span>
      </div>

      <div className="px-5 pt-3">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      <div className="mx-5 mt-4 mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
            Projected profit
          </span>
          <span className="text-[10px] font-bold text-emerald-700">
            +{Math.round(item.margin_pct * 100)}%
          </span>
        </div>
        <div className="text-3xl font-bold text-emerald-900 mt-0.5 leading-none">
          ${item.projected_profit}
        </div>
        <div className="text-[11px] text-emerald-800 mt-2 flex items-center justify-between">
          <span>
            Asking <span className="font-semibold">${item.asking_price}</span>
          </span>
          <span>
            Resale ~<span className="font-semibold">${item.estimated_resale_value}</span>
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-2 mt-auto">
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
          Add to queue
        </button>
      </div>
    </article>
  );
}
