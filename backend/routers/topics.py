"""Topics router — serves pre-generated knowledge cards and topic details."""

from __future__ import annotations

import logging
from pathlib import Path
import json

from fastapi import APIRouter, HTTPException, status

from config import TOPIC_MAP, get_settings
from db.supabase_client import get_all_topics, get_topic_by_slug
from models.schemas import TopicCard, TopicDetail, TopicsResponse, KeyInfo

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/topics", tags=["topics"])


def _load_local_fallback(slug: str) -> dict | None:
    """Load from local JSON fallback when Supabase is unavailable."""
    settings = get_settings()
    path = Path(settings.raw_data_dir).parent / "generated" / f"{slug}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


@router.get("", response_model=TopicsResponse)
async def list_topics() -> TopicsResponse:
    """Return all knowledge cards for the homepage."""
    try:
        rows = get_all_topics()
        if rows:
            cards = [
                TopicCard(
                    slug=r["slug"],
                    name=r["name"],
                    short_description=r.get("short_description", ""),
                    icon=r.get("icon", ""),
                )
                for r in rows
            ]
            return TopicsResponse(topics=cards)
    except Exception as exc:
        logger.warning("Supabase fetch failed, trying local fallback: %s", exc)

    # Fallback: load from local JSON files
    cards = []
    for slug in TOPIC_MAP:
        data = _load_local_fallback(slug)
        if data:
            cards.append(
                TopicCard(
                    slug=data["slug"],
                    name=data["name"],
                    short_description=data.get("short_description", ""),
                    icon=data.get("icon", ""),
                )
            )

    if not cards:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Knowledge base not yet populated. Run seed_pipeline.py first.",
        )
    return TopicsResponse(topics=cards)


@router.get("/{slug}", response_model=TopicDetail)
async def get_topic(slug: str) -> TopicDetail:
    """Return full topic detail: summary, key info, audio URL."""
    if slug not in TOPIC_MAP:
        raise HTTPException(status_code=404, detail="Topic not found")

    row: dict | None = None
    try:
        row = get_topic_by_slug(slug)
    except Exception as exc:
        logger.warning("Supabase fetch failed for %s: %s", slug, exc)

    if not row:
        row = _load_local_fallback(slug)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Topic '{slug}' not yet processed. Run seed_pipeline.py.",
        )

    key_info = KeyInfo(
        key_rights=row.get("key_rights") or [],
        important_provisions=row.get("important_provisions") or [],
        penalties=row.get("penalties") or [],
        who_can_benefit=row.get("who_can_benefit") or [],
    )

    return TopicDetail(
        slug=row["slug"],
        name=row["name"],
        short_description=row.get("short_description", ""),
        summary=row.get("summary", ""),
        key_info=key_info,
        source_url=row.get("source_url", ""),
        audio_url=row.get("audio_url"),
        icon=row.get("icon", ""),
    )
