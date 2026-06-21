# DealScout

**A memory-powered marketplace agent built for the Agents You Love Hackathon.**

> Theme: *Context over Amnesia — Building Agents that Remember and Evolve*

DealScout finds deals on online marketplaces and gets better at finding *your* kind of deal every time you use it. Preferences aren't asked for in a settings menu — they're inferred from feedback and stored in **HydraDB**, then pulled back out on every future search to change what gets recommended.

The judging bar: a chatbot with a vector store bolted on doesn't count. The memory has to be load-bearing — remove it and the product breaks.

---

## Demo Narrative (what judges see)

| Session | User says | Agent does |
|---|---|---|
| 1 | "Find me a gaming monitor." | Generic ranked results. User reacts: *"I dislike curved monitors, budget under $250, prefer IPS."* |
| 2 | "Find me a gaming monitor." (new session) | Agent recalls preferences from HydraDB **without being told again** — curved monitors filtered/down-ranked, budget enforced, IPS boosted. |
| 3 | "Find me another one." | Agent explains itself: *"Based on your previous searches, you consistently prefer flat IPS monitors under $250 and have rejected multiple curved displays."* |

The explanation in Session 3 is the money shot — it's verbal proof the memory is driving the decision, not just stored.

---

## Architecture

```
User Query
    │
    ▼
LangGraph Agent (orchestrator)
    │
    ├──▶ HydraDB Memory Retrieval ──▶ (preferences, rejected items, past searches)
    │
    ▼
Playwright Listing Retrieval (marketplace search + scrape)
    │
    ▼
Listing Extraction / Normalization
    │
    ▼
Ranking Agent (LLM scoring, informed by retrieved memory)
    │
    ▼
Results ──▶ Frontend (React/Next.js)
    │
    ▼
Feedback Collection (thumbs up/down, "why not", explicit preference text)
    │
    ▼
HydraDB Memory Update (preference extraction + write)
```

Two halves, split cleanly at the **API contract** below so both people can build in parallel without blocking each other.

---

## LangGraph Workflow

Graph nodes:

1. **`parse_query`** — LLM extracts product category, explicit constraints (budget, brand, keywords) from the raw user message.
2. **`retrieve_memory`** — queries HydraDB for: stored preferences for this category, rejected listing patterns, past search history. Runs in parallel with search when possible.
3. **`search_marketplace`** — invokes Playwright scraper(s) with the parsed query.
4. **`extract_listings`** — normalizes raw scraped HTML/JSON into structured `Listing` objects.
5. **`rank_listings`** — Ranking Agent scores each listing using parsed query + retrieved memory.
6. **`explain`** — generates the natural-language justification (this node is what sells the "memory changes behavior" story — make it cite specific remembered facts).
7. **`await_feedback`** — terminal node; graph re-enters via a new invocation when feedback arrives.
8. **`update_memory`** — LLM extracts structured preference deltas from feedback text/actions, writes to HydraDB.

State object passed through the graph:

```python
class DealScoutState(TypedDict):
    user_id: str
    raw_query: str
    parsed_query: dict          # category, budget, keywords, constraints
    memory_context: dict        # retrieved from HydraDB
    raw_listings: list[dict]
    ranked_listings: list[dict]
    explanation: str
    feedback: dict | None
```

---

## HydraDB Data Model

Three logical collections, one per memory concern:

**`preferences`** — durable, structured facts about the user.
```json
{
  "user_id": "u_123",
  "category": "monitor",
  "key": "panel_type",
  "value": "IPS",
  "polarity": "prefer",        // prefer | avoid
  "confidence": 0.9,
  "source": "explicit_feedback",
  "updated_at": "2026-06-21T10:00:00Z"
}
```

**`rejections`** — specific listings/attributes the user rejected, kept for explanation-quality and pattern detection.
```json
{
  "user_id": "u_123",
  "category": "monitor",
  "listing_snapshot": { "title": "...", "price": 310, "attrs": {"shape": "curved"} },
  "reason": "curved monitor, over budget",
  "created_at": "..."
}
```

**`search_history`** — episodic log used to generate the "you consistently..." narrative.
```json
{
  "user_id": "u_123",
  "query": "gaming monitor",
  "result_count": 12,
  "top_pick": {...},
  "timestamp": "..."
}
```

