# DealScout

**A memory-powered marketplace agent built for the Agents You Love Hackathon.**

> Theme: *Context over Amnesia — Building Agents that Remember and Evolve*

DealScout finds listings on a marketplace and gets better at finding *your* kind of listing every time you use it. Preferences aren't set in a settings menu — they're stated in plain language, extracted automatically, and stored in **HydraDB**, then pulled back out on every future search to change what gets shown.

The judging bar: a chatbot with a vector store bolted on doesn't count. The memory has to be load-bearing — remove it and the product breaks.

**Build window: 3 hours.** Everything in this doc is scoped to that, not the original 8-hour plan.

---

## The Demo (this is the whole product)

Category for the demo: **chairs**. Listings vary by color (blue, green, black, red, etc.) — color is the attribute the demo hangs on because it's instantly visible to judges with zero explanation needed.

| Step | What happens |
|---|---|
| 1. Search | User: *"Find me a chair."* Agent reports back a mixed set of listings — blue, green, black, red chairs all present. |
| 2. Feedback | User: *"I don't like blue chairs."* Agent confirms and writes this to HydraDB. |
| 3. Switch session | User clicks "New Session" (or just asks again later) — no preference is re-stated. |
| 4. Search again | User: *"Find me a chair."* Agent returns **only green/black/etc. chairs — blue is omitted entirely** — and says so: *"I've excluded blue chairs since you mentioned you don't like them."* |

That's the entire demo. The proof points for judges:
- The agent **remembers** ("I don't like blue chairs" was never repeated).
- It **retrieves autonomously** (nothing in the second query mentions color).
- It **changes behavior** (blue chairs are gone from the results, not just down-ranked).

A live **Memory Panel** in the UI showing the stored preference (`avoid: color = blue`) updating in real time is the cheapest, highest-impact proof of all of this — build it even before polishing anything else.

---

## Architecture (simplified for 3 hours)

```
User Query
    │
    ▼
LangGraph Agent (3 nodes)
    │
    ├─ retrieve_memory ──▶ HydraDB: preferences for "chair"
    │
    ▼
Static Listing Fixture (no live scraping — see below)
    │
    ▼
rank_and_explain ──▶ filters out anything matching an "avoid" preference,
    │                 produces explanation string citing the preference
    ▼
Results ──▶ Frontend (Next.js): results grid + Memory Panel
    │
    ▼
Feedback ("I don't like blue chairs") 
    │
    ▼
update_memory ──▶ extract structured preference ──▶ write to HydraDB
```

**Why no live Playwright scraping:** scraping a real marketplace is the one part of this stack where debugging is unpredictable (anti-bot, DOM changes) and AI-assisted codegen doesn't help — it's trial and error against a system you don't control. None of the judging criteria require live data. A thin Playwright wrapper that "loads" a local fixture file satisfies the stack requirement without the risk; do not attempt a live scrape against a real site in this window.

---

## LangGraph Workflow

Three nodes, no more:

1. **`retrieve_memory`** — query HydraDB for all `preferences` rows where `category = "chair"`.
2. **`rank_and_explain`** — load the static listing fixture, hard-filter out anything matching an `avoid` preference (e.g. `color = blue`), then have the LLM produce a one-line `explanation` string that names the excluded attribute and ties it back to the user's own words.
3. **`update_memory`** — on feedback, LLM extracts a structured preference (`{category: "chair", key: "color", value: "blue", polarity: "avoid"}`) and writes it to HydraDB.

State:

```python
class DealScoutState(TypedDict):
    user_id: str
    raw_query: str
    memory_context: list[dict]   # preferences for this category
    listings: list[dict]
    explanation: str
    feedback: str | None
```

---

## HydraDB Data Model

**One collection only: `preferences`.**

```json
{
  "user_id": "u_123",
  "category": "chair",
  "key": "color",
  "value": "blue",
  "polarity": "avoid",
  "source": "explicit_feedback",
  "updated_at": "2026-06-21T10:00:00Z"
}
```

Retrieval is a flat query: all preferences where `user_id` + `category` match. No similarity search, no episodic log, no rejection history — those were cut for time. The "I've excluded blue chairs because you said so" explanation is generated directly from this one row at ranking time, not from a separate log.

---

## API Contract

```
POST /api/search
Request:  { "user_id": string, "query": string }
Response: {
  "results": [
    { "id": string, "title": string, "price": number, "color": string,
      "image": string, "url": string }
  ],
  "explanation": string,      // e.g. "Excluded blue chairs based on your preference."
  "memory_used": [ { "key": "color", "value": "blue", "polarity": "avoid" } ]
}

POST /api/feedback
Request:  { "user_id": string, "category": string, "note": string }
            // note = raw text, e.g. "I don't like blue chairs"
Response: { "ok": true, "preference_added": { "key": "color", "value": "blue", "polarity": "avoid" } }

GET /api/preferences/:user_id
Response: { "preferences": [ ... ] }   // drives the live Memory Panel
```

