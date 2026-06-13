"use client";

import { useState, useCallback, useRef } from "react";
import { searchTopics } from "@/lib/api";
import type { SearchResult } from "@/types/api";
import { FaShieldAlt, FaUserTie, FaLock, FaFileContract, FaRupeeSign, FaBalanceScale, FaSearch, FaMicrophone, FaExclamationTriangle, FaCommentDots, FaFileAlt } from "react-icons/fa";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  "pocso-act": <FaShieldAlt />,
  "consumer-protection-act": <FaUserTie />,
  "cyber-crime-laws": <FaLock />,
  "rti-act": <FaFileContract />,
  "gst-registration": <FaRupeeSign />,
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchTopics(q);
      setResults(res.results);
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch(query);
  };

  // Voice search
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN";
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setQuery(t);
      doSearch(t);
    };
    r.start();
  };

  const suggestions = [
    "consumer rights",
    "punishment for cyber fraud",
    "how to file RTI",
    "GST registration process",
    "POCSO penalties",
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ marginBottom: 12 }}>
          <FaSearch /> <span className="gradient-text">AI Legal Search</span>
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Semantic search across all 5 legal topics — powered by vector embeddings
        </p>
      </div>

      {/* Search box */}
      <div className="card" style={{ padding: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            ref={inputRef}
            id="search-input"
            className="input"
            placeholder="e.g. 'punishment for cyber fraud' or 'consumer complaint process'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            maxLength={300}
            aria-label="Search query"
          />
          <button
            onClick={startVoice}
            className="btn btn-ghost"
            style={{ fontSize: "1.1rem", padding: "0 14px", flexShrink: 0 }}
            title="Voice search"
            aria-label="Voice search"
          >
            <FaMicrophone />
          </button>
          <button
            id="search-btn"
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
            aria-label="Search"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Suggestions */}
        {!searched && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: 10 }}>Try searching for:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "999px",
                    padding: "6px 14px",
                    color: "var(--text-secondary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && <SearchSkeleton />}

      {error && (
        <div style={{ textAlign: "center", padding: 32, color: "#F87171" }}>
          <FaExclamationTriangle size={32} style={{ marginBottom: 12 }} />
          {error}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12, display: "flex", justifyContent: "center" }}><FaSearch /></div>
          <p>No results found for &ldquo;{query}&rdquo;</p>
          <p style={{ fontSize: "0.875rem", marginTop: 8 }}>Try different keywords or browse the topics directly.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 20 }}>
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {results.map((r, i) => (
              <SearchResultCard key={i} result={r} query={query} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result, query }: { result: SearchResult; query: string }) {
  const score = Math.round(result.relevance_score * 100);
  const icon = TOPIC_ICONS[result.topic_slug] ?? <FaBalanceScale />;

  return (
    <article className="card animate-fade-in-up" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.4rem", display: "flex" }}>{icon}</span>
          <div>
            <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>{result.topic_name}</span>
          </div>
        </div>
        <div style={{ display: "flex", verticalAlign: "center", gap: 8 }}>
          <span className="badge badge-accent" style={{ fontSize: "0.7rem" }}>
            {score}% match
          </span>
        </div>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>
        {result.excerpt}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href={`/topics/${result.topic_slug}`}
          className="btn btn-primary"
          style={{ fontSize: "0.85rem", padding: "8px 18px" }}
        >
          Read Topic →
        </a>
        <a
          href={`/topics/${result.topic_slug}#panel-chat`}
          className="btn btn-secondary"
          style={{ fontSize: "0.85rem", padding: "8px 18px" }}
        >
          <FaCommentDots /> Ask AI
        </a>
        <a
          href={result.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          style={{ fontSize: "0.85rem", padding: "8px 18px" }}
        >
          <FaFileAlt /> Source ↗
        </a>
      </div>
    </article>
  );
}

function SearchSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 24, width: 160 }} />
          </div>
          <div className="skeleton" style={{ height: 80, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <div className="skeleton" style={{ height: 36, width: 120, borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 36, width: 100, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
