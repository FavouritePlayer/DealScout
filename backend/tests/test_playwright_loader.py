import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


REQUIRED_FIELDS = {
    "id", "title", "category", "condition", "asking_price",
    "estimated_resale_value", "distance_miles", "location", "image", "url",
}


def test_load_listings_returns_non_empty_multi_category_list_with_required_fields():
    listings = load_listings()

    assert isinstance(listings, list)
    assert len(listings) > 0

    categories_seen = set()
    for listing in listings:
        missing = REQUIRED_FIELDS - listing.keys()
        assert not missing, f"listing {listing.get('id')} missing fields: {missing}"
        assert isinstance(listing["asking_price"], (int, float))
        assert isinstance(listing["estimated_resale_value"], (int, float))
        categories_seen.add(listing["category"])

    assert len(categories_seen) >= 3, "fixture should span multiple categories, not just one"
