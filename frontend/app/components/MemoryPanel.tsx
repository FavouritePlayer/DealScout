import type { Preference } from "@/lib/types";

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
  furniture: "bg-amber-100 text-amber-800",
  electronics: "bg-sky-100 text-sky-800",
  tools: "bg-orange-100 text-orange-800",
  collectibles: "bg-violet-100 text-violet-800",
  sporting_goods: "bg-emerald-100 text-emerald-800",
  appliances: "bg-rose-100 text-rose-800",
  instruments: "bg-fuchsia-100 text-fuchsia-800",
  clothing: "bg-pink-100 text-pink-800",
  toys: "bg-yellow-100 text-yellow-800",
  books: "bg-indigo-100 text-indigo-800",
  other: "bg-neutral-100 text-neutral-800",
};

export default function MemoryPanel({
  preferences,
}: {
  preferences: Preference[];
}) {
  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 sticky top-6">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Memory</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            What DealScout knows about you
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">
          Live
        </span>
      </header>

      {preferences.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-2xl py-10 px-4 text-center">
          <p className="text-sm text-[var(--muted)]">
            No preferences saved yet.
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Reject a card and tell DealScout why — it&rsquo;ll remember.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {preferences.map((p, i) => {
            const label =
              p.key === "category"
                ? CATEGORY_LABEL[p.value] ?? p.value
                : p.value;
            const accent =
              p.key === "category"
                ? CATEGORY_ACCENT[p.value] ??
                  "bg-neutral-100 text-neutral-800"
                : "bg-neutral-100 text-neutral-800";
            return (
              <li
                key={`${p.key}-${p.value}-${i}`}
                className="flex items-center gap-3 bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3"
              >
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-1 ${accent}`}
                >
                  {p.key}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold capitalize">
                    {p.polarity === "avoid" ? "Avoid" : "Prefer"} {label}
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-1 ${
                    p.polarity === "avoid"
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {p.polarity}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
