from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_article_schema() -> None:
    text_columns = ("title", "source", "author", "url", "image_url", "cluster_key")

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "articles" not in inspector.get_table_names():
            return

        for column in text_columns:
            conn.exec_driver_sql(f"ALTER TABLE articles ALTER COLUMN {column} TYPE TEXT")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
