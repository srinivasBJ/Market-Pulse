import re

CATEGORY_KEYWORDS = {
    "Crypto": {"bitcoin", "ethereum", "solana", "defi", "token", "etf", "crypto"},
    "Forex": {"usd", "eur", "gbp", "boj", "ecb", "fx", "yen", "currency"},
    "Stocks": {"stock", "equity", "nasdaq", "dow", "earnings", "shares"},
    "Commodities": {"gold", "silver", "oil", "crude", "copper", "natural gas"},
    "Macroeconomics": {"inflation", "gdp", "cpi", "jobs", "recession", "tariff"},
    "Geopolitics": {"war", "sanctions", "election", "iran", "china", "trade"},
    "Central Banks": {"fed", "fomc", "rate cut", "rate hike", "rba", "boj", "ecb"},
}

TICKER_PATTERN = re.compile(r"\b[A-Z]{2,5}\b")


def infer_category(text: str, default: str) -> str:
    lowered = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return category
    return default


def extract_related_tickers(text: str) -> list[str]:
    candidates = TICKER_PATTERN.findall(text)
    common = {"USD", "ETF", "CPI", "GDP", "FED", "ECB", "RBA", "BOJ"}
    return sorted({item for item in candidates if item in common or len(item) <= 4})[:8]

