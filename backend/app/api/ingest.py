from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.article import IngestionResponse
from app.tasks.ingest import run_ingestion

router = APIRouter()


@router.post("/run", response_model=IngestionResponse)
def trigger_ingestion(db: Session = Depends(get_db)) -> IngestionResponse:
    return run_ingestion(db)

