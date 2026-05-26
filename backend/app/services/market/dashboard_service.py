from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.article import DashboardResponse
from app.services.market.news_service import _ensure_seed_data, _maybe_refresh_data
from app.services.nlp.trends import trending_topics_from_articles


def build_dashboard(db: Session) -> DashboardResponse:
    _ensure_seed_data(db)
    _maybe_refresh_data(db)
    now = datetime.now(timezone.utc)
    articles = list(db.scalars(select(Article).order_by(desc(Article.published_at)).limit(120)).all())

    today = [article for article in articles if article.published_at.date() == now.date()]
    yesterday_date = (now - timedelta(days=1)).date()
    yesterday = [article for article in articles if article.published_at.date() == yesterday_date]
    weekly = [article for article in articles if article.published_at >= now - timedelta(days=7)]
    monthly = [article for article in articles if article.published_at >= now - timedelta(days=30)]

    sentiments = Counter(article.sentiment_label for article in articles)
    total = max(sum(sentiments.values()), 1)
    sentiment_breakdown = {
        "bullish": round(sentiments.get("bullish", 0) / total * 100, 1),
        "neutral": round(sentiments.get("neutral", 0) / total * 100, 1),
        "bearish": round(sentiments.get("bearish", 0) / total * 100, 1),
    }

    movers = [
        {"name": "BTC", "price": 68420, "change": 2.4},
        {"name": "EUR/USD", "price": 1.0842, "change": -0.3},
        {"name": "Gold", "price": 2361.1, "change": 1.1},
        {"name": "NASDAQ", "price": 18442, "change": 0.7},
    ]

    return DashboardResponse(
        today=today[:12],
        yesterday=yesterday[:12],
        weekly=weekly[:20],
        monthly=monthly[:20],
        trending_topics=trending_topics_from_articles(articles),
        sentiment_breakdown=sentiment_breakdown,
        movers=movers,
    )
