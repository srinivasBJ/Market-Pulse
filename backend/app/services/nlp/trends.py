import re
from collections import Counter, defaultdict

from app.models.article import Article


def build_cluster_key(title: str) -> str:
    tokens = [
        token
        for token in re.findall(r"[A-Za-z0-9]+", title.lower())
        if token not in {"the", "and", "for", "with", "into", "from", "after", "amid"}
    ]
    return " ".join(tokens[:5])


def trending_topics_from_articles(articles: list[Article]) -> list[dict]:
    clusters = defaultdict(list)
    for article in articles:
        clusters[article.cluster_key or build_cluster_key(article.title)].append(article)

    ranked = sorted(clusters.items(), key=lambda item: len(item[1]), reverse=True)[:6]
    return [
        {
            "topic": key.title(),
            "count": len(items),
            "sentiment": Counter(article.sentiment_label for article in items).most_common(1)[0][0],
            "sources": sorted({article.source for article in items}),
        }
        for key, items in ranked
    ]

