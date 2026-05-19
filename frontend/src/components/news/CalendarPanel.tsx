const items = [
  { time: "09:30", currency: "USD", impact: "High", event: "Fed speaker remarks" },
  { time: "11:00", currency: "EUR", impact: "Medium", event: "Eurozone sentiment print" },
  { time: "13:30", currency: "USD", impact: "High", event: "Treasury auction / yields watch" },
  { time: "15:00", currency: "BTC", impact: "Medium", event: "ETF flow snapshot" },
];

export function CalendarPanel() {
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-line px-5 py-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Macro Calendar</p>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={`${item.time}-${item.event}`} className="grid grid-cols-[72px_72px_92px_minmax(0,1fr)] gap-3 px-5 py-4 text-sm">
            <span className="text-slate-300">{item.time}</span>
            <span className="text-slate-500">{item.currency}</span>
            <span className={item.impact === "High" ? "text-amber-300" : "text-sky-300"}>{item.impact}</span>
            <span className="text-white">{item.event}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

