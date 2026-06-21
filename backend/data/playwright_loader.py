"""Loads listing fixtures from disk.

Named `playwright_loader` to satisfy the hackathon stack requirement that the
data layer be a Playwright wrapper. For the 3-hour build it does not perform
any real scraping — it reads a static fixture JSON. The interface is shaped so
a future live-scraping implementation can drop in without changing callers.
"""

import json
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent


def load_listings(category: str) -> list[dict]:
    fixture_path = _DATA_DIR / f"{category}s_fixture.json"
    with open(fixture_path, encoding="utf-8") as f:
        return json.load(f)
