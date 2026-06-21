from typing import TypedDict


class DealScoutState(TypedDict):
    user_id: str
    category: str
    raw_query: str
    memory_context: str          # raw text recalled from HydraDB, empty if none
    listings: list[dict]
    ranked_listings: list[dict]
    explanation: str
    feedback: str | None
