export function TrendingPanel({
  topics,
}: {
  topics: Array<{ topic: string; count: number; sentiment: string; sources: string[] }>;
}) {
  return (
    <section className="panel p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trend Detection</p>
      <h3 className="mt-2 font-display text-xl text-white">Story clusters</h3>
      <div className="mt-5 space-y-4">
        {topics.map((topic) => (
          <div key={topic.topic} className="rounded-2xl border border-line bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-white">{topic.topic}</p>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{topic.count} hits</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{topic.sources.join(" · ")}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{topic.sentiment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