**Retrieval strategy:** on every `retrieve_memory` call, pull all `preferences` for the matched category (small, cheap, always full-context — don't bother with similarity search for this one), plus the last 5 `rejections` and last 3 `search_history` entries for the same category. This is intentionally simple — a hackathon demo needs *reliable* recall, not clever recall.

---

## Ranking Methodology

Single LLM call per ranking pass (not per-listing, for speed): feed the model the full candidate listing set + `memory_context`, ask for a score (0–100) and one-line rationale per listing, plus an overall `explanation` string referencing specific remembered preferences. Hard-filter constraints (budget, explicit "avoid" with confidence > 0.8) before ranking to keep the candidate set small and the explanation honest.

---

## API Contract

This is the seam between the two halves of the team. Lock this early (first 20–30 minutes), then build independently against it.

```
POST /api/search
Request:  { "user_id": string, "query": string }
Response: {
  "results": [
    { "id": string, "title": string, "price": number, "url": string,
      "image": string, "attrs": object, "score": number, "rationale": string }
  ],
  "explanation": string,
  "memory_used": object   // what preferences were applied, for demo transparency
}

POST /api/feedback
Request:  { "user_id": string, "listing_id": string, "action": "like"|"dislike"|"reject",
            "note": string | null }
Response: { "ok": true, "preferences_updated": object }

GET /api/preferences/:user_id
Response: { "preferences": [...], "rejections": [...] }   // for a debug/demo panel showing memory state live
```

The `GET /api/preferences/:user_id` endpoint isn't in the user story but is the single highest-leverage thing for judges — a visible "what the agent remembers" panel that updates live is the clearest possible proof of the memory claim.

---

## Frontend Architecture (Next.js / React)

- `/` — search bar + results grid. Each result card shows the rationale string.
- Persistent **Memory Panel** (sidebar, always visible) — live view of `GET /api/preferences/:user_id`, polled/refreshed after every feedback action. This is the demo's visual proof of memory.
- Feedback affordances per card: 👍 / 👎 / "tell the agent why" free-text box → `POST /api/feedback`.
- Session switcher (mock "Session 1 / 2 / 3" buttons) to force the demo narrative on stage without needing real elapsed time or browser restarts.

---

## Playwright Strategy

- Target **one** marketplace for the MVP (pick the one with the most stable, scrape-friendly DOM — eBay or Facebook Marketplace tend to be more reliant on auth/anti-bot than e.g. a simpler listing site; evaluate at kickoff and lock the choice fast).
- Headless search → grab listing cards → extract title/price/image/url/key attrs via selectors, not full-page LLM parsing (too slow for a live demo).
- Cache scraped results per query during the hackathon (file or in-memory dict) so demo runs aren't dependent on live network/scrape flakiness on stage.
- Fallback: a static fixture file of pre-scraped listings for the exact demo queries, swapped in if live scraping breaks during rehearsal. **Build this fallback regardless** — it's cheap insurance against the single highest-risk component.

---

## P0 / P1 / P2

**P0 — must work for the demo to exist:**
- Search → scrape → extract → rank → display, end to end, one marketplace
- HydraDB write on explicit feedback
- HydraDB read on next search, visibly changing results
- One clean explanation string citing remembered preference(s)

**P1 — strongly improves the story:**
- Live Memory Panel in UI
- Rejection-pattern detection (not just explicit preferences — e.g. inferring "avoid curved" from repeated dislikes)
- Session-switcher staging for a controlled live demo
- Static fixture fallback for scraping

**P2 — only if P0/P1 are done with time to spare:**
- Multiple marketplaces
- Confidence decay / preference conflict resolution
- Nicer UI polish, animations, multi-category memory

**Explicitly out of scope:** negotiation, messaging sellers, auth, production infra, account management.

---

## Two-Person Split for Parallel AI-Agent-Driven Work

Goal: both people run their own AI coding agent against an independent vertical slice for as much of the 8 hours as possible, meeting only at defined integration checkpoints. The API contract above is what makes this possible — build to the contract, not to each other's code.

### Person A — Agent & Memory Engineer
**Owns:** LangGraph workflow, HydraDB schema + client, Ranking Agent, backend API server.

- Scaffold backend (FastAPI/Express, your call), implement `/api/search` and `/api/feedback` against **mocked** listing data first so you're never blocked on Playwright.
- Build the LangGraph graph (`parse_query` → `retrieve_memory` → rank → `explain` → `update_memory`).
- Implement HydraDB read/write for `preferences` / `rejections` / `search_history`.
- Implement preference-extraction-from-feedback (the LLM call that turns "I dislike curved monitors" into a structured preference row).
- Own the `explanation` generation — this is the highest-stakes text in the whole demo.

### Person B — Retrieval & Frontend Engineer
**Owns:** Playwright scraper, listing normalization, Next.js frontend, demo staging.

- Scaffold Next.js app, build search UI + results grid + Memory Panel against **mocked** `/api/search` responses matching the contract, so you're never blocked on the backend.
- Build the Playwright scraper for the chosen marketplace; normalize output to the `Listing` shape in the contract.
- Build the feedback UI (👍/👎/free-text) wired to `/api/feedback`.
- Build the static fixture fallback dataset for the exact demo queries.
- Own demo staging: the session-switcher, rehearsal run-throughs, recovery plan if live scraping fails on stage.

### Integration checkpoints
- **T+0:30** — API contract confirmed (above, or amended together), HydraDB schema confirmed, both start parallel work.
- **T+3:00** — swap mocks for real implementations; first true end-to-end run.
- **T+5:30** — full memory loop verified across 3 mock "sessions"; explanation text reviewed for honesty/specificity.
- **T+7:00** — demo script rehearsal, fallback data locked in.
- **T+8:00** — done.

---

## 8-Hour Roadmap

| Time | Milestone |
|---|---|
| 0:00–0:30 | Repo scaffold, API contract + HydraDB schema locked, marketplace target chosen |
| 0:30–3:00 | Parallel build: A = LangGraph + HydraDB + mocked API; B = Playwright scraper + mocked frontend |
| 3:00–3:30 | **Checkpoint 1**: wire frontend to real backend, backend to real scraper |
| 3:30–5:30 | Parallel build: A = preference extraction + explanation quality; B = Memory Panel + feedback UI + fixture fallback |
| 5:30–6:00 | **Checkpoint 2**: full 3-session memory loop test |
| 6:00–7:00 | Bug fixes, explanation tuning, UI polish |
| 7:00–7:30 | **Demo rehearsal** with session-switcher |
| 7:30–8:00 | Buffer / final polish |

---

## Risk Assessment & Fallbacks

| Risk | Mitigation |
|---|---|
| Marketplace blocks/throttles scraping mid-demo | Static fixture dataset for exact demo queries, swapped in via env flag |
| LLM ranking/explanation is generic or doesn't visibly use memory | Force-inject remembered preferences into the explanation prompt with explicit instruction to cite them by name |
| HydraDB integration issues eat the clock | Get a trivial write/read working in the first 30 minutes before building anything on top of it |
| Live demo timing is too slow (real scrape + LLM calls) | Pre-warm caches for demo queries before going on stage; session-switcher avoids needing real wall-clock time between "sessions" |
| Two-person work collides | Strict adherence to the API contract; no editing the other person's owned files without a sync |

---

## Suggested File/Folder Structure

```
DealScout/
├── README.md
├── backend/
│   ├── app.py                  # API server (Person A)
│   ├── graph/
│   │   ├── state.py
│   │   ├── nodes.py             # parse_query, retrieve_memory, rank, explain, update_memory
│   │   └── graph.py             # LangGraph wiring
│   ├── memory/
│   │   ├── hydra_client.py
│   │   └── schema.py
│   ├── ranking/
│   │   └── ranker.py
│   └── scraping/
│       ├── playwright_scraper.py   # Person B
│       ├── normalize.py
│       └── fixtures/
│           └── demo_queries.json   # fallback data
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # search + results grid
│   │   └── components/
│   │       ├── MemoryPanel.tsx
│   │       ├── ListingCard.tsx
│   │       └── SessionSwitcher.tsx
│   └── lib/
│       └── api.ts                # typed client matching the API contract
└── demo/
    └── script.md                  # the 3-session demo script, line by line
```
# DealScout
