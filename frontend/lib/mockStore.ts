import fs from "node:fs";
import path from "node:path";
import type {
  Category,
  Condition,
  Listing,
  Preference,
  QueueItem,
} from "./types";

const FIXTURE_PATH = path.join(
  process.cwd(),
  "..",
  "backend",
  "data",
  "listings_fixture.json"
);

const MARGIN_THRESHOLD = 0.25;

let fixtureCache: Listing[] | null = null;

export function loadFixture(): Listing[] {
  if (fixtureCache) return fixtureCache;
  const raw = fs.readFileSync(FIXTURE_PATH, "utf-8");
  fixtureCache = JSON.parse(raw) as Listing[];
  return fixtureCache;
}

export function classify(listings: Listing[]): QueueItem[] {
  return listings.map((l) => {
    const projected_profit = l.estimated_resale_value - l.asking_price;
    const margin_pct = projected_profit / l.asking_price;
    return {
      ...l,
      projected_profit,
      margin_pct,
      classification:
        margin_pct >= MARGIN_THRESHOLD ? "undervalued" : "overvalued",
    };
  });
}

type StoredPreference = Preference & { reason?: string };

const preferenceStore = new Map<string, StoredPreference[]>();

export function getStoredPreferences(userId: string): StoredPreference[] {
  return preferenceStore.get(userId) ?? [];
}

export function getPublicPreferences(userId: string): Preference[] {
  return getStoredPreferences(userId).map(({ key, value, polarity }) => ({
    key,
    value,
    polarity,
  }));
}

export function addPreference(userId: string, pref: StoredPreference): void {
  const existing = preferenceStore.get(userId) ?? [];
  const deduped = existing.filter(
    (p) => !(p.key === pref.key && p.value === pref.value)
  );
  preferenceStore.set(userId, [...deduped, pref]);
}

export function clearPreferences(userId: string): void {
  preferenceStore.delete(userId);
}

const CATEGORIES: Category[] = [
  "furniture",
  "electronics",
  "tools",
  "collectibles",
  "sporting_goods",
  "appliances",
  "instruments",
  "clothing",
  "toys",
  "books",
  "other",
];

const CATEGORY_SYNONYMS: Record<string, Category> = {
  furniture: "furniture",
  couch: "furniture",
  sofa: "furniture",
  chair: "furniture",
  dresser: "furniture",
  table: "furniture",
  electronics: "electronics",
  gadget: "electronics",
  laptop: "electronics",
  phone: "electronics",
  tablet: "electronics",
  headphone: "electronics",
  tools: "tools",
  tool: "tools",
  drill: "tools",
  collectible: "collectibles",
  collectibles: "collectibles",
  vintage: "collectibles",
  sporting: "sporting_goods",
  sports: "sporting_goods",
  bike: "sporting_goods",
  bicycle: "sporting_goods",
  tent: "sporting_goods",
  appliance: "appliances",
  appliances: "appliances",
  blender: "appliances",
  mixer: "appliances",
  microwave: "appliances",
  instrument: "instruments",
  instruments: "instruments",
  guitar: "instruments",
  clothing: "clothing",
  clothes: "clothing",
  toy: "toys",
  toys: "toys",
  book: "books",
  books: "books",
};

const CONDITIONS: Condition[] = ["like new", "good", "fair", "needs repair"];

const AVOID_RE =
  /(don'?t|do not|hate|dislike|avoid|no\s+more|not\s+a\s+fan|won'?t|too\s+much\s+hassle|too\s+hard|too\s+painful)/;

export type ParseResult = StoredPreference | null;

export function parseRejection(note: string): ParseResult {
  if (!note.trim()) return null;
  const lower = note.toLowerCase();
  if (!AVOID_RE.test(lower)) {
    // For an explicit reject we accept the rejection even without an avoid
    // word, but we still need a category/condition to attach the rule to.
  }

  // Condition match first — more specific phrases like "needs repair" should
  // win over a category synonym buried in the same text.
  for (const cond of CONDITIONS) {
    if (lower.includes(cond)) {
      return {
        key: "condition",
        value: cond,
        polarity: "avoid",
        reason: note,
      };
    }
  }

  for (const word of Object.keys(CATEGORY_SYNONYMS)) {
    if (new RegExp(`\\b${word}s?\\b`).test(lower)) {
      return {
        key: "category",
        value: CATEGORY_SYNONYMS[word],
        polarity: "avoid",
        reason: note,
      };
    }
  }

  return null;
}

export function applyPreferences(
  items: QueueItem[],
  prefs: StoredPreference[]
): QueueItem[] {
  const avoidCats = new Set(
    prefs.filter((p) => p.key === "category" && p.polarity === "avoid").map((p) => p.value)
  );
  const avoidConds = new Set(
    prefs.filter((p) => p.key === "condition" && p.polarity === "avoid").map((p) => p.value)
  );
  return items.filter(
    (i) => !avoidCats.has(i.category) && !avoidConds.has(i.condition)
  );
}

export function buildQueue(userId: string): {
  queue: QueueItem[];
  explanation: string;
  memory_used: Preference[];
} {
  const classified = classify(loadFixture());
  const undervalued = classified.filter(
    (i) => i.classification === "undervalued"
  );
  const stored = getStoredPreferences(userId);
  const filtered = applyPreferences(undervalued, stored);
  const sorted = [...filtered].sort(
    (a, b) => b.projected_profit - a.projected_profit
  );

  return {
    queue: sorted,
    explanation: buildExplanation(stored),
    memory_used: getPublicPreferences(userId),
  };
}

function buildExplanation(prefs: StoredPreference[]): string {
  if (prefs.length === 0) {
    return "Showing every undervalued listing the scan found.";
  }
  const parts = prefs.map((p) => {
    const label =
      p.key === "category"
        ? `${formatCategory(p.value)} listings`
        : `listings in ${p.value} condition`;
    const becauseClause = p.reason
      ? ` since you said “${truncate(p.reason, 60)}”`
      : "";
    return `excluded ${label}${becauseClause}`;
  });
  const joined =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(", ") + ", and " + parts.at(-1);
  return capitalize(joined) + ".";
}

function formatCategory(c: string): string {
  return c.replace(/_/g, " ");
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
