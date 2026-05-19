from datetime import datetime, timezone

import feedparser
from dateutil import parser

from app.services.scrapers.models import RawArticle


def parse_rss(source: dict) -> list[RawArticle]:
    if not source.get("rss_url"):
        return []

    feed = feedparser.parse(source["rss_url"])
    articles: list[RawArticle] = []
    for entry in feed.entries[:20]:
        published = None
        if entry.get("published"):
            try:
                published = parser.parse(entry.published)
            except (ValueError, TypeError):
                published = None
        articles.append(
            RawArticle(
                title=entry.get("title", "").strip(),
                source=source["name"],
                url=entry.get("link", "").strip(),
                category=source["category"],
                author=entry.get("author"),
                published_at=published or datetime.now(timezone.utc),
                excerpt=entry.get("summary"),
                tags=[tag.term for tag in entry.get("tags", []) if getattr(tag, "term", None)],
            )
        )
    return [article for article in articles if article.title and article.url]

