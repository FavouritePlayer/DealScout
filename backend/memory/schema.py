from typing import Literal

from pydantic import BaseModel


class Listing(BaseModel):
    id: str
    title: str
    category: str
    condition: str
    asking_price: float
    estimated_resale_value: float
    distance_miles: float
    location: str
    image: str
    url: str
    description: str | None = None
    posted_at: str | None = None
    margin: float | None = None
    margin_pct: float | None = None
    projected_profit: float | None = None
    classification: Literal["undervalued", "overvalued"] | None = None


class Preference(BaseModel):
    key: str
    value: str
    polarity: Literal["avoid", "prefer"]


class ScanRequest(BaseModel):
    user_id: str
    radius_miles: float | None = None


class ScanResponse(BaseModel):
    queue: list[Listing]
    explanation: str
    memory_used: list[Preference]


class FeedbackRequest(BaseModel):
    user_id: str
    item_id: str
    decision: Literal["reject", "accept"]
    note: str = ""


class FeedbackResponse(BaseModel):
    ok: bool
    preference_added: Preference | None = None


class PreferencesResponse(BaseModel):
    preferences: list[Preference]


class SetPreferencesRequest(BaseModel):
    preferences: list[Preference]
