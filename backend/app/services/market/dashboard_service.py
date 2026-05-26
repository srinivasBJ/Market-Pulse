from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.article import DashboardResponse
from app.services.market.news_service import _ensure_seed_data, _maybe_refresh_data
from app.services.nlp.trends import trending_topics_from_articles

TRUSTED_SOURCES = {
    "ForexFactory",
    "Financial Times",
    "Moneycontrol",
    "Investing.com",
    "CoinDesk",
    "CoinGecko",
    "Economic Times Markets",
    "Hacker News",
}


def _article_score(article: Article) -> float:
    score = 0.0
    if article.source in TRUSTED_SOURCES:
        score += 5.0
    score += min(abs(article.sentiment_score), 3.0)
    score += max(0.0, (datetime.now(timezone.utc) - article.published_at).total_seconds() / -3600.0 + 24.0) / 24.0
    if article.sentiment_label == "neutral":
        score -= 0.2
    return score


def _pick_main_by_category(articles: list[Article], limit: int) -> list[Article]:
    chosen: list[Article] = []
    seen_categories: set[str] = set()

    for article in sorted(articles, key=_article_score, reverse=True):
        if article.category in seen_categories:
            continue
        chosen.append(article)
        seen_categories.add(article.category)
        if len(chosen) >= limit:
            break

    if len(chosen) < limit:
        seen_ids = {item.id for item in chosen}
        for article in sorted(articles, key=_article_score, reverse=True):
            if article.id in seen_ids:
                continue
            chosen.append(article)
            if len(chosen) >= limit:
                break

    return chosen


def _pick_weekly_brief(articles: list[Article], max_days: int = 7) -> list[Article]:
    by_day: dict = {}
    for article in sorted(articles, key=_article_score, reverse=True):
        day_key = article.published_at.date()
        if day_key in by_day:
            continue
        by_day[day_key] = article
        if len(by_day) >= max_days:
            break
    return sorted(by_day.values(), key=lambda item: item.published_at, reverse=True)


def build_dashboard(db: Session) -> DashboardResponse:
    _ensure_seed_data(db)
    _maybe_refresh_data(db)
    now = datetime.now(timezone.utc)
    articles = list(db.scalars(select(Article).order_by(desc(Article.published_at)).limit(120)).all())

    today = [article for article in articles if article.published_at.date() == now.date()]
    yesterday_date = (now - timedelta(days=1)).date()
    yesterday_all = [article for article in articles if article.published_at.date() == yesterday_date]
    weekly_all = [article for article in articles if article.published_at >= now - timedelta(days=7)]
    monthly = [article for article in articles if article.published_at >= now - timedelta(days=30)]

    today_main = _pick_main_by_category(today, limit=4)
    yesterday_main = _pick_main_by_category(yesterday_all, limit=4)
    weekly_main = _pick_weekly_brief(weekly_all, max_days=7)

    if today_main:
        lead_today = today_main[0]
        if lead_today.id not in {item.id for item in yesterday_main}:
            yesterday_main = [lead_today, *yesterday_main][:6]
        if lead_today.id not in {item.id for item in weekly_main}:
            weekly_main = [lead_today, *weekly_main][:8]

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
        yesterday=yesterday_main,
        weekly=weekly_main,
        monthly=monthly[:20],
        trending_topics=trending_topics_from_articles(articles),
        sentiment_breakdown=sentiment_breakdown,
        movers=movers,
    )
