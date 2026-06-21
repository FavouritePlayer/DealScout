import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


REQUIRED_FIELDS = {"id", "title", "price", "category", "color", "image", "url"}


def test_load_chair_listings_returns_non_empty_list_with_required_fields():
    listings = load_listings("chair")

    assert isinstance(listings, list)
    assert len(listings) > 0

    for listing in listings:
        missing = REQUIRED_FIELDS - listing.keys()
        assert not missing, f"listing {listing.get('id')} missing fields: {missing}"
        assert listing["category"] == "chair"
        assert isinstance(listing["price"], (int, float))
        assert isinstance(listing["color"], str) and listing["color"]
