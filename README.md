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
    raw_query: str
    memory_context: list[dict]   # parsed from HydraDB query results
    listings: list[dict]
    explanation: str
    feedback: str | None
```

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
        "metadata": "{\"category\": \"chair\"}"
    }])
)
```

Retrieval is a **natural-language query**, not an exact-match filter:

```python
client.query(type="memory", sub_tenant_id=user_id, query="chair color preferences")
```

The `rank_and_explain` node parses whatever HydraDB returns (free text / extracted facts) to decide what to exclude — there's no guaranteed structured `{key, value, polarity}` row coming back, so build the filter logic to be tolerant of that (e.g. ask the LLM "given this retrieved memory text and this listing's attributes, should it be excluded?" rather than doing a literal field comparison).

**⚠️ Critical latency risk:** `context.ingest()` is asynchronous — written memories are not queryable until `indexing_status` reaches `completed` (checked via polling `context.status()`). If indexing takes more than a couple seconds, the live "say it, search again, it's gone" demo will stall or show a stale result. Mitigation:
- Time an actual ingest→query round trip in the **first 15 minutes** of the build — this number determines whether the demo can be fully live or needs a deliberate pause ("give it a second to remember...") built into the script.
- Have `/api/feedback` do the ingest **and** the poll-to-completion server-side, so the frontend just shows a loading state and gets back a response only once the memory is actually queryable. Don't let the frontend poll HydraDB directly.
- If indexing latency turns out too slow to demo live, fall back to pre-ingesting the "I don't like blue chairs" memory before going on stage and just narrating the write step, then doing the query live.

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
            // backend ingests into HydraDB AND polls indexing to completion
            // before responding — frontend just awaits this call, no separate polling

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

## Note to Person B (from Person A)

A few things worth knowing before you start on the frontend/fixture side:

- **Don't wait on the backend.** Build the UI against the API contract above using a local mock (a couple of Next.js API routes returning fake data is enough) so you're never blocked on me finishing HydraDB/LangGraph integration. Swap the mock for the real `/api/*` calls at the integration checkpoint.
- **The `/api/feedback` call may not be instant.** HydraDB's write path is asynchronous — the backend has to poll until indexing completes before it can respond, so this request could take a few seconds. Give the feedback box a visible "remembering..." / loading state rather than assuming an immediate response. If it ends up being more than a couple seconds, flag it to me — we may need to script a deliberate pause into the demo.
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
| HydraDB's async indexing is too slow to demo live (write→query round trip) | Measure this in the first 15 minutes; if slow, script a deliberate pause or pre-ingest before going on stage (see HydraDB Data Model section) |
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
