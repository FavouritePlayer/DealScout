from typing import TypedDict


class DealScoutState(TypedDict):
    user_id: str
    radius_miles: float | None
    memory_context: str          # raw text recalled from HydraDB, empty if none
    candidates: list[dict]        # raw fixture listings
    classified: list[dict]        # candidates + margin/margin_pct/projected_profit/classification
    queue: list[dict]             # undervalued, memory-filtered, sorted by projected profit
    explanation: str
    feedback: str | None          # raw rejection text, e.g. "too much hassle to move"
