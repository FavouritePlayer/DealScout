from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.data.playwright_loader import load_listings
from backend.graph.graph import feedback_graph, scan_graph
from backend.memory.hydra_client import HydraMemoryClient
from backend.memory.preference_parser import parse_preferences
from backend.memory.schema import (
    FeedbackRequest,
    FeedbackResponse,
    PreferencesResponse,
    ScanRequest,
    ScanResponse,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_hydra = HydraMemoryClient()


@app.post("/api/scan", response_model=ScanResponse)
def scan(req: ScanRequest):
    result = scan_graph.invoke({
        "user_id": req.user_id,
        "radius_miles": req.radius_miles,
        "candidates": load_listings(),
    })
    return {
        "queue": result["queue"],
        "explanation": result["explanation"],
        "memory_used": parse_preferences(result["memory_context"]),
    }


@app.post("/api/feedback", response_model=FeedbackResponse)
def feedback(req: FeedbackRequest):
    if req.decision == "reject" and req.note:
        feedback_graph.invoke({"user_id": req.user_id, "feedback": req.note})
    added = parse_preferences(req.note) if req.decision == "reject" else []
    return {"ok": True, "preference_added": added[0] if added else None}


@app.get("/api/preferences/{user_id}", response_model=PreferencesResponse)
def preferences(user_id: str):
    text = _hydra.recall(user_id=user_id, query="flip category and condition avoid-rules")
    return {"preferences": parse_preferences(text)}


@app.delete("/api/preferences/{user_id}")
def clear_preferences(user_id: str):
    _hydra.forget_all(user_id)
    return {"ok": True}
