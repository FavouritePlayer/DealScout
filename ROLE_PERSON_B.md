# My Role — Person B (Data & Frontend)

Per the two-person split in `README.md`, I (Matthew) am **Person B / "p2"** on DealScout.

## Ownership

- **Static fixture**: `backend/data/chairs_fixture.json` — ~15–20 chair listings, varied colors (must include enough blue chairs that their absence after feedback is visually obvious).
- **Playwright wrapper**: `backend/data/playwright_loader.py` — thin loader over the fixture; no live scraping.
- **Next.js frontend** (`frontend/`):
  - Search bar + results grid
  - `ListingCard` (title, price, color, image)
  - `FeedbackBox` → `POST /api/feedback`
  - `MemoryPanel` (sidebar, always visible, live `GET /api/preferences/:user_id`)
  - "New Session" button (clears local UI state, re-runs the same search)
- **API client**: `frontend/lib/api.ts`

## Not my scope (Person A owns)

LangGraph graph, HydraDB client + schema, preference extraction, ranking/filtering, explanation generation, backend API server.

## Working agreement

- Lock the API contract first (first 15 min) — build against mocked responses, not against Person A's code directly.
- Memory Panel is the single highest-leverage UI piece — don't cut it.
- Fixture is demo choreography, not filler — blue chairs must be present and visually distinct so their post-feedback absence is unmistakable.
