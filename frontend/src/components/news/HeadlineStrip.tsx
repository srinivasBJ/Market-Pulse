import { Article } from "../../lib/api";

export function HeadlineStrip({ articles }: { articles: Article[] }) {
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-line px-5 py-3 text-[11px] uppercase tracking-[0.35em] text-slate-500">
        Live Headlines
      </div>
      <div className="grid divide-y divide-line">
        {articles.map((article, index) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="grid gap-2 px-5 py-4 transition hover:bg-slate-900/60 lg:grid-cols-[72px_minmax(0,1fr)_140px]"
          >
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-sm font-medium text-white">{article.title}</p>
              <p className="mt-1 text-sm text-slate-400">{article.overview ?? article.excerpt}</p>
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500 lg:text-right">
              <div>{article.source}</div>
              <div className="mt-1">{article.category}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

