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

1. **`retrieve_memory`** — query HydraDB (`client.query(type="memory", sub_tenant_id=user_id, query="chair color preferences")`) for anything relevant to this category.
2. **`rank_and_explain`** — load the static listing fixture, hard-filter out anything matching an `avoid` preference (e.g. `color = blue`), then have the LLM produce a one-line `explanation` string that names the excluded attribute and ties it back to the user's own words.
3. **`update_memory`** — on feedback, ingest the raw feedback text as a memory via `client.context.ingest(type="memory", ...)`, then **poll `client.context.status()` until `indexing_status == "completed"`** before returning — see the latency note below.

State:

```python
class DealScoutState(TypedDict):
    user_id: str
    category: str
    raw_query: str
    memory_context: str          # raw text recalled from HydraDB, empty if none
    listings: list[dict]
    ranked_listings: list[dict]
    explanation: str
    feedback: str | None
```

In practice this runs as two separate compiled graphs, not one: `search_graph` (`retrieve_memory → rank_and_explain`) and `feedback_graph` (`update_memory` only) — `update_memory` only ever runs on a feedback submission, so there's no reason to route a single graph through it on every search.

---

## HydraDB Data Model

HydraDB v2 is **not** a generic document store — it's a memory/knowledge graph with a `tenant_id` / `sub_tenant_id` model. Map it onto our use case as:

- `tenant_id = "dealscout"` (one tenant for the whole app)
- `sub_tenant_id = user_id` (each user's memories are scoped/partitioned here)
- One memory per stated preference, written as natural-language text, **not** a structured row:

```python
client.context.ingest(
    type="memory",
    tenant_id="dealscout",
    sub_tenant_id=user_id,
    upsert=True,
    memories=json.dumps([{
        "text": "User does not like blue chairs.",
        "infer": True,          # let HydraDB extract the structured preference
        "user_name": user_id,
        "metadata": {"category": "chair"}   # nested object, NOT a JSON string — the API rejects a stringified metadata field
    }])
)
```

Also note: `tenant_id` must exist and be `ready_for_ingestion` *before* the first ingest/query call (`client.tenants.create()` then poll `client.tenants.status()`) — calling `ingest`/`query` against a tenant that doesn't exist yet returns a 404. This was a one-time ~0.4s setup, not a per-request cost.

Retrieval is a **natural-language query**, not an exact-match filter, and requires `tenant_id` explicitly (it's easy to miss since `sub_tenant_id` feels like the scoping field):

```python
client.query(type="memory", tenant_id="dealscout", sub_tenant_id=user_id, query="chair color preferences")
```

The response includes both plain `chunk_content` text and extracted graph relations (e.g. a `DISLIKES` edge from the user entity to a `"blue chairs"` concept) — there's no guaranteed structured `{key, value, polarity}` row, so the `rank_and_explain` node has the LLM reason over the retrieved text directly rather than doing a literal field comparison.

**⚠️ Confirmed latency risk (measured against the live API, not estimated):** `context.ingest()` is asynchronous — written memories are not queryable until `indexing_status` (polled via `context.status(tenant_id=..., sub_tenant_id=..., ids=[...])`, using the job ids from the ingest response) reaches `completed`. **Measured round trip: consistently 12–17 seconds**, regardless of whether it's the user's first or a later memory for that user — this is real per-ingestion processing time, not a one-time setup cost, and one early test exceeded a 15s timeout outright. The backend's poll timeout is set to 30s to avoid false failures.

This is slow enough that it **will** be visible in a live demo. Mitigation, in order of preference:
1. Script a deliberate pause after stating a preference — e.g. the presenter talks through what's happening for ~15s while the loading state shows ("remembering...") — before submitting the next search.
2. If that breaks demo flow, pre-ingest the "I don't like blue chairs" memory before going on stage, narrate the write step as if it's happening, and only do the recall/re-search part live.
3. Do not attempt to demo feedback→search as an instant back-to-back action without one of the above — it will stall on stage.

---

## API Contract

This is the actual shape implemented in `backend/app.py` — HydraDB returns raw recalled text, not structured `{key, value, polarity}` rows, so don't build the frontend expecting that shape:

```
POST /api/search
Request:  { "user_id": string, "query": string }
Response: {
  "results": [
    { "id": string, "title": string, "price": number, "color": string,
      "image": string, "url": string }
  ],
  "explanation": string,   // e.g. "Excluded blue chairs based on your preference."
  "memory_used": string    // raw recalled memory text, "" if none stored yet
}

POST /api/feedback
Request:  { "user_id": string, "category": string, "note": string }
            // note = raw text, e.g. "I don't like blue chairs"
Response: { "ok": true, "memory_text": string }   // echoes back what was stored
            // backend ingests into HydraDB AND polls indexing to completion
            // before responding — takes ~12-17s, see latency note above.
            // frontend just awaits this call, no separate polling

GET /api/preferences/:user_id
Response: { "preferences": string }   // raw recalled text, drives the live Memory Panel
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

## Note to Person B (from Person A)

A few things worth knowing before you start on the frontend/fixture side:

- **Don't wait on the backend.** Build the UI against the API contract above using a local mock (a couple of Next.js API routes returning fake data is enough) so you're never blocked on me finishing HydraDB/LangGraph integration. Swap the mock for the real `/api/*` calls at the integration checkpoint.
- **The `/api/feedback` call is NOT fast — budget for ~12–17 seconds.** This is measured against the live HydraDB API, not a guess: the backend has to poll until indexing completes before it can respond, and that consistently takes 12–17s regardless of how many memories the user already has. Build the feedback box around this from the start — a real "remembering..." loading state, not a spinner that's only there "just in case." The demo script needs to account for this pause explicitly (see README's HydraDB Data Model section for the planned mitigation), so don't treat it as something to optimize away.
- **Color is the whole demo** — make sure every fixture listing has a clear `color` field and that it's visually obvious on the card (not just in text), since the entire judging moment is "blue chairs visibly disappear."
- **The Memory Panel matters more than visual polish.** If you're short on time, a plain list of `GET /api/preferences/:user_id` results that updates after feedback is submitted is worth more than a nicer-looking results grid.
- **Playwright is just a fixture loader here** — a thin wrapper that reads `chairs_fixture.json` and returns it is enough to satisfy the stack requirement. Don't spend any time on a real scraper.

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
| HydraDB's async indexing is too slow to demo live (write→query round trip) | **Confirmed, not hypothetical: measured at 12–17s consistently.** Script a deliberate ~15s pause after stating a preference (presenter narrates while the loading state shows), or pre-ingest before going on stage and only demo the recall live (see HydraDB Data Model section) |
| HydraDB query returns unstructured text instead of a clean field to filter on | Have the LLM reason over the retrieved memory text directly when deciding to exclude a listing, rather than expecting an exact structured field match |
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
