"""
Pydantic schemas for Actarium API.
All inputs are validated and length-capped to prevent injection / DoS.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field, field_validator
import re


# ---------------------------------------------------------------------------
# Topic schemas
# ---------------------------------------------------------------------------

class KeyInfo(BaseModel):
    key_rights: list[str] = Field(default_factory=list)
    important_provisions: list[str] = Field(default_factory=list)
    penalties: list[str] = Field(default_factory=list)
    who_can_benefit: list[str] = Field(default_factory=list)


class TopicCard(BaseModel):
    slug: str
    name: str
    short_description: str
    icon: str = ""


class TopicDetail(BaseModel):
    slug: str
    name: str
    short_description: str
    summary: str
    key_info: KeyInfo
    source_url: str
    audio_url: str | None = None
    icon: str = ""


class TopicsResponse(BaseModel):
    topics: list[TopicCard]


# ---------------------------------------------------------------------------
# Chat / RAG schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    topic_slug: str = Field(..., min_length=1, max_length=100)
    question: str = Field(..., min_length=1, max_length=500)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)

    @field_validator("topic_slug")
    @classmethod
    def slug_alphanumeric(cls, v: str) -> str:
        # Allow only slug-safe characters
        if not re.match(r"^[a-z0-9\-]+$", v):
            raise ValueError("Invalid topic slug")
        return v

    @field_validator("question")
    @classmethod
    def sanitize_question(cls, v: str) -> str:
        # Strip leading/trailing whitespace; reject empty after strip
        v = v.strip()
        if not v:
            raise ValueError("Question must not be empty")
        return v


class SourceCitation(BaseModel):
    section: str
    source_url: str
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceCitation] = Field(default_factory=list)
    topic_slug: str


# ---------------------------------------------------------------------------
# Search schemas
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=300)

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        return v.strip()


class SearchResult(BaseModel):
    topic_slug: str
    topic_name: str
    excerpt: str
    relevance_score: float
    source_url: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str


# ---------------------------------------------------------------------------
# Audio schemas
# ---------------------------------------------------------------------------

class AudioStatusResponse(BaseModel):
    slug: str
    audio_url: str | None
    status: str  # "ready" | "generating" | "unavailable"


# ---------------------------------------------------------------------------
# Error schema
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    detail: str
    code: str = "INTERNAL_ERROR"
