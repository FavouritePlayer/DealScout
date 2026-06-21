import json
import os
import re

from openai import OpenAI

from backend.graph.state import DealScoutState
from backend.memory.hydra_client import HydraMemoryClient

# Both providers expose an OpenAI-compatible chat completions API, so switching
# is just a base_url/key/model swap. Nebius is the intended provider once its
# credentials are ready; Gemini is the working fallback for now.
_PROVIDERS = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": os.environ.get("GEMINI_API_KEY"),
        "model": os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash"),
    },
    "nebius": {
        "base_url": "https://api.tokenfactory.nebius.com/v1/",
        "api_key": os.environ.get("NEBIUS_API_KEY"),
        "model": os.environ.get("NEBIUS_MODEL_ID"),
    },
}
_provider = _PROVIDERS[os.environ.get("LLM_PROVIDER", "gemini")]
_llm = OpenAI(base_url=_provider["base_url"], api_key=_provider["api_key"])
_MODEL = _provider["model"]

_hydra = HydraMemoryClient()


def _parse_json_response(text: str) -> dict:
    # some models wrap JSON in ```json fences despite instructions not to
    match = re.search(r"\{.*\}", text, re.DOTALL)
    return json.loads(match.group(0) if match else text)


def retrieve_memory(state: DealScoutState) -> DealScoutState:
    memory_text = _hydra.recall(
        user_id=state["user_id"],
        query=f"{state['category']} preferences",
    )
    state["memory_context"] = memory_text
    return state


def rank_and_explain(state: DealScoutState) -> DealScoutState:
    if not state["memory_context"].strip():
        state["ranked_listings"] = state["listings"]
        state["explanation"] = "No stored preferences yet for this search."
        return state

    prompt = f"""You are filtering marketplace listings based on a user's remembered preferences.

Remembered preferences (raw, possibly unstructured): {state['memory_context']}

Listings (JSON array):
{json.dumps(state['listings'])}

Return ONLY a JSON object with this exact shape, no prose:
{{"keep_ids": [<ids of listings that do NOT violate any remembered preference>], "explanation": "<one sentence telling the user what you excluded and why, citing their own preference>"}}

If a listing's attributes clearly match something the user said they dislike or avoid, exclude its id from keep_ids."""

    response = _llm.chat.completions.create(
        model=_MODEL,
        # gemini-2.5-flash spends tokens on hidden reasoning before the visible
        # answer; 512 was getting truncated to empty content (finish_reason=length).
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    parsed = _parse_json_response(response.choices[0].message.content)

    keep_ids = set(parsed["keep_ids"])
    state["ranked_listings"] = [l for l in state["listings"] if l["id"] in keep_ids]
    state["explanation"] = parsed["explanation"]
    return state


def update_memory(state: DealScoutState) -> DealScoutState:
    if not state.get("feedback"):
        return state
    _hydra.remember(
        user_id=state["user_id"],
        text=state["feedback"],
        category=state["category"],
    )
    return state
