import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.playwright_loader import load_listings


REQUIRED_FIELDS = {
    "id",
    "title",
    "category",
    "condition",
    "asking_price",
    "estimated_resale_value",
    "distance_miles",
    "location",
    "image",
    "url",
}

VALID_CATEGORIES = {
    "furniture",
    "electronics",
    "tools",
    "collectibles",
    "sporting_goods",
    "appliances",
    "instruments",
    "clothing",
    "toys",
    "books",
    "other",
}

VALID_CONDITIONS = {"like new", "good", "fair", "needs repair"}


def test_fixture_has_required_fields_and_valid_vocab():
    listings = load_listings()

    assert isinstance(listings, list)
    assert len(listings) >= 20, f"expected >=20 listings, got {len(listings)}"

    for listing in listings:
        missing = REQUIRED_FIELDS - listing.keys()
        assert not missing, f"listing {listing.get('id')} missing: {missing}"

        assert listing["category"] in VALID_CATEGORIES, (
            f"{listing['id']} bad category: {listing['category']}"
        )
        assert listing["condition"] in VALID_CONDITIONS, (
            f"{listing['id']} bad condition: {listing['condition']}"
        )
        assert isinstance(listing["asking_price"], (int, float))
        assert isinstance(listing["estimated_resale_value"], (int, float))
        assert isinstance(listing["distance_miles"], (int, float))


def test_fixture_spans_at_least_five_categories():
    listings = load_listings()
    categories = {l["category"] for l in listings}
    assert len(categories) >= 5, f"need >=5 categories, got {categories}"


def test_fixture_has_both_undervalued_and_overvalued_at_25_pct_threshold():
    listings = load_listings()
    undervalued = 0
    overvalued = 0
    for l in listings:
        margin_pct = (l["estimated_resale_value"] - l["asking_price"]) / l["asking_price"]
        if margin_pct >= 0.25:
            undervalued += 1
        else:
            overvalued += 1
    assert undervalued >= 10, f"need a healthy undervalued queue, got {undervalued}"
    assert overvalued >= 3, (
        f"need clear bad-flip examples so the classifier has negatives, got {overvalued}"
    )


def test_furniture_rejection_would_remove_multiple_undervalued_cards():
    """The demo's emotional payoff: rejecting 'furniture' must visibly remove
    several cards from the queue, not just one."""
    listings = load_listings()
    furniture_undervalued = [
        l
        for l in listings
        if l["category"] == "furniture"
        and (l["estimated_resale_value"] - l["asking_price"]) / l["asking_price"] >= 0.25
    ]
    assert len(furniture_undervalued) >= 3, (
        "rejecting furniture should remove at least 3 cards for visual impact, "
        f"got {len(furniture_undervalued)}"
    )
