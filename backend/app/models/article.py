from datetime import datetime

from sqlalchemy import DateTime, Float, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Article(Base):
    __tablename__ = "articles"
    __table_args__ = (
        Index("ix_articles_published_at", "published_at"),
        Index("ix_articles_category", "category"),
        Index("ix_articles_cluster_key", "cluster_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    author: Mapped[str | None] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(1000), unique=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000))
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    excerpt: Mapped[str | None] = mapped_column(Text)
    short_summary: Mapped[list[str]] = mapped_column(JSONB, default=list)
    overview: Mapped[str | None] = mapped_column(Text)
    key_takeaways: Mapped[list[str]] = mapped_column(JSONB, default=list)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_label: Mapped[str] = mapped_column(String(20), default="neutral")
    cluster_key: Mapped[str | None] = mapped_column(String(255))
    related_tickers: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

