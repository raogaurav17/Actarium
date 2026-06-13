# Search router

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from config import TOPIC_MAP
from models.schemas import SearchResponse, SearchResult
from pipeline.embedder import similarity_search

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=300, description="Search query"),
) -> SearchResponse:
    # Semantic search across topics
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty")

    try:
        # Search across ALL topics (no topic_slug filter)
        docs = similarity_search(query, topic_slug=None, k=10)
    except Exception as exc:
        logger.error("Semantic search failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Search service temporarily unavailable.",
        )

    results = []
    seen_slugs: dict[str, int] = {}  # Limit to 3 results per topic for diversity

    for doc in docs:
        slug = doc.metadata.get("topic_slug", "")
        if seen_slugs.get(slug, 0) >= 3:
            continue
        seen_slugs[slug] = seen_slugs.get(slug, 0) + 1

        topic_meta = TOPIC_MAP.get(slug, {})
        results.append(
            SearchResult(
                topic_slug=slug,
                topic_name=topic_meta.get("name", slug),
                excerpt=doc.page_content[:300],
                relevance_score=round(doc.metadata.get("relevance_score", 0.0), 4),
                source_url=doc.metadata.get("source", ""),
            )
        )

    return SearchResponse(results=results, query=query)
