from datetime import datetime

from pydantic import BaseModel, Field


class ArticleOut(BaseModel):
    id: int
    title: str
    source: str
    author: str | None
    url: str
    image_url: str | None
    published_at: datetime
    category: str
    tags: list[str] = Field(default_factory=list)
    excerpt: str | None = None
    short_summary: list[str] = Field(default_factory=list)
    overview: str | None = None
    key_takeaways: list[str] = Field(default_factory=list)
    sentiment_score: float
    sentiment_label: str
    cluster_key: str | None = None
    related_tickers: list[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    today: list[ArticleOut]
    yesterday: list[ArticleOut]
    weekly: list[ArticleOut]
    monthly: list[ArticleOut]
    trending_topics: list[dict]
    sentiment_breakdown: dict[str, float]
    movers: list[dict]


class IngestionResponse(BaseModel):
    ingested: int
    duplicates: int
    sources: list[str]

