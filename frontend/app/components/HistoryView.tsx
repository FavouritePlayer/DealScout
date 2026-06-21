"use client";

import type { HistoryEntry } from "@/lib/types";

const TYPE_META: Record<
  HistoryEntry["type"],
  { label: string; dot: string; bg: string }
> = {
  scan: {
    label: "Scan",
    dot: "bg-sky-500",
    bg: "bg-sky-50 text-sky-800 border-sky-200",
  },
  reject: {
    label: "Reject",
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-800 border-red-200",
  },
  save: {
    label: "Saved",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  rescan: {
    label: "Reset",
    dot: "bg-violet-500",
    bg: "bg-violet-50 text-violet-800 border-violet-200",
  },
  memory_update: {
    label: "Memory",
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  entries: HistoryEntry[];
};

export default function HistoryView({ entries }: Props) {
  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 flex flex-col gap-5">
      <header>
        <h2 className="text-lg font-semibold">History</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Scans, rejections, saves, and memory edits from this session.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-2xl py-12 px-4 text-center">
          <p className="text-sm text-[var(--muted)]">Nothing here yet.</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Run a scan or reject a card to start building history.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => {
            const meta = TYPE_META[entry.type];
            return (
              <li
                key={entry.id}
                className="flex gap-4 items-start bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3"
              >
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5 border ${meta.bg}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {formatWhen(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mt-1">{entry.title}</p>
                  {entry.detail && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {entry.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
