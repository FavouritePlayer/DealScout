# DealScout

**A memory-powered resale-arbitrage agent built for the Agents You Love Hackathon.**

> Theme: *Context over Amnesia — Building Agents that Remember and Evolve*

DealScout doesn't help you search for one specific thing to buy and keep. It scans listings near you, flags the ones priced **below what they're actually worth**, and queues them up as flip opportunities — projected resale value, projected profit, all of it. You review the queue and reject what you don't want to deal with ("I don't flip furniture, it's a pain to move"). DealScout remembers that, and every future scan quietly excludes that whole category before you ever see it — no settings menu, no re-stating yourself.

The judging bar: a chatbot with a vector store bolted on doesn't count. The memory has to be load-bearing — remove it and the product breaks.

---

## The Demo (this is the whole product)

Not a single-category search. The queue spans categories — furniture, electronics, tools, collectibles, whatever — because the product is "find anything worth flipping," not "find a chair."

| Step | What happens |
|---|---|
| 1. Scan | Agent scans listings near the user, classifies each as **undervalued** or **overvalued** (asking price vs. estimated resale value), and returns a ranked queue of undervalued items with projected profit. The queue is visibly mixed — furniture, electronics, tools, etc. |
| 2. Reject with a reason | User rejects an item: *"I don't deal with furniture, it's too much hassle to move."* Agent writes this to HydraDB. |
| 3. Rescan / new session | User clicks "Rescan" (or comes back later) — no preference is re-stated. |
| 4. Scan again | Agent returns a queue with **every furniture item excluded entirely** — and says so: *"Excluded furniture listings since you mentioned moving them is too much hassle."* |

Same three proof points as any memory demo, just on a more interesting product:
- The agent **remembers** (the rejection reason was never repeated).
- It **retrieves autonomously** (nothing in the rescan mentions furniture).
- It **changes behavior** (furniture is gone from the queue, not just down-ranked).

A live **Memory Panel** showing the stored rule (`avoid: category = furniture`) updating in real time is the cheapest, highest-impact proof of this — build it before polishing anything else.

---

## Architecture

```
Scan Request (user_id, radius)
    │
    ▼
LangGraph Agent
    │
    ├─ retrieve_memory ──▶ HydraDB: this user's avoid/prefer rules
    │
    ▼
Static Listing Fixture (no live scraping — see below)
    │
    ▼
classify_value ──▶ pure arithmetic: margin = estimated_resale_value − asking_price
    │               classification = "undervalued" if margin_pct over threshold, else "overvalued"
    ▼
filter_and_rank ──▶ LLM excludes anything matching a remembered avoid-rule,
    │                keeps only undervalued items, sorts by projected profit,
    │                produces explanation string citing the user's own reason
    ▼
Queue ──▶ Frontend (Next.js): queue cards + Memory Panel
    │
    ▼
Reject ("too much hassle to move")
    │
    ▼
update_memory ──▶ extract structured rule ──▶ write to HydraDB
```

**Why no live Playwright scraping:** scraping a real marketplace is the one part of this stack where debugging is unpredictable (anti-bot, DOM changes) and AI-assisted codegen doesn't help — it's trial and error against a system you don't control. None of the judging criteria require live data. A thin Playwright wrapper that "loads" a local fixture file satisfies the stack requirement without the risk. (A separate, optional one-off proof that live scraping is *possible* exists in `backend/dev/scrape_demo.py` — it opens Craigslist, types into the real search box, and scrapes live. It is not part of this product and not wired into the app — don't build against it.)

The "near you" radius is simulated: each fixture listing carries a `distance_miles` field rather than this being a real geo-search.

---

## LangGraph Workflow

1. **`retrieve_memory`** — query HydraDB for this user's stored avoid/prefer rules.
2. **`classify_value`** — pure Python, no LLM: for every listing, `margin = estimated_resale_value - asking_price`, `margin_pct = margin / asking_price`. Anything over a margin_pct threshold (pick something obvious for the demo, e.g. 25%) is `"undervalued"`; everything else is `"overvalued"`.
3. **`filter_and_rank`** — load only the `"undervalued"` listings, have the LLM exclude anything matching a remembered avoid-rule (reasoning over raw recalled text, not a structured field match — see HydraDB Data Model below), sort survivors by projected profit, and produce a one-line `explanation` citing the user's own rejection reason.
4. **`update_memory`** — on rejection, ingest the user's raw rejection text as a memory, then **poll until indexing completes** before returning — see the latency note below.

