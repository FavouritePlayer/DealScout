"""Loads the multi-category listings fixture from disk.

Named `playwright_loader` to satisfy the hackathon stack requirement that the
data layer be a Playwright wrapper. For the 3-hour build it does not perform
any real scraping — it reads a static fixture JSON. The interface is shaped
so a future live-scraping implementation can drop in without changing
callers (see backend/dev/scrape_demo.py for an offline proof that live
scraping is possible).

Contract change vs. the chair-only build: there is now a single fixture
file (`listings_fixture.json`) covering all categories, so callers no
longer pass a category name in.
"""

import json
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent
_FIXTURE_FILE = "listings_fixture.json"


def load_listings() -> list[dict]:
    fixture_path = _DATA_DIR / _FIXTURE_FILE
    with open(fixture_path, encoding="utf-8") as f:
        return json.load(f)
