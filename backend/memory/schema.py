from typing import Literal

from pydantic import BaseModel


class Listing(BaseModel):
    id: str
    title: str
    price: float
    category: str
    color: str
    image: str
    url: str
    description: str | None = None
    location: str | None = None
    posted_at: str | None = None
    attributes: dict | None = None


class Preference(BaseModel):
    key: str
    value: str
    polarity: Literal["avoid", "prefer"]


class SearchRequest(BaseModel):
    user_id: str
    query: str


class SearchResponse(BaseModel):
    results: list[Listing]
    explanation: str
    memory_used: list[Preference]


class FeedbackRequest(BaseModel):
    user_id: str
    category: str
    note: str


class FeedbackResponse(BaseModel):
    ok: bool
    preference_added: Preference | None


class PreferencesResponse(BaseModel):
    preferences: list[Preference]
