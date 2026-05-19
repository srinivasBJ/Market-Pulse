from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.db.session import get_db
from app.schemas.article import DashboardResponse
from app.services.market.dashboard_service import build_dashboard

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    return build_dashboard(db)

