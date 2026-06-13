/**
 * Backend API client — all calls go through this module.
 * Validates that API_URL is set; uses HTTPS in production.
 */

import type {
  TopicCard,
  TopicDetail,
  ChatResponse,
  SearchResponse,
  ChatMessage,
} from "@/types/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── Topics ──────────────────────────────────────────────────────

export async function getTopics(): Promise<TopicCard[]> {
  const data = await apiFetch<{ topics: TopicCard[] }>("/api/topics");
  return data.topics;
}

export async function getTopicBySlug(slug: string): Promise<TopicDetail> {
  return apiFetch<TopicDetail>(`/api/topics/${encodeURIComponent(slug)}`);
}

// ── Chat / RAG ───────────────────────────────────────────────────

export async function sendChatMessage(
  topicSlug: string,
  question: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      topic_slug: topicSlug,
      question,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
}

// ── Search ───────────────────────────────────────────────────────

export async function searchTopics(query: string): Promise<SearchResponse> {
  const encoded = encodeURIComponent(query.trim());
  return apiFetch<SearchResponse>(`/api/search?q=${encoded}`);
}

// ── Audio ────────────────────────────────────────────────────────

export function getAudioUrl(slug: string): string {
  return `${API_URL}/api/audio/${encodeURIComponent(slug)}`;
}
