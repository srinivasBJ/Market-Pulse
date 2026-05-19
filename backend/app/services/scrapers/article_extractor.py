import re
from collections import OrderedDict

import requests
from bs4 import BeautifulSoup

from app.services.scrapers.models import RawArticle


def _dedupe_paragraphs(text: str) -> str:
    parts = [segment.strip() for segment in text.split("\n") if segment.strip()]
    unique = OrderedDict((re.sub(r"\s+", " ", item), None) for item in parts)
    return "\n".join(unique.keys())


def _fallback_extract(raw: RawArticle) -> RawArticle:
    response = requests.get(
        raw.url,
        headers={"User-Agent": "Mozilla/5.0 MarketPulseBot/1.0"},
        timeout=12,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "lxml")

    paragraphs = [
        " ".join(node.get_text(" ", strip=True).split())
        for node in soup.select("article p, main p, .article p, .post-content p, p")
    ]
    content = _dedupe_paragraphs("\n".join(paragraphs))

    raw.content = content
    raw.excerpt = raw.excerpt or (content[:280] if content else None)
    if not raw.author:
        author_meta = soup.select_one('meta[name="author"], meta[property="author"]')
        raw.author = author_meta.get("content") if author_meta else None
    if not raw.image_url:
        image_meta = soup.select_one('meta[property="og:image"], meta[name="twitter:image"]')
        raw.image_url = image_meta.get("content") if image_meta else None
    return raw


def enrich_article(raw: RawArticle) -> RawArticle:
    try:
        from newspaper import Article as NewspaperArticle

        article = NewspaperArticle(raw.url)
        article.download()
        article.parse()

        content = _dedupe_paragraphs(article.text or raw.content)
        cleaned_content = re.sub(r"\n{2,}", "\n\n", content).strip()
        raw.content = cleaned_content
        raw.author = raw.author or ", ".join(article.authors) or None
        raw.excerpt = raw.excerpt or (cleaned_content[:280] if cleaned_content else None)
        raw.image_url = raw.image_url or article.top_image or None
        raw.tags = sorted(set(raw.tags + list(article.keywords or [])))
        return raw
    except Exception:
        return _fallback_extract(raw)
