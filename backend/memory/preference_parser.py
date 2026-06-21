"""Converts HydraDB's raw recalled memory text into the structured
{key, value, polarity} shape the frontend's API contract expects.

HydraDB's query() returns free text (chunk_content), not clean fields, so
this is a thin heuristic adapter at the API boundary. Generalized beyond the
original chair/color demo to the flip-or-flop vocab: a rejection reason maps
to a `category` and/or `condition` avoid-rule, matching the fixed vocab in
the README's Listing / Fixture Data Model section.
"""
import re

_CATEGORIES = [
    "furniture", "electronics", "tools", "collectibles", "sporting goods",
    "appliances", "instruments", "clothing", "toys", "books",
]
_CONDITIONS = ["like new", "good", "fair", "needs repair"]
_AVOID_PATTERN = re.compile(
    r"(don'?t|do not|hate|dislike|avoid|no\s+more|not\s+a\s+fan|too\s+much|won'?t|can'?t)"
)


def _extract(text: str, vocab: list[str], key: str) -> list[dict]:
    lowered = text.lower()
    seen: set[str] = set()
    preferences = []
    for term in vocab:
        idx = lowered.find(term)
        if idx == -1 or term in seen:
            continue
        window = lowered[max(0, idx - 40):idx + len(term)]
        if not _AVOID_PATTERN.search(window):
            continue
        seen.add(term)
        preferences.append({"key": key, "value": term.replace(" ", "_"), "polarity": "avoid"})
    return preferences


def parse_preferences(text: str) -> list[dict]:
    if not text:
        return []
    return _extract(text, _CATEGORIES, "category") + _extract(text, _CONDITIONS, "condition")
