from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from app.services.scrapers.models import RawArticle

DEFAULT_TIMEOUT = 12


def parse_html_fallback(source: dict) -> list[RawArticle]:
    response = requests.get(
        source["fallback_url"],
        headers={"User-Agent": "Mozilla/5.0 MarketPulseBot/1.0"},
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "lxml")
    anchors = soup.select("a[href]")[:100]
    seen: set[str] = set()
    articles: list[RawArticle] = []

    for anchor in anchors:
        title = " ".join(anchor.get_text(" ", strip=True).split())
        href = anchor.get("href", "").strip()
        if len(title) < 24 or not href or href in seen:
            continue
        href = urljoin(source["fallback_url"], href)
        seen.add(href)
        articles.append(
            RawArticle(
                title=title,
                source=source["name"],
                url=href,
                category=source["category"],
                published_at=datetime.now(timezone.utc),
            )
        )
        if len(articles) >= 20:
            break
    return articles
