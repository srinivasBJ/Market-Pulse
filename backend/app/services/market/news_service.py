from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.services.market.sample_data import seed_payload
from app.services.nlp.trends import trending_topics_from_articles


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


def get_news_feed(db: Session, query: str | None, category: str | None, limit: int) -> list[Article]:
    _ensure_seed_data(db)
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
