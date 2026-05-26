from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.article import IngestionResponse
from app.services.nlp.sentiment import score_sentiment
from app.services.nlp.summarizer import summarize_text
from app.services.nlp.tagging import extract_related_tickers, infer_category
from app.services.nlp.trends import build_cluster_key
from app.services.scrapers.article_extractor import enrich_article
from app.services.scrapers.html_scraper import parse_html_fallback
from app.services.scrapers.models import RawArticle
from app.services.scrapers.rss_scraper import parse_rss
from app.services.scrapers.source_config import SOURCES


def _is_supported_news_url(source: dict, url: str) -> bool:
    lowered = url.lower()
    if "/thread/" in lowered or "#post" in lowered or "/forum/" in lowered:
        return False
    if source["name"] == "ForexFactory":
        return "/news" in lowered
    return True


def _collect_source_articles(source: dict) -> list[RawArticle]:
    articles = parse_rss(source)
    if len(articles) < 5:
        try:
            articles.extend(parse_html_fallback(source))
        except Exception:
            pass
    return articles[:20]


def run_ingestion(db: Session) -> IngestionResponse:
    ingested = 0
    duplicates = 0
    used_sources: list[str] = []
    seen_urls = set(db.scalars(select(Article.url)).all())

    for source in SOURCES:
        raw_articles = _collect_source_articles(source)
        if not raw_articles:
            continue
        used_sources.append(source["name"])

        for raw in raw_articles:
            if not _is_supported_news_url(source, raw.url):
                duplicates += 1
                continue
            if raw.url in seen_urls:
                duplicates += 1
                continue
            try:
                enriched = enrich_article(raw)
            except Exception:
                enriched = raw

            if not _is_supported_news_url(source, enriched.url):
                duplicates += 1
                continue
            if enriched.url in seen_urls:
                duplicates += 1
                continue

            analysis_text = f"{enriched.title}. {enriched.content or enriched.excerpt or ''}"
            summary = summarize_text(analysis_text)
            sentiment_score, sentiment_label = score_sentiment(analysis_text)
            published_at = enriched.published_at or datetime.now(timezone.utc)
            category = infer_category(analysis_text, enriched.category)

            article = Article(
                title=enriched.title,
                source=enriched.source,
                author=enriched.author,
                url=enriched.url,
                image_url=enriched.image_url,
                published_at=published_at,
                category=category,
                tags=enriched.tags[:12],
                excerpt=(enriched.excerpt or enriched.content[:280]) if (enriched.excerpt or enriched.content) else None,
                short_summary=summary["short_summary"],
                overview=summary["overview"],
                key_takeaways=summary["key_takeaways"],
                sentiment_score=sentiment_score,
                sentiment_label=sentiment_label,
                cluster_key=build_cluster_key(enriched.title),
                related_tickers=extract_related_tickers(analysis_text),
            )

            try:
                with db.begin_nested():
                    db.add(article)
                    db.flush()
            except SQLAlchemyError as exc:
                print(f"Skipping article insert for {enriched.url}: {exc}")
                continue

            seen_urls.add(enriched.url)
            ingested += 1

    db.commit()
    return IngestionResponse(ingested=ingested, duplicates=duplicates, sources=used_sources)
