"use client";

import { useState } from "react";

type Props = {
  onSearch: (query: string) => void;
  loading?: boolean;
};

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState("Find me a chair");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSearch(value.trim());
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-2 flex items-center gap-2"
    >
      <div className="pl-4 pr-1 text-[var(--muted)]">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What are you shopping for?"
        className="flex-1 bg-transparent outline-none text-base py-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
