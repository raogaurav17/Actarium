"""
Supabase client — structured data storage for topic cards.
Uses the Supabase Python SDK (supabase-py).
"""

from __future__ import annotations

import logging
from functools import lru_cache

from supabase import create_client, Client

from config import get_settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment."
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)


def upsert_topic(data: dict) -> None:
    """Upsert topic data into the topics table."""
    try:
        client = get_supabase()
        client.table("topics").upsert(data, on_conflict="slug").execute()
        logger.info("Upserted topic: %s", data.get("slug"))
    except Exception as exc:
        logger.error("Supabase upsert failed for %s: %s", data.get("slug"), exc)
        raise


def get_all_topics() -> list[dict]:
    """Fetch all topics (knowledge cards)."""
    client = get_supabase()
    result = client.table("topics").select(
        "slug, name, short_description, icon"
    ).execute()
    return result.data or []


def get_topic_by_slug(slug: str) -> dict | None:
    """Fetch full topic detail by slug."""
    client = get_supabase()
    result = (
        client.table("topics")
        .select("*")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def save_chat_message(session_id: str, role: str, content: str, sources: list) -> None:
    """Persist a chat message to Supabase."""
    try:
        client = get_supabase()
        client.table("chat_messages").insert(
            {
                "session_id": session_id,
                "role": role,
                "content": content,
                "sources": sources,
            }
        ).execute()
    except Exception as exc:
        logger.warning("Failed to save chat message: %s", exc)
        # Non-fatal — chat still works without persistence


def get_chat_history(session_id: str, limit: int = 20) -> list[dict]:
    """Fetch recent chat messages for a session."""
    try:
        client = get_supabase()
        result = (
            client.table("chat_messages")
            .select("role, content, sources, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as exc:
        logger.warning("Failed to fetch chat history: %s", exc)
        return []
