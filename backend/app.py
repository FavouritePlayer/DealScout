from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.dev.mock_listings import MOCK_CHAIR_LISTINGS
from backend.graph.graph import feedback_graph, search_graph
from backend.memory.schema import FeedbackRequest, FeedbackResponse, SearchRequest, SearchResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DEMO_CATEGORY = "chair"


@app.post("/api/search", response_model=SearchResponse)
def search(req: SearchRequest):
    result = search_graph.invoke({
        "user_id": req.user_id,
        "category": DEMO_CATEGORY,
        "raw_query": req.query,
        "listings": MOCK_CHAIR_LISTINGS,
    })
    return {
        "results": result["ranked_listings"],
        "explanation": result["explanation"],
        "memory_used": result["memory_context"],
    }


@app.post("/api/feedback", response_model=FeedbackResponse)
def feedback(req: FeedbackRequest):
    feedback_graph.invoke({
        "user_id": req.user_id,
        "category": req.category,
        "feedback": req.note,
    })
    return {"ok": True, "memory_text": req.note}


@app.get("/api/preferences/{user_id}")
def preferences(user_id: str):
    from backend.memory.hydra_client import HydraMemoryClient

    client = HydraMemoryClient()
    text = client.recall(user_id=user_id, query=f"{DEMO_CATEGORY} preferences")
    return {"preferences": text}
