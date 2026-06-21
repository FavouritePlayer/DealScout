import json
import os
import time

from hydra_db import HydraDB


class HydraMemoryClient:
    """Thin wrapper around the HydraDB v2 SDK, scoped to DealScout's use case:
    one memory per stated preference, partitioned by user via sub_tenant_id.

    Verified against a live HydraDB key (not just docs):
    - tenant must exist and be ready_for_ingestion before any ingest/query call
    - ingest() returns per-item job ids; status() polling needs those ids
    - query() returns chunk_content text plus extracted graph relations
    - actual ingest->queryable latency observed: ~12-17s consistently, not a
      one-time setup cost — this is a real demo-pacing concern, see README
    """

    def __init__(self, tenant_id: str | None = None):
        self.client = HydraDB(token=os.environ["HYDRA_DB_API_KEY"])
        self.tenant_id = tenant_id or os.environ.get("HYDRA_TENANT_ID", "dealscout")
        self._ensure_tenant()

    def _ensure_tenant(self, timeout_s: float = 30.0) -> None:
        existing = self.client.tenants.list().data.tenant_ids or []
        if self.tenant_id in existing:
            return
        self.client.tenants.create(tenant_id=self.tenant_id)
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            status = self.client.tenants.status(tenant_id=self.tenant_id)
            if status.data.infra.ready_for_ingestion:
                return
            time.sleep(1)
        raise TimeoutError(f"Tenant {self.tenant_id!r} not ready after {timeout_s}s")

    def remember(
        self, user_id: str, text: str, metadata: dict | None = None, poll_timeout_s: float = 30.0
    ) -> None:
        """Ingest a stated preference (e.g. a rejection reason) and block
        until it's queryable.

        infer=True lets HydraDB extract structure from the raw feedback text
        rather than us pre-parsing it into fields.
        """
        resp = self.client.context.ingest(
            type="memory",
            tenant_id=self.tenant_id,
            sub_tenant_id=user_id,
            upsert=True,
            memories=json.dumps([{
                "text": text,
                "infer": True,
                "user_name": user_id,
                "metadata": metadata or {},
            }]),
        )
        job_ids = [r.id for r in resp.data.results]
        self._wait_for_indexing(user_id, job_ids, poll_timeout_s)

    def _wait_for_indexing(self, user_id: str, job_ids: list[str], timeout_s: float) -> None:
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            status = self.client.context.status(
                tenant_id=self.tenant_id, sub_tenant_id=user_id, ids=job_ids
            )
            statuses = status.data.statuses
            if all(s.indexing_status == "completed" for s in statuses):
                return
            if any(s.indexing_status == "failed" for s in statuses):
                raise RuntimeError(f"HydraDB indexing failed: {statuses}")
            time.sleep(0.5)
        raise TimeoutError(f"HydraDB indexing did not complete within {timeout_s}s")

    def recall(self, user_id: str, query: str) -> str:
        """Natural-language query for memories relevant to this category."""
        result = self.client.query(
            type="memory", tenant_id=self.tenant_id, sub_tenant_id=user_id, query=query
        )
        chunks = result.data.chunks or []
        return "\n".join(c.chunk_content for c in chunks)

    def replace_preferences(self, user_id: str, texts: list[str]) -> None:
        """Replace a user's entire preference set with a fresh batch ingest.

        Clears existing memories first, then ingests all texts in one call
        so indexing is polled once rather than once per rule (~15s total).
        """
        self.forget_all(user_id)
        if not texts:
            return
        resp = self.client.context.ingest(
            type="memory",
            tenant_id=self.tenant_id,
            sub_tenant_id=user_id,
            upsert=True,
            memories=json.dumps([{
                "text": text,
                "infer": True,
                "user_name": user_id,
                "metadata": {},
            } for text in texts]),
        )
        job_ids = [r.id for r in resp.data.results]
        self._wait_for_indexing(user_id, job_ids, poll_timeout_s=30.0)

    def forget_all(self, user_id: str) -> int:
        """Delete every stored memory for a user (used by 'New Session').

        context.delete() requires explicit ids — there's no bulk
        delete-by-sub_tenant call — so this lists the user's memory ids
        first, then deletes by id.
        """
        listing = self.client.context.list(
            tenant_id=self.tenant_id, sub_tenant_id=user_id, type="memory"
        )
        ids = [m["memory_id"] for m in listing.data.user_memories]
        if not ids:
            return 0
        self.client.context.delete(
            tenant_id=self.tenant_id, sub_tenant_id=user_id, type="memory", ids=ids
        )
        return len(ids)
