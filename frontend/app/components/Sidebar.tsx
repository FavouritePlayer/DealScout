"use client";

type Props = {
  preferenceCount: number;
  onNewSession: () => void;
};

export default function Sidebar({ preferenceCount, onNewSession }: Props) {
  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--border)] flex flex-col p-6 gap-8 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          D
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">DealScout</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-full">
              MVP
            </span>
          </div>
          <div className="text-xs text-[var(--muted)]">Private workspace</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase px-3 mb-2">
          Menu
        </div>
        <NavItem active label="Search" icon={<SearchIcon />} />
        <NavItem
          label="Memory"
          icon={<BrainIcon />}
          badge={preferenceCount > 0 ? preferenceCount : undefined}
        />
        <NavItem label="History" icon={<ClockIcon />} />
        <NavItem label="Categories" icon={<GridIcon />} />
      </nav>

      <nav className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase px-3 mb-2">
          Others
        </div>
        <NavItem label="Settings" icon={<SettingsIcon />} />
        <NavItem label="Help" icon={<HelpIcon />} />
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={onNewSession}
          className="w-full text-sm font-medium bg-black text-white rounded-full px-4 py-2.5 hover:bg-neutral-800 transition"
        >
          + New session
        </button>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-50 border border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-amber-300" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">Matthew R.</div>
            <div className="text-[11px] text-[var(--muted)] truncate">
              berkeley.edu
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon,
  active = false,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-full cursor-pointer transition ${
        active
          ? "bg-black text-white"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
            active ? "bg-white text-black" : "bg-orange-500 text-white"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3a3 3 0 0 0-3 3v.5A3 3 0 0 0 4 9v2a3 3 0 0 0 1 2.2A3 3 0 0 0 6 18a3 3 0 0 0 3 3h.5V3H9Z" />
      <path d="M15 3a3 3 0 0 1 3 3v.5A3 3 0 0 1 20 9v2a3 3 0 0 1-1 2.2A3 3 0 0 1 18 18a3 3 0 0 1-3 3h-.5V3h.5Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}
