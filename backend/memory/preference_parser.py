"""Converts HydraDB's raw recalled memory text into the structured
{key, value, polarity} shape the frontend's API contract expects.

HydraDB's query() returns free text (chunk_content), not clean fields, so
this is a thin heuristic adapter at the API boundary — scoped to exactly
what the chair-color demo needs, matching frontend/lib/mockStore.ts's
parsePreferenceFromNote so both sides agree on the same shape.
"""
import re

_COLORS = ["blue", "black", "green", "red", "brown", "grey", "gray", "white", "beige"]
_AVOID_PATTERN = re.compile(r"(don'?t|do not|hate|dislike|avoid|no\s+more|not\s+a\s+fan)")


def parse_preferences(text: str) -> list[dict]:
    if not text:
        return []
    lowered = text.lower()
    seen_colors: set[str] = set()
    preferences = []
    for color in _COLORS:
        idx = lowered.find(color)
        if idx == -1 or color in seen_colors:
            continue
        window = lowered[max(0, idx - 40):idx + len(color)]
        if not _AVOID_PATTERN.search(window):
            continue
        normalized = "grey" if color == "gray" else color
        seen_colors.add(color)
        preferences.append({"key": "color", "value": normalized, "polarity": "avoid"})
    return preferences
