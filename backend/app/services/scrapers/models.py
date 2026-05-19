from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawArticle:
    title: str
    source: str
    url: str
    category: str
    author: str | None = None
    published_at: datetime | None = None
    content: str = ""
    excerpt: str | None = None
    tags: list[str] = field(default_factory=list)
    image_url: str | None = None

