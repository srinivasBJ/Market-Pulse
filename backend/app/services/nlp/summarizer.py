from __future__ import annotations

import re
from functools import lru_cache

from sumy.nlp.tokenizers import Tokenizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.summarizers.text_rank import TextRankSummarizer

from app.core.config import settings

try:
    from transformers import pipeline
except Exception:  # pragma: no cover
    pipeline = None


def _split_sentences(text: str) -> list[str]:
    return [item.strip() for item in re.split(r"(?<=[.!?])\s+", text) if item.strip()]


@lru_cache(maxsize=1)
def _transformer():
    if not settings.enable_transformer_summary or pipeline is None:
        return None
    return pipeline("summarization", model=settings.transformer_model)


def summarize_text(text: str) -> dict:
    sentences = _split_sentences(text)
    if not sentences:
        return {
            "short_summary": [],
            "overview": None,
            "key_takeaways": [],
        }

    ranked: list[str] = []
    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        textrank = TextRankSummarizer()
        ranked = [str(sentence) for sentence in textrank(parser.document, 4)]
    except LookupError:
        ranked = []

    ranked = ranked or sentences[:4]

    overview = " ".join(ranked[:3])
    bullets = ranked[:3]

    model = _transformer()
    if model and len(text.split()) > 120:
        try:
            result = model(text[:2200], max_length=120, min_length=40, do_sample=False)
            overview = result[0]["summary_text"]
        except Exception:
            pass

    return {
        "short_summary": bullets,
        "overview": overview,
        "key_takeaways": ranked[:4],
    }
