"use client";

import { useState } from "react";

type Props = {
  onSubmit: (note: string) => Promise<void>;
};

export default function FeedbackBox({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "remembering" | "saved">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setState("remembering");
    try {
      await onSubmit(value.trim());
      setState("saved");
      setValue("");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("idle");
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-[var(--border)] shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Tell DealScout what you think</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Any preference you mention here is remembered for your next search.
          </p>
        </div>
        {state === "remembering" && (
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Remembering…
          </span>
        )}
        {state === "saved" && (
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5">
            ✓ Saved to memory
          </span>
        )}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='e.g. "I don’t like blue chairs"'
          disabled={state === "remembering"}
          className="flex-1 bg-neutral-50 border border-[var(--border)] rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-neutral-300 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "remembering" || !value.trim()}
          className="bg-black text-white rounded-full px-5 py-3 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </form>
    </section>
  );
}
