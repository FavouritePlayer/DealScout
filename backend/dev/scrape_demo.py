"""One-off live scraping demo against Craigslist — NOT part of the submission.

The documented DealScout architecture deliberately uses a static fixture
instead of live scraping (see README: "Why no live Playwright scraping").
This script exists only to show a real browser actually scraping a real
marketplace on request; it is not wired into the LangGraph/API pipeline
and Person B's fixture-based plan is unaffected by it.

Run from repo root: backend/.venv/bin/python3 -m backend.dev.scrape_demo
"""
from playwright.sync_api import sync_playwright

SEARCH_URL = "https://sfbay.craigslist.org/search/sss?query=chair"


def scrape_chairs() -> list[dict]:
    listings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=200)
        page = browser.new_page()
        print(f"Opening {SEARCH_URL} ...")
        page.goto(SEARCH_URL, wait_until="domcontentloaded")
        page.wait_for_selector("li.cl-static-search-result", state="attached", timeout=15000)

        cards = page.query_selector_all("li.cl-static-search-result")
        print(f"Found {len(cards)} raw results on the page, extracting...")

        for card in cards[:15]:
            title_el = card.query_selector(".title")
            price_el = card.query_selector(".price")
            link_el = card.query_selector("a")
            if not title_el or not link_el:
                continue
            listings.append({
                "title": title_el.inner_text().strip(),
                "price": price_el.inner_text().strip() if price_el else "n/a",
                "url": link_el.get_attribute("href"),
            })

        browser.close()
    return listings


def main() -> None:
    listings = scrape_chairs()
    print(f"\n=== Scraped {len(listings)} live Craigslist chair listings ===")
    for listing in listings:
        print(f"  - {listing['title']} — {listing['price']}\n    {listing['url']}")


if __name__ == "__main__":
    main()
