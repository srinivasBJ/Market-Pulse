from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Market Pulse Atom"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://market:market@localhost:5432/marketpulse"
    frontend_origin: str = "http://localhost:5173"
    enable_transformer_summary: bool = False
    transformer_model: str = "sshleifer/distilbart-cnn-12-6"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

