"use client";

import { useEffect, useRef, useState } from "react";
import type { QueueItem } from "@/lib/types";

type Props = {
  item: QueueItem | null;
  onClose: () => void;
  onSubmit: (item: QueueItem, note: string) => Promise<void>;
};

export default function RejectDialog({ item, onClose, onSubmit }: Props) {
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"idle" | "remembering" | "saved">("idle");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (item) {
      setNote("");
      setPhase("idle");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [item]);

  if (!item) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    if (!note.trim()) return;
    setPhase("remembering");
    try {
      await onSubmit(item, note.trim());
      setPhase("saved");
      setTimeout(() => {
        onClose();
        setPhase("idle");
      }, 700);
    } catch {
      setPhase("idle");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Why are you rejecting it?</h3>
            <p className="text-sm text-[var(--muted)] mt-1 leading-snug">
              DealScout will remember your reason and quietly hide similar
              listings from future scans.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={phase === "remembering"}
            className="text-[var(--muted)] hover:text-black disabled:opacity-40 transition"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M6 18 18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">
            Rejecting
          </div>
          <div className="text-sm font-semibold mt-0.5">{item.title}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">
            {item.category.replace(/_/g, " ")} · {item.condition} ·{" "}
            ${item.asking_price}
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <textarea
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='e.g. "I don’t deal with furniture, too much hassle to move"'
            disabled={phase !== "idle"}
            rows={3}
            className="w-full bg-neutral-50 border border-[var(--border)] rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-neutral-300 transition resize-none disabled:opacity-60"
          />

          <div className="flex items-center justify-between gap-3">
            {phase === "remembering" ? (
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Remembering…
              </span>
            ) : phase === "saved" ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1.5">
                ✓ Saved to memory
              </span>
            ) : (
              <span className="text-xs text-[var(--muted)]">
                Press send to save this reason
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={phase === "remembering"}
                className="text-sm font-medium rounded-full px-4 py-2 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={phase !== "idle" || !note.trim()}
                className="text-sm font-semibold bg-black text-white rounded-full px-5 py-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
