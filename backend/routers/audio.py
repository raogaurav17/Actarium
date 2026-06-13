"""Audio router — serves generated MP3 files as streaming responses."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from config import TOPIC_MAP, get_settings
from models.schemas import AudioStatusResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/status/{slug}", response_model=AudioStatusResponse)
async def audio_status(slug: str) -> AudioStatusResponse:
    """Check if audio is available for a topic."""
    if slug not in TOPIC_MAP:
        raise HTTPException(status_code=404, detail="Topic not found")

    settings = get_settings()
    audio_path = Path(settings.audio_data_dir) / f"{slug}.mp3"

    if audio_path.exists() and audio_path.stat().st_size > 1000:
        return AudioStatusResponse(
            slug=slug,
            audio_url=f"/api/audio/{slug}",
            status="ready",
        )

    return AudioStatusResponse(slug=slug, audio_url=None, status="unavailable")


@router.get("/{slug}")
async def stream_audio(slug: str) -> FileResponse:
    """
    Stream the MP3 audio file for a topic.
    File is served with Content-Disposition: inline for browser playback.
    X-Content-Type-Options: nosniff enforced via middleware.
    """
    if slug not in TOPIC_MAP:
        raise HTTPException(status_code=404, detail="Topic not found")

    settings = get_settings()

    # Sanitize slug — only allow known topic slugs (allow-list)
    # This prevents any path traversal since we only accept known slugs
    audio_path = Path(settings.audio_data_dir) / f"{slug}.mp3"

    # Verify resolved path is within audio_data_dir (defense in depth)
    resolved = audio_path.resolve()
    audio_dir_resolved = Path(settings.audio_data_dir).resolve()
    if not str(resolved).startswith(str(audio_dir_resolved) + "/"):
        raise HTTPException(status_code=400, detail="Invalid path")

    if not audio_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Audio not yet generated for this topic.",
        )

    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename=f"{slug}.mp3",
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=86400",
        },
    )
