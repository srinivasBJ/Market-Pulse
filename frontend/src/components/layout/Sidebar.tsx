export const nav = [
  "Today",
  "Yesterday",
  "Weekly",
  "Monthly",
  "Trending",
  "Sentiment",
  "Watchlist",
] as const;

export type NavItem = (typeof nav)[number];

type SidebarProps = {
  active: NavItem;
  onChange: (item: NavItem) => void;
};

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="panel flex h-full flex-col justify-between overflow-hidden p-5">
      <div className="space-y-8">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-accent/70">Market Pulse</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Atom Desk</h1>
          <p className="mt-2 text-sm text-slate-400">Terminal-lite financial desk for macro, crypto, forex, and market-moving headlines.</p>
        </div>
        <div className="rounded-2xl border border-line bg-slate-950/60 p-3">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-500">
            <span>Desk Views</span>
            <span>Live</span>
          </div>
          <nav className="space-y-2">
          {nav.map((item, index) => (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                active === item
                  ? "border-accent/40 bg-gradient-to-r from-accent/15 to-sky-400/10 text-white"
                  : "border-transparent bg-slate-900/50 text-slate-400 hover:border-line hover:text-white"
              }`}
            >
              <span>{item}</span>
              <span className="text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
          </nav>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Signal Layer</p>
          <p className="mt-2 text-sm text-slate-300">Summaries, clustering, and sentiment run locally with open-source NLP.</p>
        </div>
        <div className="rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(56,189,248,0.05))] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Coverage</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
            <span>Crypto</span>
            <span>Forex</span>
            <span>Stocks</span>
            <span>Macro</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
