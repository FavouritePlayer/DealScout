"""Terminal demo of the DealScout memory loop — no frontend required.

Drives the real FastAPI app in-process (same routes, same HydraDB/LangGraph
code the frontend will hit) via TestClient, so this exercises the actual
demo path end to end.

Run from repo root: backend/.venv/bin/python3 -m backend.dev.demo_cli
"""
import time
import uuid

from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app)
USER_ID = f"demo-{uuid.uuid4().hex[:8]}"


def _print_listings(label: str, listings: list[dict]) -> None:
    print(f"\n{label}")
    for listing in listings:
        print(f"  - {listing['title']} ({listing['color']}) ${listing['price']}")


def _search(query: str) -> dict:
    resp = client.post("/api/search", json={"user_id": USER_ID, "query": query})
    resp.raise_for_status()
    return resp.json()


def _feedback(note: str) -> dict:
    resp = client.post("/api/feedback", json={"user_id": USER_ID, "category": "chair", "note": note})
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    print(f"=== DealScout terminal demo (user_id={USER_ID}) ===")

    print("\n[1] Searching for chairs (no preferences stored yet)...")
    result = _search("Find me a chair")
    _print_listings("Results:", result["results"])
    print(f"Explanation: {result['explanation']}")

    print('\n[2] Telling the agent: "I don\'t like blue chairs"')
    print("    writing to HydraDB and waiting for it to become queryable (~12-17s)...")
    start = time.monotonic()
    fb = _feedback("I don't like blue chairs")
    print(f"    done in {time.monotonic() - start:.1f}s — stored: {fb['memory_text']!r}")

    print("\n[3] Searching again, same query, no preference re-stated...")
    result = _search("Find me a chair")
    _print_listings("Results:", result["results"])
    print(f"Explanation: {result['explanation']}")

    blue_still_present = any(listing["color"] == "blue" for listing in result["results"])
    verdict = "FAIL: blue chair still present" if blue_still_present else "PASS: blue chairs excluded"
    print(f"\n=== {verdict} ===")


if __name__ == "__main__":
    main()
