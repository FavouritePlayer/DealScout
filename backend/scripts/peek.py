"""Sanity-check helper for the fixture loader.

Run from the backend/ directory:
    python scripts/peek.py            # peeks at the chair fixture
    python scripts/peek.py desk       # peeks at a different category (if added)
"""

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


def main(category: str = "chair") -> None:
    listings = load_listings(category)

    print(f"Loaded {len(listings)} {category} listings")
    print()

    color_counts = Counter(listing["color"] for listing in listings)
    print("Color distribution:")
    for color, count in color_counts.most_common():
        print(f"  {color:<8} {count}")
    print()

    print("First 2 listings:")
    print(json.dumps(listings[:2], indent=2))


if __name__ == "__main__":
    category = sys.argv[1] if len(sys.argv) > 1 else "chair"
    main(category)
