from fastapi import APIRouter

from app.api import dashboard, ingest, news

router = APIRouter()
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
router.include_router(news.router, prefix="/news", tags=["news"])
router.include_router(ingest.router, prefix="/ingest", tags=["ingestion"])

