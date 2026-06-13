from __future__ import annotations

import logging
import uuid
from typing import TypedDict

from fastapi import APIRouter, HTTPException, Request, status
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from config import TOPIC_MAP
from db.supabase_client import save_chat_message, get_chat_history
from models.schemas import ChatRequest, ChatResponse, SourceCitation
from pipeline.embedder import get_retriever
from pipeline.generator import build_rag_chain_with_sources

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

_memory = MemorySaver()


class RAGAgentState(TypedDict):
    question: str
    topic_slug: str
    topic_name: str
    retrieved_docs: list[Document]
    answer: str
    sources: list[dict]
    chat_history: list[BaseMessage]
    retry_count: int


def retrieve_node(state: RAGAgentState) -> RAGAgentState:
    retriever = get_retriever(topic_slug=state["topic_slug"], k=5)
    docs = retriever.invoke(state["question"])
    return {**state, "retrieved_docs": docs}


def generate_node(state: RAGAgentState) -> RAGAgentState:
    topic_meta = TOPIC_MAP.get(state["topic_slug"], {})
    retriever = get_retriever(topic_slug=state["topic_slug"], k=5)
    rag_chain = build_rag_chain_with_sources(retriever)

    response = rag_chain.invoke({
        "input": state["question"],
        "chat_history": state.get("chat_history", []),
    })

    answer: str = response.get("answer", "")
    source_docs: list[Document] = response.get("context", [])

    seen: set[str] = set()
    sources: list[dict] = []
    for doc in source_docs[:3]:
        url = doc.metadata.get("source", "")
        if url and url not in seen:
            sources.append({
                "section": topic_meta.get("full_name", state["topic_name"]),
                "source_url": url,
                "excerpt": doc.page_content[:150] + "...",
            })
            seen.add(url)

    return {**state, "answer": answer, "sources": sources}


def validate_node(state: RAGAgentState) -> RAGAgentState:
    # Retry if answer is too short
    answer = state.get("answer", "")
    retry = state.get("retry_count", 0)
    if len(answer.strip()) < 30 and retry < 1:
        return {**state, "retry_count": retry + 1}
    return state


def _should_retry(state: RAGAgentState) -> str:
    if len(state.get("answer", "").strip()) < 30 and state.get("retry_count", 0) < 1:
        return "retry"
    return "done"


def _build_rag_graph() -> StateGraph:
    graph = StateGraph(RAGAgentState)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("generate", generate_node)
    graph.add_node("validate", validate_node)
    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges("validate", _should_retry, {"done": END, "retry": "generate"})
    return graph.compile(checkpointer=_memory)


_rag_graph = _build_rag_graph()


def _session_id(topic_slug: str, request: Request) -> str:
    # Session key from IP and topic
    client_ip = request.client.host if request.client else "unknown"
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{client_ip}:{topic_slug}"))


def _to_lc_messages(history: list) -> list[BaseMessage]:
    msgs: list[BaseMessage] = []
    for m in history[-10:]:
        if m.get("role") == "user":
            msgs.append(HumanMessage(content=m["content"]))
        elif m.get("role") == "assistant":
            msgs.append(AIMessage(content=m["content"]))
    return msgs


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    slug = payload.topic_slug
    if slug not in TOPIC_MAP:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic = TOPIC_MAP[slug]
    lc_history = _to_lc_messages([m.model_dump() for m in payload.history])
    session_id = _session_id(slug, request)
    thread_config = {"configurable": {"thread_id": session_id}}

    initial: RAGAgentState = {
        "question": payload.question,
        "topic_slug": slug,
        "topic_name": topic.get("name", slug),
        "retrieved_docs": [],
        "answer": "",
        "sources": [],
        "chat_history": lc_history,
        "retry_count": 0,
    }

    try:
        final = _rag_graph.invoke(initial, config=thread_config)
    except Exception as exc:
        logger.error("RAG agent failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again.",
        )

    answer = final.get("answer") or (
        "I couldn't find relevant information. "
        "Please rephrase your question or consult a qualified lawyer."
    )
    sources = [SourceCitation(**s) for s in final.get("sources", [])]

    try:
        save_chat_message(session_id, "user", payload.question, [])
        save_chat_message(session_id, "assistant", answer, [s.model_dump() for s in sources])
    except Exception:
        pass  # non-fatal

    return ChatResponse(answer=answer, sources=sources, topic_slug=slug)


@router.get("/history/{topic_slug}", response_model=list[dict])
async def get_history(topic_slug: str, request: Request) -> list[dict]:
    if topic_slug not in TOPIC_MAP:
        raise HTTPException(status_code=404, detail="Topic not found")
    session_id = _session_id(topic_slug, request)
    try:
        return get_chat_history(session_id, limit=20)
    except Exception as exc:
        logger.warning("History fetch failed: %s", exc)
        return []
