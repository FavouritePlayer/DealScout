"use client";

import { useEffect, useState } from "react";
import type { Preference } from "@/lib/types";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "tools", label: "Tools" },
  { value: "collectibles", label: "Collectibles" },
  { value: "sporting_goods", label: "Sporting goods" },
  { value: "appliances", label: "Appliances" },
  { value: "instruments", label: "Instruments" },
  { value: "clothing", label: "Clothing" },
  { value: "toys", label: "Toys" },
  { value: "books", label: "Books" },
  { value: "other", label: "Other" },
];

const CONDITIONS: { value: string; label: string }[] = [
  { value: "like new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs repair", label: "Needs repair" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

type Props = {
  preferences: Preference[];
  onSave: (preferences: Preference[]) => Promise<void>;
  saving?: boolean;
};

function emptyRule(): Preference {
  return { key: "category", value: "furniture", polarity: "avoid" };
}

function labelFor(pref: Preference): string {
  if (pref.key === "category") {
    return CATEGORY_LABEL[pref.value] ?? pref.value.replace(/_/g, " ");
  }
  return pref.value;
}

export default function MemoryView({ preferences, onSave, saving }: Props) {
  const [draft, setDraft] = useState<Preference[]>(preferences);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(preferences);
    setDirty(false);
  }, [preferences]);

  const updateRow = (index: number, patch: Partial<Preference>) => {
    setDraft((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.key === "category") {
          next.value = "furniture";
        } else if (patch.key === "condition") {
          next.value = "good";
        }
        return next;
      })
    );
    setDirty(true);
  };

  const removeRow = (index: number) => {
    setDraft((rows) => rows.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addRow = () => {
    setDraft((rows) => [...rows, emptyRule()]);
    setDirty(true);
  };

  const handleSave = async () => {
    const deduped = draft.filter(
      (p, i, arr) =>
        arr.findIndex(
          (q) =>
            q.key === p.key && q.value === p.value && q.polarity === p.polarity
        ) === i
    );
    await onSave(deduped);
    setDirty(false);
  };

  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Memory</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Edit what DealScout remembers about your flip preferences. Changes
            sync to HydraDB and apply on the next scan.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 shrink-0">
          Live
        </span>
      </header>

      {draft.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-2xl py-12 px-4 text-center">
          <p className="text-sm text-[var(--muted)]">No rules yet.</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Add a rule below, or reject a queue card with a reason.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {draft.map((pref, i) => (
            <li
              key={`${pref.key}-${pref.value}-${i}`}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr_120px_auto] gap-3 items-center bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3"
            >
              <select
                value={pref.key}
                onChange={(e) =>
                  updateRow(i, {
                    key: e.target.value as Preference["key"],
                  })
                }
                className="text-sm font-medium rounded-xl border border-[var(--border)] bg-white px-3 py-2"
              >
                <option value="category">Category</option>
                <option value="condition">Condition</option>
              </select>

              <select
                value={pref.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                className="text-sm font-medium rounded-xl border border-[var(--border)] bg-white px-3 py-2"
              >
                {(pref.key === "category" ? CATEGORIES : CONDITIONS).map(
                  (opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  )
                )}
              </select>

              <select
                value={pref.polarity}
                onChange={(e) =>
                  updateRow(i, {
                    polarity: e.target.value as Preference["polarity"],
                  })
                }
                className={`text-sm font-semibold rounded-xl border px-3 py-2 ${
                  pref.polarity === "avoid"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <option value="avoid">Avoid</option>
                <option value="prefer">Prefer</option>
              </select>

              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-sm font-semibold text-neutral-500 hover:text-red-600 px-2 py-2 transition"
                aria-label={`Remove ${labelFor(pref)} rule`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={addRow}
          disabled={saving}
          className="text-sm font-semibold rounded-full px-4 py-2.5 bg-white border border-[var(--border)] hover:bg-neutral-50 disabled:opacity-50 transition"
        >
          + Add rule
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="text-sm font-semibold rounded-full px-4 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 transition"
        >
          {saving ? "Saving to HydraDB…" : "Save changes"}
        </button>
        {dirty && !saving && (
          <span className="text-xs text-amber-700 font-medium">
            Unsaved changes
          </span>
        )}
        {saving && (
          <span className="text-xs text-[var(--muted)]">
            Indexing can take ~15s
          </span>
        )}
      </div>
    </section>
  );
}
