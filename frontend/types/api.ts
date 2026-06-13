// API types matching the FastAPI backend schemas

export interface TopicCard {
  slug: string;
  name: string;
  short_description: string;
  icon: string;
}

export interface KeyInfo {
  key_rights: string[];
  important_provisions: string[];
  penalties: string[];
  who_can_benefit: string[];
}

export interface TopicDetail {
  slug: string;
  name: string;
  short_description: string;
  summary: string;
  key_info: KeyInfo;
  source_url: string;
  audio_url: string | null;
  icon: string;
}

export interface SourceCitation {
  section: string;
  source_url: string;
  excerpt: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  topic_slug: string;
}

export interface SearchResult {
  topic_slug: string;
  topic_name: string;
  excerpt: string;
  relevance_score: number;
  source_url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
}
