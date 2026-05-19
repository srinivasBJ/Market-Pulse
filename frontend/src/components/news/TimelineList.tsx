import { Article } from "../../lib/api";

export function TimelineList({ title, articles }: { title: string; articles: Article[] }) {
  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Timeline</p>
          <h3 className="font-display text-xl text-white">{title}</h3>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-slate-400">{articles.length} stories</span>
      </div>
      <div className="space-y-3">
        {articles.map((article) => (
          <div key={article.id} className="relative border-l border-line pl-4">
            <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
            <p className="text-sm font-medium text-white">{article.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              {article.source} · {new Date(article.published_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
