import json

from backend.graph.llm import complete_with_retry
from backend.graph.state import DealScoutState
from backend.memory.hydra_client import HydraMemoryClient

_hydra = HydraMemoryClient()

# Anything priced this far under its estimated resale value counts as a flip
# worth surfacing; everything else is shown as overvalued (and filtered out
# of the queue, but still classified so the split is visible/testable).
MARGIN_PCT_THRESHOLD = 0.25


def retrieve_memory(state: DealScoutState) -> DealScoutState:
    memory_text = _hydra.recall(
        user_id=state["user_id"],
        query="flip category and condition avoid-rules",
    )
    state["memory_context"] = memory_text
    return state


def classify_value(state: DealScoutState) -> DealScoutState:
    classified = []
    for item in state["candidates"]:
        asking = item["asking_price"]
        margin = round(item["estimated_resale_value"] - asking, 2)
        margin_pct = round(margin / asking, 4) if asking else 0.0
        classification = "undervalued" if margin_pct >= MARGIN_PCT_THRESHOLD else "overvalued"
        classified.append({
            **item,
            "margin": margin,
            "margin_pct": margin_pct,
            "projected_profit": margin,
            "classification": classification,
        })
    state["classified"] = classified
    return state


def filter_and_rank(state: DealScoutState) -> DealScoutState:
    undervalued = sorted(
        (item for item in state["classified"] if item["classification"] == "undervalued"),
        key=lambda item: item["projected_profit"],
        reverse=True,
    )

    if not state["memory_context"].strip():
        state["queue"] = undervalued
        state["explanation"] = "No stored preferences yet — showing every undervalued flip found."
        return state

    prompt = f"""You are filtering resale-flip candidates based on a user's remembered avoid-rules.

Remembered rules (raw, possibly unstructured): {state['memory_context']}

Candidates (JSON array, already filtered to undervalued-only):
{json.dumps(undervalued)}

Return the ids of candidates that do NOT match any remembered avoid-rule, plus a one-sentence
explanation telling the user what you excluded and why, citing their own words.

If a candidate's category, condition, or other attribute clearly matches something the user said
they want to avoid, exclude its id from keep_ids."""

    schema = {
        "type": "object",
        "properties": {
            "keep_ids": {"type": "array", "items": {"type": "string"}},
            "explanation": {"type": "string"},
        },
        "required": ["keep_ids", "explanation"],
        "additionalProperties": False,
    }
    # gemini-2.5-flash spends tokens on hidden reasoning before the visible
    # answer; 512 was getting truncated to empty content (finish_reason=length).
    response = complete_with_retry(
        [{"role": "user", "content": prompt}],
        max_tokens=2048,
        schema_name="filter_result",
        schema=schema,
    )
    parsed = json.loads(response.choices[0].message.content)

    keep_ids = set(parsed["keep_ids"])
    state["queue"] = [item for item in undervalued if item["id"] in keep_ids]
    state["explanation"] = parsed["explanation"]
    return state


def update_memory(state: DealScoutState) -> DealScoutState:
    if not state.get("feedback"):
        return state
    _hydra.remember(user_id=state["user_id"], text=state["feedback"])
    return state