State:

```python
class DealScoutState(TypedDict):
    user_id: str
    radius_miles: float
    memory_context: str          # raw text recalled from HydraDB, empty if none
    candidates: list[dict]        # raw fixture listings
    classified: list[dict]        # candidates + margin/margin_pct/classification
    queue: list[dict]             # undervalued, memory-filtered, sorted by profit
    explanation: str
    feedback: str | None          # raw rejection text, e.g. "too much hassle to move"
```

This runs as two separate compiled graphs, same as before: `scan_graph` (`retrieve_memory → classify_value → filter_and_rank`) and `feedback_graph` (`update_memory` only) — `update_memory` only ever runs on a rejection, so there's no reason to route a single graph through it on every scan.

---

## Listing / Fixture Data Model

Multi-category, not just chairs — this is the part that changed most. Each fixture listing needs:

```json
{
  "id": "f_001",
  "title": "Mid-century walnut dresser, minor scratches",
  "category": "furniture",
  "condition": "good",
  "asking_price": 80,
  "estimated_resale_value": 240,
  "distance_miles": 4.2,
  "location": "Berkeley, CA",
  "image": "https://images.dealscout.demo/f_001.jpg",
  "url": "https://example-marketplace.com/listing/f_001",
  "description": "...",
  "posted_at": "2026-06-18T14:22:00Z"
}
```

**Fixed vocabulary, picked because they're what the demo's memory rules hang on:**
- `category`: `furniture | electronics | tools | collectibles | sporting_goods | appliances | instruments | clothing | toys | books | other`
- `condition`: `like new | good | fair | needs repair`

