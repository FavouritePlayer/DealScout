import type { Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

type Props = {
  listings: Listing[];
  explanation?: string;
  loading?: boolean;
};

export default function ResultsGrid({ listings, explanation, loading }: Props) {
  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6 flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Results</h2>
          {explanation && (
            <p className="text-sm text-[var(--muted)] mt-1">{explanation}</p>
          )}
        </div>
        <span className="text-xs text-[var(--muted)] font-medium">
          {loading ? "Loading…" : `${listings.length} listings`}
        </span>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-50 border border-[var(--border)] rounded-2xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-sm">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}
