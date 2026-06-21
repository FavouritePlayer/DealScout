"""One-off live scraping demo against Craigslist — NOT part of the submission.

The documented DealScout architecture deliberately uses a static fixture
instead of live scraping (see README: "Why no live Playwright scraping").
This script exists only to show a real browser actually navigating and
scraping a real marketplace on request: it lands on the Craigslist homepage,
types into the real search box, clicks search, scrolls through results, and
reads listing attributes out of the live DOM — not a hardcoded search URL.

It is not wired into the LangGraph/API pipeline; Person B's fixture-based
plan is unaffected by it.

Run from repo root: backend/.venv/bin/python3 -m backend.dev.scrape_demo
"""
from playwright.sync_api import sync_playwright

HOME_URL = "https://sfbay.craigslist.org/"
SEARCH_TERM = "chair"


def scrape_chairs() -> list[dict]:
    listings = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        page = browser.new_page()

        print(f"Opening {HOME_URL} ...")
        page.goto(HOME_URL, wait_until="domcontentloaded")

        print(f'Clicking the search box and typing "{SEARCH_TERM}" ...')
        search_box = page.locator('input[placeholder="search craigslist"]')
        search_box.click()
        search_box.fill(SEARCH_TERM)
        page.wait_for_timeout(400)

        print("Pressing Enter to submit the search ...")
        page.keyboard.press("Enter")
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_selector("li.cl-static-search-result", state="attached", timeout=15000)
        print(f"Landed on: {page.url}")

        cards = page.query_selector_all("li.cl-static-search-result")
        print(f"Found {len(cards)} raw results on the page.")

        print("Scrolling through results ...")
        for _ in range(4):
            page.mouse.wheel(0, 800)
            page.wait_for_timeout(400)

        print("Reading title/price/url attributes off the live DOM ...")
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

        page.wait_for_timeout(1000)
        browser.close()
    return listings


def main() -> None:
    listings = scrape_chairs()
    print(f"\n=== Scraped {len(listings)} live Craigslist chair listings ===")
    for listing in listings:
        print(f"  - {listing['title']} — {listing['price']}\n    {listing['url']}")


if __name__ == "__main__":
    main()
