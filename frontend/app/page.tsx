"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import QueueGrid from "./components/QueueGrid";
import CarouselView from "./components/CarouselView";
import RejectDialog from "./components/RejectDialog";
import MemoryPanel from "./components/MemoryPanel";
import * as api from "@/lib/api";
import type { Preference, QueueItem } from "@/lib/types";

const USER_ID = "u_demo";

export default function HomePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [scanning, setScanning] = useState(false);
  const [rejecting, setRejecting] = useState<QueueItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"gallery" | "carousel">("gallery");

  const refreshPreferences = useCallback(async () => {
    const { preferences } = await api.getPreferences(USER_ID);
    setPreferences(preferences);
  }, []);

  const doScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await api.scan(USER_ID);
      setQueue(res.queue);
      setExplanation(res.explanation);
    } finally {
      setScanning(false);
    }
  }, []);

  const handleReject = useCallback((item: QueueItem) => {
    setRejecting(item);
  }, []);

  const handleAccept = useCallback((item: QueueItem) => {
    setBusy(true);
    api
      .accept(USER_ID, item.id)
      .then(() => {
        // Accept just removes the card from the queue locally — no memory write
        // in the MVP. The next scan would still surface it.
        setQueue((current) => current.filter((q) => q.id !== item.id));
      })
      .finally(() => setBusy(false));
  }, []);

  const handleRejectSubmit = useCallback(
    async (item: QueueItem, note: string) => {
      const fb = await api.reject(USER_ID, item.id, note);
      await refreshPreferences();

      // Don't re-scan here — a rescan re-scrapes live listings and would
      // replace the entire queue with a fresh, unrelated batch, making it
      // look like everything just vanished. Instead, filter the *current*
      // queue down to whatever the new avoid-rule actually matches, so
      // unrelated previously-scraped items stay put.
      const pref = fb.preference_added;
      if (pref && pref.polarity === "avoid") {
        const key = pref.key as "category" | "condition";
        setQueue((current) => current.filter((q) => q[key] !== pref.value));
      } else {
        setQueue((current) => current.filter((q) => q.id !== item.id));
      }
    },
    [refreshPreferences]
  );

  const handleRescan = useCallback(async () => {
    await api.clearSession(USER_ID);
    setQueue([]);
    setExplanation("");
    await refreshPreferences();
    await doScan();
  }, [doScan, refreshPreferences]);

  useEffect(() => {
    refreshPreferences();
    doScan();
  }, [doScan, refreshPreferences]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1480px] mx-auto bg-white/70 backdrop-blur rounded-[28px] shadow-2xl ring-1 ring-black/5 flex overflow-hidden min-h-[calc(100vh-3rem)]">
        <Sidebar
          preferenceCount={preferences.length}
          onNewSession={handleRescan}
        />

        <div className="flex-1 flex flex-col bg-[var(--background)]">
          <header className="px-10 pt-8 pb-6 flex items-start justify-between gap-6 border-b border-[var(--border)] bg-white">
            <div>
              <div className="text-xs text-[var(--muted)] font-medium">
                DealScout <span className="mx-1">›</span> Flip queue
              </div>
              <h1 className="text-2xl font-bold mt-1">
                Welcome back, Matthew{" "}
                <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                DealScout scanned local listings for undervalued flips. Reject
                anything you don&rsquo;t want to deal with — it&rsquo;ll
                remember.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-neutral-100 rounded-full p-1">
                <button
                  onClick={() => setView("gallery")}
                  className={`text-sm font-semibold rounded-full px-3.5 py-1.5 transition ${
                    view === "gallery"
                      ? "bg-white shadow-sm text-black"
                      : "text-[var(--muted)] hover:text-black"
                  }`}
                >
                  Gallery
                </button>
                <button
                  onClick={() => setView("carousel")}
                  className={`text-sm font-semibold rounded-full px-3.5 py-1.5 transition ${
                    view === "carousel"
                      ? "bg-white shadow-sm text-black"
                      : "text-[var(--muted)] hover:text-black"
                  }`}
                >
                  Carousel
                </button>
              </div>
              <button
                onClick={doScan}
                disabled={scanning}
                className="flex items-center gap-2 bg-white border border-[var(--border)] rounded-full px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50 transition"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M3 12a9 9 0 1 0 3-6.7L3 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {scanning ? "Scanning…" : "Rescan"}
              </button>
              <span className="bg-black text-white text-xs font-semibold rounded-full px-4 py-2">
                Demo mode
              </span>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 p-10">
            <div className="flex flex-col gap-6">
              {view === "gallery" ? (
                <QueueGrid
                  items={queue}
                  explanation={explanation}
                  loading={scanning}
                  onReject={handleReject}
                  onAccept={handleAccept}
                  busy={busy}
                />
              ) : (
                <CarouselView
                  items={queue}
                  explanation={explanation}
                  loading={scanning}
                  onReject={handleReject}
                  onAccept={handleAccept}
                  busy={busy}
                />
              )}
            </div>

            <div className="flex flex-col gap-6">
              <MemoryPanel preferences={preferences} />
              <DemoTipsCard />
            </div>
          </div>
        </div>
      </div>

      <RejectDialog
        item={rejecting}
        onClose={() => setRejecting(null)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  );
}

function DemoTipsCard() {
  return (
    <section className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 rounded-full px-2 py-1">
          Try the demo
        </span>
      </div>
      <ol className="flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-white/15 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            1
          </span>
          <span>Open the queue — mixed categories, all undervalued.</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-white/15 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <span>
            Reject a furniture card with{" "}
            <span className="italic">
              &ldquo;too much hassle to move&rdquo;
            </span>
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-white/15 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <span>Watch all furniture vanish from the next scan.</span>
        </li>
      </ol>
    </section>
  );
}
