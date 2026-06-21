import fs from "node:fs";
import path from "node:path";
import type { Listing, Preference } from "./types";

const FIXTURE_PATH = path.join(
  process.cwd(),
  "..",
  "backend",
  "data",
  "chairs_fixture.json"
);

let fixtureCache: Listing[] | null = null;

export function loadFixture(): Listing[] {
  if (fixtureCache) return fixtureCache;
  const raw = fs.readFileSync(FIXTURE_PATH, "utf-8");
  fixtureCache = JSON.parse(raw) as Listing[];
  return fixtureCache;
}

const preferenceStore = new Map<string, Preference[]>();

export function getPreferences(userId: string): Preference[] {
  return preferenceStore.get(userId) ?? [];
}

export function addPreference(userId: string, pref: Preference): void {
  const existing = preferenceStore.get(userId) ?? [];
  const deduped = existing.filter(
    (p) => !(p.key === pref.key && p.value === pref.value)
  );
  preferenceStore.set(userId, [...deduped, pref]);
}

export function clearPreferences(userId: string): void {
  preferenceStore.delete(userId);
}

const COLOR_WORDS = [
  "blue",
  "black",
  "green",
  "red",
  "brown",
  "grey",
  "gray",
  "white",
  "beige",
];

export function parsePreferenceFromNote(note: string): Preference | null {
  const lower = note.toLowerCase();
  const avoidPattern = /(don'?t|do not|hate|dislike|avoid|no\s+more|not\s+a\s+fan)/;
  const isAvoid = avoidPattern.test(lower);
  if (!isAvoid) return null;

  for (const color of COLOR_WORDS) {
    if (lower.includes(color)) {
      const normalized = color === "gray" ? "grey" : color;
      return { key: "color", value: normalized, polarity: "avoid" };
    }
  }
  return null;
}

export function applyPreferences(
  listings: Listing[],
  prefs: Preference[]
): Listing[] {
  const avoidColors = new Set(
    prefs.filter((p) => p.key === "color" && p.polarity === "avoid").map((p) => p.value)
  );
  return listings.filter((l) => !avoidColors.has(l.color));
}

export function buildExplanation(prefs: Preference[]): string {
  const avoidColors = prefs
    .filter((p) => p.key === "color" && p.polarity === "avoid")
    .map((p) => p.value);

  if (avoidColors.length === 0) {
    return "Showing all chairs that matched your search.";
  }
  if (avoidColors.length === 1) {
    return `Excluded ${avoidColors[0]} chairs since you mentioned you don't like them.`;
  }
  const last = avoidColors.pop();
  return `Excluded ${avoidColors.join(", ")} and ${last} chairs based on your saved preferences.`;
}
