BULLISH_TERMS = {
    "surge",
    "rally",
    "gain",
    "beat",
    "optimistic",
    "approval",
    "growth",
    "breakout",
    "upside",
    "record",
}
BEARISH_TERMS = {
    "crash",
    "drop",
    "slump",
    "selloff",
    "risk",
    "downgrade",
    "uncertain",
    "fear",
    "loss",
    "decline",
}


def score_sentiment(text: str) -> tuple[float, str]:
    tokens = [token.strip(".,:;!?").lower() for token in text.split()]
    if not tokens:
        return 0.0, "neutral"

    bullish = sum(1 for token in tokens if token in BULLISH_TERMS)
    bearish = sum(1 for token in tokens if token in BEARISH_TERMS)
    score = (bullish - bearish) / max(len(tokens), 1) * 20
    if score > 0.08:
        return round(score, 3), "bullish"
    if score < -0.08:
        return round(score, 3), "bearish"
    return round(score, 3), "neutral"

