"""Sanity-check helper for the multi-category listings fixture.

Run from the backend/ directory:
    python scripts/peek.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


THRESHOLD = 0.25


def main() -> None:
    listings = load_listings()

    print(f"Loaded {len(listings)} listings")
    print()

    cats = Counter(l["category"] for l in listings)
    print("Category distribution:")
    for cat, count in cats.most_common():
        print(f"  {cat:<16} {count}")
    print()

    conds = Counter(l["condition"] for l in listings)
    print("Condition distribution:")
    for cond, count in conds.most_common():
        print(f"  {cond:<14} {count}")
    print()

    undervalued = []
    overvalued = []
    for l in listings:
        margin = l["estimated_resale_value"] - l["asking_price"]
        margin_pct = margin / l["asking_price"]
        row = {**l, "margin": margin, "margin_pct": margin_pct}
        (undervalued if margin_pct >= THRESHOLD else overvalued).append(row)

    print(f"Classification at margin_pct >= {THRESHOLD:.0%}:")
    print(f"  undervalued    {len(undervalued)}")
    print(f"  overvalued     {len(overvalued)}")
    print()

    top_flips = sorted(undervalued, key=lambda r: r["margin"], reverse=True)[:5]
    print("Top 5 projected profits:")
    for r in top_flips:
        print(
            f"  ${r['margin']:>4}  {r['margin_pct']:>5.0%}  "
            f"{r['category']:<14} {r['title']}"
        )
    print()

    print("Sample listing (full shape):")
    print(json.dumps(listings[0], indent=2))


if __name__ == "__main__":
    main()
