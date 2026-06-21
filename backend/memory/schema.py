from pydantic import BaseModel


class Listing(BaseModel):
    id: str
    title: str
    price: float
    color: str
    image: str
    url: str


class SearchRequest(BaseModel):
    user_id: str
    query: str


class SearchResponse(BaseModel):
    results: list[Listing]
    explanation: str
    memory_used: str


class FeedbackRequest(BaseModel):
    user_id: str
    category: str
    note: str


class FeedbackResponse(BaseModel):
    ok: bool
    memory_text: str
