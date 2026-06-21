"""Sanity-check helper for the fixture loader.

Run from the backend/ directory:
    python scripts/peek.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


def main() -> None:
    listings = load_listings()

    print(f"Loaded {len(listings)} listings")
    print()

    category_counts = Counter(listing["category"] for listing in listings)
    print("Category distribution:")
    for category, count in category_counts.most_common():
        print(f"  {category:<16} {count}")
    print()

    print("First 2 listings:")
    print(json.dumps(listings[:2], indent=2))


if __name__ == "__main__":
    main()
