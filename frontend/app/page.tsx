"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import ResultsGrid from "./components/ResultsGrid";
import FeedbackBox from "./components/FeedbackBox";
import MemoryPanel from "./components/MemoryPanel";
import * as api from "@/lib/api";
import type { Listing, Preference } from "@/lib/types";

const USER_ID = "u_demo";
const CATEGORY = "chair";

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [searching, setSearching] = useState(false);

  const refreshPreferences = useCallback(async () => {
    const { preferences } = await api.getPreferences(USER_ID);
    setPreferences(preferences);
  }, []);

  const doSearch = useCallback(async (query: string) => {
    setSearching(true);
    setLastQuery(query);
    try {
      const res = await api.search(USER_ID, query);
      setListings(res.results);
      setExplanation(res.explanation);
    } finally {
      setSearching(false);
    }
  }, []);

  const doFeedback = useCallback(
    async (note: string) => {
      await api.sendFeedback(USER_ID, CATEGORY, note);
      await refreshPreferences();
      if (lastQuery) {
        await doSearch(lastQuery);
      }
    },
    [lastQuery, doSearch, refreshPreferences]
  );

  const newSession = useCallback(async () => {
    await api.clearSession(USER_ID);
    setListings([]);
    setExplanation("");
    setLastQuery("");
    await refreshPreferences();
  }, [refreshPreferences]);

  useEffect(() => {
    refreshPreferences();
  }, [refreshPreferences]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1480px] mx-auto bg-white/70 backdrop-blur rounded-[28px] shadow-2xl ring-1 ring-black/5 flex overflow-hidden min-h-[calc(100vh-3rem)]">
        <Sidebar
          preferenceCount={preferences.length}
          onNewSession={newSession}
        />

        <div className="flex-1 flex flex-col bg-[var(--background)]">
          <header className="px-10 pt-8 pb-6 flex items-start justify-between gap-6 border-b border-[var(--border)] bg-white">
            <div>
              <div className="text-xs text-[var(--muted)] font-medium">
                DealScout <span className="mx-1">›</span> Search
              </div>
              <h1 className="text-2xl font-bold mt-1">
                Welcome back, Matthew{" "}
                <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                DealScout learns what you like as you go — try searching, then
                tell it what you don&rsquo;t want.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-neutral-100 transition">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3v1M12 20v1M3 12h1M20 12h1M5.6 5.6l.7.7M17.7 17.7l.7.7M5.6 18.4l.7-.7M17.7 6.3l.7-.7" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </button>
              <button className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-neutral-100 transition">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10 21a2 2 0 0 0 4 0" strokeLinecap="round" />
                </svg>
              </button>
              <span className="bg-black text-white text-xs font-semibold rounded-full px-4 py-2">
                Demo mode
              </span>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 p-10">
            <div className="flex flex-col gap-6">
              <SearchBar onSearch={doSearch} loading={searching} />
              <ResultsGrid
                listings={listings}
                explanation={explanation}
                loading={searching}
              />
              <FeedbackBox onSubmit={doFeedback} />
            </div>

            <div className="flex flex-col gap-6">
              <MemoryPanel preferences={preferences} />
              <DemoTipsCard />
            </div>
          </div>
        </div>
      </div>
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
          <span>Search for &ldquo;Find me a chair&rdquo;.</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-white/15 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </span>
          <span>
            Tell DealScout &ldquo;I don&rsquo;t like blue chairs&rdquo;.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-white/15 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </span>
          <span>Watch the blue cards vanish from results.</span>
        </li>
      </ol>
    </section>
  );
}
