"""Terminal demo of the DealScout memory loop — no frontend required.

Drives the real FastAPI app in-process (same routes, same HydraDB/LangGraph
code the frontend will hit) via TestClient, so this exercises the actual
demo path end to end: scan for flip candidates -> reject one with a reason
-> rescan -> confirm the whole category is gone from the queue.

Run from repo root: backend/.venv/bin/python3 -m backend.dev.demo_cli
"""
import time
import uuid

from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app)
USER_ID = f"demo-{uuid.uuid4().hex[:8]}"


def _print_queue(label: str, queue: list[dict]) -> None:
    print(f"\n{label}")
    for item in queue:
        print(
            f"  - {item['title']} ({item['category']}, {item['condition']}) "
            f"asking ${item['asking_price']} -> resale ${item['estimated_resale_value']} "
            f"| projected profit ${item['projected_profit']}"
        )


def _scan() -> dict:
    resp = client.post("/api/scan", json={"user_id": USER_ID})
    resp.raise_for_status()
    return resp.json()


def _feedback(item_id: str, note: str) -> dict:
    resp = client.post(
        "/api/feedback",
        json={"user_id": USER_ID, "item_id": item_id, "decision": "reject", "note": note},
    )
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    print(f"=== DealScout terminal demo (user_id={USER_ID}) ===")

    print("\n[1] Scanning for flip candidates (no preferences stored yet)...")
    result = _scan()
    _print_queue("Queue:", result["queue"])
    print(f"Explanation: {result['explanation']}")

    furniture_item = next(item for item in result["queue"] if item["category"] == "furniture")
    note = "I don't deal with furniture, it's too much hassle to move."
    print(f'\n[2] Rejecting "{furniture_item["title"]}" with reason: "{note}"')
    print("    writing to HydraDB and waiting for it to become queryable (~12-17s)...")
    start = time.monotonic()
    fb = _feedback(furniture_item["id"], note)
    print(f"    done in {time.monotonic() - start:.1f}s — preference_added: {fb['preference_added']!r}")

    print("\n[3] Rescanning, no preference re-stated...")
    result = _scan()
    _print_queue("Queue:", result["queue"])
    print(f"Explanation: {result['explanation']}")

    furniture_still_present = any(item["category"] == "furniture" for item in result["queue"])
    verdict = "FAIL: furniture still present" if furniture_still_present else "PASS: furniture excluded"
    print(f"\n=== {verdict} ===")


if __name__ == "__main__":
    main()
