from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.article import ArticleOut
from app.services.market.news_service import get_news_feed, get_trending_clusters

router = APIRouter()


@router.get("", response_model=list[ArticleOut])
def list_news(
    db: Session = Depends(get_db),
    query: str | None = None,
    category: str | None = None,
    limit: int = Query(default=30, le=100),
) -> list[ArticleOut]:
    return get_news_feed(db=db, query=query, category=category, limit=limit)


@router.get("/trending")
def trending_news(db: Session = Depends(get_db)) -> list[dict]:
    return get_trending_clusters(db)

