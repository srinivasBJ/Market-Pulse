import { Article } from "../../lib/api";

export function ArticleCard({ article }: { article: Article }) {
  const tone =
    article.sentiment_label === "bullish"
      ? "text-emerald-300 bg-emerald-500/10"
      : article.sentiment_label === "bearish"
        ? "text-rose-300 bg-rose-500/10"
        : "text-sky-300 bg-sky-500/10";

  return (
    <article className="panel p-5 transition hover:border-accent/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
          <span>{article.category}</span>
          <span className="text-slate-700">/</span>
          <span>{article.source}</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${tone}`}>{article.sentiment_label}</span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-white">{article.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{article.overview ?? article.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {article.short_summary.slice(0, 3).map((bullet) => (
          <span key={bullet} className="rounded-full border border-line bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
            {bullet}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
          {article.related_tickers.length > 0 ? article.related_tickers.join(" · ") : "No tagged tickers"}
        </div>
        <a className="text-sm text-accent hover:text-white" href={article.url} target="_blank" rel="noreferrer">
          Read source
        </a>
      </div>
    </article>
  );
}