---

## Frontend (Next.js, single page)

- Search bar + results grid (each card shows title, price, color, image).
- Free-text feedback box under the results → `POST /api/feedback`.
- **Memory Panel** (always visible, sidebar) — live `GET /api/preferences/:user_id`, refreshed after every feedback submission. This is the visual proof of memory for judges.
- "New Session" button that just clears local UI state and re-runs the same search — proves the preference came from HydraDB, not from chat context still sitting in memory client-side.

No multi-page flow, no auth, no account system.

---

## P0 / P1 / P2

**P0 — the only thing that has to exist; this is the 3-hour scope:**
- Static fixture of ~15–20 chair listings with varied colors
- `retrieve_memory → rank_and_explain → update_memory` graph wired end to end
- Search → results shown, mixed colors
- Feedback text → preference extracted and written to HydraDB
- Repeat search → matching color fully excluded, not just down-ranked
- Explanation string that names the excluded attribute
- Memory Panel showing the live preference

**P1 — only after P0 works end to end, in whatever time is left:**
- A second preference type beyond color (e.g. price ceiling) to show memory generalizes
- "New Session" button polish + clean re-run flow for staging the demo
- Explanation wording pass (make it sound natural, cite the user's own phrase back)

**P2 — only attempt if P0 and P1 are both done with real time to spare; do not start these inside the 3-hour window unless explicitly re-scoped:**
- A second category
- Inferring a preference from repeated dislikes without an explicit statement
- Live scraping replacing the static fixture
- Multiple simultaneous preferences with conflict resolution

If you're unsure whether to spend remaining time on a P1 item or start polishing UI cosmetics, do the P1 item — judges are scoring memory behavior, not visual design.

---

## Two-Person Split (3 hours)

Same ownership split as before, just scoped down. Lock the API contract first so both people build against it independently rather than against each other's code.

### Person A — Agent & Memory
Owns: LangGraph graph, HydraDB client + schema, preference extraction, ranking/filtering, explanation generation, backend API.

### Person B — Data & Frontend
Owns: static listing fixture (write ~15–20 chair listings by hand or have an agent generate them), Next.js UI (search, results grid, feedback box, Memory Panel), thin Playwright wrapper that loads the fixture (to satisfy the stack requirement without live scraping).

### Timeline

| Time | Milestone |
|---|---|
| 0:00–0:15 | Lock API contract + `preferences` schema together |
| 0:15–1:15 | Parallel: A builds graph + HydraDB + ranking against mocked listings; B builds fixture + UI against mocked API responses |
| 1:15–1:45 | **Checkpoint**: wire real backend to real frontend |
| 1:45–2:30 | Parallel: A tunes explanation text; B builds Memory Panel + "New Session" flow |
| 2:30–2:45 | **Checkpoint**: full loop test — search, state "I don't like blue chairs," search again, confirm blue is gone |
| 2:45–3:00 | Rehearse the demo exactly as it will be shown |

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| HydraDB integration takes longer than expected | Get a trivial write/read working in the first 15 minutes before building the graph on top of it |
| Preference extraction misparses feedback (e.g. extracts "chair" instead of "blue") | Keep the feedback prompt narrow — for the demo, the user's phrasing is known in advance, so the extraction prompt can be tuned specifically against it before rehearsal |
| Filtering down-ranks instead of fully excluding | Test this explicitly — the demo's entire visual impact depends on blue chairs being **absent**, not just lower on the page |
| Running short on time | Cut P1 items first, never cut the Memory Panel — it's the single highest-leverage thing in the demo |

---

## Suggested File/Folder Structure

```
DealScout/
├── README.md
├── backend/
│   ├── app.py                      # API server (Person A)
│   ├── graph/
│   │   ├── state.py
│   │   ├── nodes.py                 # retrieve_memory, rank_and_explain, update_memory
│   │   └── graph.py
│   ├── memory/
│   │   ├── hydra_client.py
│   │   └── schema.py
│   └── data/
│       ├── chairs_fixture.json       # Person B
│       └── playwright_loader.py      # thin wrapper, loads fixture
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── MemoryPanel.tsx
│   │       ├── ListingCard.tsx
│   │       └── FeedbackBox.tsx
│   └── lib/
│       └── api.ts
└── demo/
    └── script.md                     # the exact lines to say/type during the demo
```
