from __future__ import annotations

import logging
from functools import lru_cache

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from config import get_settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "actarium_legal"
EMBEDDING_MODEL = "gemini-embedding-001"


@lru_cache(maxsize=1)
def _get_embeddings() -> GoogleGenerativeAIEmbeddings:
    settings = get_settings()
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=settings.gemini_api_key,
        task_type="retrieval_document",
    )


@lru_cache(maxsize=1)
def get_vector_store() -> Chroma:
    settings = get_settings()
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=_get_embeddings(),
        persist_directory=settings.chroma_persist_dir,
        collection_metadata={"hnsw:space": "cosine"},
    )



def get_retriever(topic_slug: str | None = None, k: int = 5):
    # Returns scoped retriever using MMR
    store = get_vector_store()
    search_kwargs: dict = {"k": k, "fetch_k": k * 4}
    if topic_slug:
        search_kwargs["filter"] = {"topic_slug": topic_slug}
    return store.as_retriever(search_type="mmr", search_kwargs=search_kwargs)


def similarity_search(query: str, topic_slug: str | None = None, k: int = 10) -> list[Document]:
    # MMR search for broader context
    store = get_vector_store()
    filter_dict = {"topic_slug": topic_slug} if topic_slug else None
    docs = store.max_marginal_relevance_search(query=query, k=k, fetch_k=k * 4, filter=filter_dict)
    return docs
