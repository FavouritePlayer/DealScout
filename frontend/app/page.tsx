"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar, { type Section } from "./components/Sidebar";
import QueueGrid from "./components/QueueGrid";
import CarouselView from "./components/CarouselView";
import SavedFlips from "./components/SavedFlips";
import MemoryView from "./components/MemoryView";
import HistoryView from "./components/HistoryView";
import RejectDialog from "./components/RejectDialog";
import MemoryPanel from "./components/MemoryPanel";
import * as api from "@/lib/api";
import { appendHistory, loadHistory } from "@/lib/history";
import type { HistoryEntry, Preference, QueueItem } from "@/lib/types";

const USER_ID = "u_demo";
const SAVED_KEY = `dealscout:saved:${USER_ID}`;
const HISTORY_KEY = `dealscout:history:${USER_ID}`;

const SECTION_LABEL: Record<Section, string> = {
  queue: "Flip queue",
  memory: "Memory",
  history: "History",
  saved: "Saved flips",
};

const SECTION_DESC: Record<Section, string> = {
  queue:
    "DealScout scanned local listings for undervalued flips. Reject anything you don\u2019t want to deal with — it\u2019ll remember.",
  memory:
    "View and edit the rules DealScout stores in HydraDB. Changes apply on the next scan.",
  history: "A log of scans, rejections, saves, and memory edits this session.",
  saved: "The flips you saved from the queue, kept here for later.",
};

export default function HomePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [savingMemory, setSavingMemory] = useState(false);
  const [rejecting, setRejecting] = useState<QueueItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"gallery" | "carousel">("gallery");
  const [section, setSection] = useState<Section>("queue");
  const [saved, setSaved] = useState<QueueItem[]>([]);

  const logHistory = useCallback(
    (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
      setHistory(appendHistory(HISTORY_KEY, entry));
    },
    []
  );

  const persistSaved = useCallback((items: QueueItem[]) => {
    setSaved(items);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(items));
    } catch {
      // non-fatal
    }
  }, []);

  const refreshPreferences = useCallback(async () => {
    const { preferences } = await api.getPreferences(USER_ID);
    setPreferences(preferences);
  }, []);

  const doScan = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await api.scan(USER_ID);
      setQueue(res.queue);
      setExplanation(res.explanation);
      logHistory({
        type: "scan",
        title: `Scan returned ${res.queue.length} flip${res.queue.length === 1 ? "" : "s"}`,
        detail: res.explanation,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Scan failed — try again";
      setScanError(message);
      setQueue([]);
      setExplanation("");
    } finally {
      setScanning(false);
    }
  }, [logHistory]);

  const handleReject = useCallback((item: QueueItem) => {
    setRejecting(item);
  }, []);

  const handleAccept = useCallback(
    (item: QueueItem) => {
      setBusy(true);
      api
        .accept(USER_ID, item.id)
        .then(() => {
          setQueue((current) => current.filter((q) => q.id !== item.id));
          setSaved((current) => {
            if (current.some((s) => s.id === item.id)) return current;
            const next = [item, ...current];
            try {
              window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
            } catch {
              // non-fatal
            }
            return next;
          });
          logHistory({
            type: "save",
            title: item.title,
            detail: `Saved flip · $${item.projected_profit} projected profit`,
          });
        })
        .finally(() => setBusy(false));
    },
    [logHistory]
  );

  const handleRemoveSaved = useCallback(
    (item: QueueItem) => {
      persistSaved(saved.filter((s) => s.id !== item.id));
    },
    [persistSaved, saved]
  );

  const handleRejectSubmit = useCallback(
    async (item: QueueItem, note: string) => {
      const fb = await api.reject(USER_ID, item.id, note);
      await refreshPreferences();

      const pref = fb.preference_added;
      logHistory({
        type: "reject",
        title: item.title,
        detail: pref
          ? `"${note}" → avoid ${pref.key} = ${pref.value}`
          : note,
      });

      if (pref && pref.polarity === "avoid") {
        const key = pref.key as "category" | "condition";
        setQueue((current) => current.filter((q) => q[key] !== pref.value));
      } else {
        setQueue((current) => current.filter((q) => q.id !== item.id));
      }
    },
    [logHistory, refreshPreferences]
  );

  const handleRescan = useCallback(async () => {
    await api.clearSession(USER_ID);
    setQueue([]);
    setExplanation("");
    await refreshPreferences();
    logHistory({
      type: "rescan",
      title: "Rescan from scratch",
      detail: "Cleared HydraDB memory and ran a fresh scan",
    });
    await doScan();
  }, [doScan, logHistory, refreshPreferences]);

  const handleSaveMemory = useCallback(
    async (prefs: Preference[]) => {
      setSavingMemory(true);
      try {
        const res = await api.updatePreferences(USER_ID, prefs);
        setPreferences(res.preferences);
        logHistory({
          type: "memory_update",
          title: "Updated memory rules",
          detail: `${res.preferences.length} rule(s) saved to HydraDB`,
        });
      } finally {
        setSavingMemory(false);
      }
    },
    [logHistory]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw) as QueueItem[]);
    } catch {
      // ignore
    }
    setHistory(loadHistory(HISTORY_KEY));
    refreshPreferences();
    doScan();
  }, [doScan, refreshPreferences]);

  const showSidePanel = section === "queue" || section === "saved";

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1480px] mx-auto bg-white/70 backdrop-blur rounded-[28px] shadow-2xl ring-1 ring-black/5 flex overflow-hidden min-h-[calc(100vh-3rem)]">
        <Sidebar
          preferenceCount={preferences.length}
          savedCount={saved.length}
          historyCount={history.length}
          activeSection={section}
          onNavigate={setSection}
          onNewSession={handleRescan}
        />

        <div className="flex-1 flex flex-col bg-[var(--background)]">
          <header className="px-10 pt-8 pb-6 flex items-start justify-between gap-6 border-b border-[var(--border)] bg-white">
            <div>
              <div className="text-xs text-[var(--muted)] font-medium">
                DealScout <span className="mx-1">›</span> {SECTION_LABEL[section]}
              </div>
              <h1 className="text-2xl font-bold mt-1">
                Welcome back, Matthew{" "}
                <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                {SECTION_DESC[section]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {section === "queue" && (
                <>
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
                      <path
                        d="M3 3v5h5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {scanning ? "Scanning…" : "Rescan"}
                  </button>
                </>
              )}
              <span className="bg-black text-white text-xs font-semibold rounded-full px-4 py-2">
                Demo mode
              </span>
            </div>
          </header>

          <div
            className={`flex-1 grid gap-6 p-10 ${
              showSidePanel
                ? "grid-cols-1 xl:grid-cols-[1fr_360px]"
                : "grid-cols-1"
            }`}
          >
            <div className="flex flex-col gap-6">
              {scanError && section === "queue" && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {scanError}
                </div>
              )}
              {section === "memory" ? (
                <MemoryView
                  preferences={preferences}
                  onSave={handleSaveMemory}
                  saving={savingMemory}
                />
              ) : section === "history" ? (
                <HistoryView entries={history} />
              ) : section === "saved" ? (
                <SavedFlips items={saved} onRemove={handleRemoveSaved} />
              ) : view === "gallery" ? (
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

            {showSidePanel && (
              <div className="flex flex-col gap-6">
                <MemoryPanel preferences={preferences} />
                <DemoTipsCard />
              </div>
            )}
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
