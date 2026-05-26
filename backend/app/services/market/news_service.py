from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.services.market.sample_data import seed_payload
from app.services.nlp.trends import trending_topics_from_articles

_last_refresh_attempt: datetime | None = None


def _ensure_seed_data(db: Session) -> None:
    total = db.scalar(select(func.count()).select_from(Article)) or 0
    if total >= 12:
        return
    existing_urls = set(db.scalars(select(Article.url)).all())
    for payload in seed_payload():
        if payload["url"] in existing_urls:
            continue
        db.add(Article(**payload))
        existing_urls.add(payload["url"])
    db.commit()


def _maybe_refresh_data(db: Session, stale_after_minutes: int = 30, min_attempt_gap_minutes: int = 5) -> None:
    global _last_refresh_attempt

    now = datetime.now(timezone.utc)
    latest_published = db.scalar(select(func.max(Article.published_at)).select_from(Article))
    if latest_published and latest_published >= now - timedelta(minutes=stale_after_minutes):
        return

    if _last_refresh_attempt and _last_refresh_attempt >= now - timedelta(minutes=min_attempt_gap_minutes):
        return

    _last_refresh_attempt = now

    try:
        from app.tasks.ingest import run_ingestion

        run_ingestion(db)
    except Exception as exc:
        db.rollback()
        print(f"Auto-refresh ingestion failed: {exc}")


def get_news_feed(db: Session, query: str | None, category: str | None, limit: int) -> list[Article]:
    _ensure_seed_data(db)
    _maybe_refresh_data(db)
    stmt = select(Article).order_by(desc(Article.published_at)).limit(limit)
    if category:
        stmt = stmt.filter(Article.category == category)
    if query:
        stmt = stmt.filter(
            or_(
                Article.title.ilike(f"%{query}%"),
                Article.overview.ilike(f"%{query}%"),
                Article.excerpt.ilike(f"%{query}%"),
            )
        )
    return list(db.scalars(stmt).all())


def get_trending_clusters(db: Session) -> list[dict]:
    _ensure_seed_data(db)
    articles = list(db.scalars(select(Article).order_by(desc(Article.published_at)).limit(60)).all())
    return trending_topics_from_articles(articles)
