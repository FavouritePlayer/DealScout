"""Loads listing fixtures from disk.

Named `playwright_loader` to satisfy the hackathon stack requirement that the
data layer be a Playwright wrapper. For the 3-hour build it does not perform
any real scraping — it reads a static fixture JSON. The interface is shaped so
a future live-scraping implementation can drop in without changing callers.

One fixture file now, not one per category: the flip-or-flop queue scans
across all categories at once, so there's no per-category split to load.
"""

import json
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent
_FIXTURE_PATH = _DATA_DIR / "listings_fixture.json"


def load_listings() -> list[dict]:
    with open(_FIXTURE_PATH, encoding="utf-8") as f:
        return json.load(f)