**Curate the numbers deliberately, don't randomize them.** The demo's entire visual impact depends on:
- Several listings being *obviously* great flips (asking price well under estimated value — e.g. 60–70% margin) spread across at least 3–4 different categories, so a category-based rejection visibly removes multiple cards from the queue, the same way "blue chairs" did.
- Several listings being *obviously* bad flips (asking price near or above estimated value) so the `classify_value` step has real negatives to filter out — don't make everything undervalued, that makes the classification step meaningless to demo.
- `estimated_resale_value` should be defensible at a glance (a judge skimming it shouldn't think "that's made up") — base it on roughly realistic resale prices for that kind of item, not arbitrary multipliers.

~20–25 listings across at least 5 categories is enough. `margin`/`margin_pct`/`classification` are **derived by the backend**, not stored in the fixture — the fixture only supplies `asking_price` and `estimated_resale_value`.

---

## HydraDB Data Model

Unchanged from the integration that's already built and verified — only the *content* of what gets stored is more general now (any rejection reason, not just color).

- `tenant_id = "dealscout"` (one tenant for the whole app)
- `sub_tenant_id = user_id` (each user's rules are scoped/partitioned here)
- One memory per rejection, written as natural-language text:

```python
client.context.ingest(
    type="memory",
    tenant_id="dealscout",
    sub_tenant_id=user_id,
    upsert=True,
    memories=json.dumps([{
        "text": "User doesn't want furniture, too much hassle to move.",
        "infer": True,
        "user_name": user_id,
        "metadata": {"category": "furniture"}   # nested object, not a JSON string
    }])
)
```

Tenant must exist and be `ready_for_ingestion` before the first ingest/query call (one-time ~0.4s setup, already handled in `HydraMemoryClient._ensure_tenant()`).

Retrieval is a natural-language query, requires `tenant_id` explicitly:

```python
client.query(type="memory", tenant_id="dealscout", sub_tenant_id=user_id, query="flip category and condition preferences")
```

The response is free text plus extracted graph relations — there's no guaranteed structured row, so `filter_and_rank` has the LLM reason over the retrieved text directly against each listing's attributes, same pattern as before.

**⚠️ Confirmed latency risk (measured against the live API):** `context.ingest()` is asynchronous — a rejection isn't queryable until indexing completes. **Measured round trip: consistently 12–17 seconds.** This is real per-ingestion processing time, not a one-time cost, and will be visible in a live demo. Mitigation, in order of preference:
1. Script a deliberate ~15s pause after a rejection — presenter narrates while the loading state shows ("remembering...") — before triggering the rescan.
2. If that breaks flow, pre-ingest the rejection before going on stage, narrate the write step, and only demo the rescan live.
3. Do not attempt rejection→rescan as an instant back-to-back action without one of the above.

`HydraMemoryClient` also has `forget_all(user_id)` (list-then-delete-by-id, since HydraDB has no bulk delete-by-user call) for a working "clear my preferences" reset.

---

## API Contract

```
POST /api/scan
Request:  { "user_id": string, "radius_miles"?: number }
Response: {
  "queue": [
    { "id": string, "title": string, "category": string, "condition": string,
      "asking_price": number, "estimated_resale_value": number,
      "projected_profit": number, "margin_pct": number, "classification": "undervalued",
      "distance_miles": number, "location": string, "image": string, "url": string,
      "description"?: string, "posted_at"?: string }
  ],
  "explanation": string,                 // e.g. "Excluded furniture since you said moving it is too much hassle."
  "memory_used": [ { "key": "category", "value": "furniture", "polarity": "avoid" } ]
}

POST /api/feedback
Request:  { "user_id": string, "item_id": string, "decision": "reject" | "accept", "note": string }
            // note = raw rejection text, e.g. "I don't deal with furniture, too much hassle to move"
Response: { "ok": true, "preference_added": { "key": string, "value": string, "polarity": "avoid" | "prefer" } | null }
            // backend ingests into HydraDB AND polls indexing to completion before responding
            // — takes ~12-17s, see latency note above. Frontend just awaits this call.

GET /api/preferences/:user_id
Response: { "preferences": [ { "key": string, "value": string, "polarity": "avoid" | "prefer" }, ... ] }

DELETE /api/preferences/:user_id
Response: { "ok": true }    // wipes all stored memories for this user — used by "Rescan from scratch" / reset
```

`key` is generalized beyond color now — expect at least `category` and `condition` as keys the parser/LLM can produce, since those are the two attributes the fixture's vocabulary supports and the ones a rejection reason will most often map to.

---

## Frontend (Next.js, single page)

- **Queue view**, not a search bar — a grid/list of flip-candidate cards. Each card needs: title, category + condition tags, asking price, estimated resale value, **projected profit** (this is the headline number — make it the most visually prominent thing on the card), distance, image.
- **Reject / Accept controls** on each card. Reject should prompt for a short reason (free text) → `POST /api/feedback`. Accept can just dismiss the card from the local queue view (no memory write needed for accepts in the MVP).
- **Memory Panel** (always visible, sidebar) — live `GET /api/preferences/:user_id`, refreshed after every feedback submission. This is the visual proof of memory for judges.
- **"Rescan"** button — re-runs `POST /api/scan` for the same user, proving the exclusion came from HydraDB, not local UI state.

No multi-page flow, no auth, no account system.

---

## P0 / P1 / P2

**P0 — the only thing that has to exist:**
- Static fixture of ~20–25 multi-category listings, with `asking_price` / `estimated_resale_value` curated so some are obviously great flips and some obviously aren't (see Listing Data Model above)
- `retrieve_memory → classify_value → filter_and_rank` graph wired end to end
- Scan → queue shown, mixed categories, mixed undervalued/overvalued
- Reject-with-reason → rule extracted and written to HydraDB
- Rescan → matching category (or condition) fully excluded from the queue, not just down-ranked
- Explanation string that names what was excluded and why
- Memory Panel showing the live rule

**P1 — only after P0 works end to end:**
- A second rule type beyond category (e.g. condition, or a distance ceiling) to show memory generalizes across attributes
- "Rescan" polish + clean re-run flow for staging the demo
- Explanation wording pass (cite the user's own phrase back naturally)

**P2 — only attempt if P0 and P1 are both done with real time to spare:**
- Real geo-radius instead of a static `distance_miles` field
- Inferring a rule from repeated rejections without an explicit stated reason
- Live scraping replacing the static fixture
- Multiple simultaneous rules with conflict resolution
- Accept flow actually mattering (e.g. feeding "prefer" rules back into ranking)

If unsure whether to spend time on a P1 item vs. polishing visuals, do the P1 item — judges are scoring memory behavior, not visual design.

---

## Note to Person B (from Person A)

This is a product pivot, not an incremental change — previous notes about a chair search bar / single-color filtering no longer apply. Here's what's concretely needed from you now:

- **New fixture, replacing `chairs_fixture.json`.** Needs ~20–25 listings across at least 5 categories (see the fixed `category`/`condition` vocab and curation guidance in the Listing / Fixture Data Model section above — the numbers need to be deliberately picked, not randomized, or the demo's "undervalued vs overvalued" split won't read as real). Keep the file name pattern your `playwright_loader.py` already expects, or let me know if you want to change that contract.
- **New frontend: queue of cards, not a search bar.** Each card's headline number is projected profit — that's the entire pitch of the product, make it visually loud. Reject needs a reason-capture input (even a single text field is enough) since that text is what becomes the remembered rule.
- **Memory Panel and Rescan button carry over conceptually** from the old design, just pointed at the new contract above (`key` is now `category`/`condition` instead of always `color`).
- **The `/api/feedback` call is still ~12–17 seconds** — same constraint as before, just confirming it's not different in the new flow. Keep the loading state.
- Once you've got the new fixture and UI scaffolded against this contract (mock it locally first, same as before), ping me and I'll wire the real backend the same way I did last time — that integration step went smoothly because the contract was agreed up front, so let's keep doing that.

---

## Two-Person Split

### Person A — Agent & Memory
Owns: LangGraph graph (`retrieve_memory`, `classify_value`, `filter_and_rank`, `update_memory`), HydraDB client + schema, rule extraction, valuation/classification logic, backend API.

### Person B — Data & Frontend
Owns: new multi-category listing fixture, Next.js queue UI (cards, reject/accept, Memory Panel, Rescan), thin Playwright wrapper that loads the fixture (already built, just needs to keep working against the new fixture).

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| HydraDB's async indexing is too slow to demo live (write→query round trip) | **Confirmed at 12–17s.** Script a deliberate pause, or pre-ingest before going on stage and only demo the rescan live |
| Fixture's `estimated_resale_value` numbers look made up to judges | Curate, don't randomize — base them on defensible, roughly-realistic resale prices; keep a clear gap between "obvious flip" and "obvious bad deal" listings |
| `classify_value` threshold makes everything (or nothing) "undervalued" | Pick a margin_pct threshold against the actual curated fixture data and verify the split looks reasonable before building anything on top of it |
| Rule extraction misparses a rejection reason (e.g. extracts the wrong category) | Keep the demo's rejection phrasing known in advance and tune the extraction prompt specifically against it before rehearsal |
| Filtering down-ranks instead of fully excluding | Test explicitly — the demo's visual impact depends on rejected-category items being **absent**, not just lower in the queue |
| Running short on time | Cut P1 items first, never cut the Memory Panel |

---

## Suggested File/Folder Structure

```
DealScout/
├── README.md
├── backend/
│   ├── app.py                       # API server (Person A)
│   ├── graph/
│   │   ├── state.py
│   │   ├── nodes.py                  # retrieve_memory, classify_value, filter_and_rank, update_memory
│   │   └── graph.py
│   ├── memory/
│   │   ├── hydra_client.py
│   │   ├── preference_parser.py
│   │   └── schema.py
│   ├── data/
│   │   ├── listings_fixture.json      # Person B — new multi-category fixture
│   │   └── playwright_loader.py       # thin wrapper, loads fixture
│   └── dev/
│       ├── demo_cli.py                 # terminal proof of the memory loop
│       └── scrape_demo.py              # optional: proves live scraping is possible, not wired in
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── components/
│   │       ├── MemoryPanel.tsx
│   │       ├── QueueCard.tsx
│   │       └── RejectDialog.tsx
│   └── lib/
│       └── api.ts
└── demo/
    └── script.md                      # the exact lines to say/type during the demo
```
