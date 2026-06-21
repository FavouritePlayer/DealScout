import type { Listing } from "@/lib/types";

const COLOR_BAND: Record<string, string> = {
  blue: "bg-blue-500",
  black: "bg-neutral-900",
  green: "bg-emerald-500",
  red: "bg-red-500",
  brown: "bg-amber-800",
  grey: "bg-slate-400",
  white: "bg-neutral-100 border-b border-[var(--border)]",
  beige: "bg-amber-200",
};

const COLOR_LABEL_BG: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700",
  black: "bg-neutral-100 text-neutral-900",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  brown: "bg-amber-50 text-amber-900",
  grey: "bg-slate-100 text-slate-700",
  white: "bg-neutral-50 text-neutral-700",
  beige: "bg-amber-50 text-amber-800",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const bandClass = COLOR_BAND[listing.color] ?? "bg-neutral-200";
  const labelClass = COLOR_LABEL_BG[listing.color] ?? "bg-neutral-100 text-neutral-700";

  return (
    <article className="group bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className={`h-20 w-full ${bandClass}`} />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug flex-1">
            {listing.title}
          </h3>
          <span
            className={`text-[10px] uppercase tracking-wide font-bold rounded-full px-2 py-1 ${labelClass}`}
          >
            {listing.color}
          </span>
        </div>
        {listing.description && (
          <p className="text-xs text-[var(--muted)] line-clamp-2">
            {listing.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
              Price
            </span>
            <span className="text-lg font-bold">${listing.price}</span>
          </div>
          {listing.location && (
            <span className="text-[11px] text-[var(--muted)]">
              {listing.location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
