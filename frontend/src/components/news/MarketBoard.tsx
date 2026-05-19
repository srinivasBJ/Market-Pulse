export function MarketBoard({ movers }: { movers: Array<{ name: string; price: number; change: number }> }) {
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-line px-5 py-3 text-[11px] uppercase tracking-[0.35em] text-slate-500">
        Market Board
      </div>
      <div className="grid divide-x-0 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
        {movers.map((mover) => (
          <div key={mover.name} className="px-5 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{mover.name}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-2xl text-white">{mover.price}</p>
              <p className={mover.change >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {mover.change >= 0 ? "+" : ""}
                {mover.change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
