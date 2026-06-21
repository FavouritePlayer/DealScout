import type { Preference } from "@/lib/types";

const COLOR_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  black: "bg-neutral-900",
  green: "bg-emerald-500",
  red: "bg-red-500",
  brown: "bg-amber-800",
  grey: "bg-slate-400",
  white: "bg-white border border-[var(--border)]",
  beige: "bg-amber-200",
};

export default function MemoryPanel({ preferences }: { preferences: Preference[] }) {
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
            Try saying <span className="italic">&ldquo;I don&rsquo;t like blue chairs&rdquo;</span>.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {preferences.map((p, i) => (
            <li
              key={`${p.key}-${p.value}-${i}`}
              className="flex items-center gap-3 bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3"
            >
              {p.key === "color" && (
                <span
                  className={`w-4 h-4 rounded-full shrink-0 ${
                    COLOR_DOT[p.value] ?? "bg-neutral-300"
                  }`}
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold capitalize">
                  {p.polarity === "avoid" ? "Avoid" : "Prefer"} {p.value}
                </div>
                <div className="text-xs text-[var(--muted)] capitalize">
                  {p.key}
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
          ))}
        </ul>
      )}
    </section>
  );
}
