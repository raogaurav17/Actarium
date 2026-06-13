"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getTopicBySlug, sendChatMessage, getAudioUrl } from "@/lib/api";
import type { TopicDetail, ChatMessage, SourceCitation } from "@/types/api";
import { FaBalanceScale, FaRobot, FaHeadphones, FaFileAlt, FaKey, FaCommentDots, FaLock, FaClipboardList, FaExclamationTriangle, FaUsers, FaUser, FaMicrophone, FaCircle, FaPaperclip, FaDownload, FaPlay, FaPause, FaLightbulb } from "react-icons/fa";

type Tab = "summary" | "keyinfo" | "chat";

export default function TopicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  useEffect(() => {
    if (!slug) return;
    getTopicBySlug(slug)
      .then(setTopic)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <TopicSkeleton />;
  if (error || !topic) return <NotFound error={error} />;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
      {/* Back */}
      <a href="/" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
        ← All Topics
      </a>

      {/* Header */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          {topic.icon ? <span style={{ fontSize: "3rem", display: "flex" }}>{topic.icon}</span> : <span style={{ fontSize: "3rem", display: "flex" }}><FaBalanceScale /></span>}
          <div>
            <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", marginBottom: 6 }}>{topic.name}</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{topic.short_description}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FaBalanceScale /> Legal Act</span>
          <span className="badge badge-accent" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FaRobot /> AI Summarized</span>
          {topic.audio_url && <span className="badge badge-gold" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FaHeadphones /> Audio Available</span>}
          <a href={topic.source_url} target="_blank" rel="noopener noreferrer" className="badge badge-accent" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FaFileAlt /> Official Source ↗
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-list" style={{ marginBottom: 32 }} role="tablist">
        {([
          { id: "summary", label: "Summary", icon: <FaFileAlt /> },
          { id: "keyinfo", label: "Key Information", icon: <FaKey /> },
          { id: "chat",    label: "Ask AI", icon: <FaCommentDots /> },
        ] as const).map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`panel-${t.id}`}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{t.icon} {t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "summary" && (
        <div id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
          <SummaryPanel topic={topic} />
        </div>
      )}
      {activeTab === "keyinfo" && (
        <div id="panel-keyinfo" role="tabpanel" aria-labelledby="tab-keyinfo">
          <KeyInfoPanel topic={topic} />
        </div>
      )}
      {activeTab === "chat" && (
        <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
          <ChatPanel topic={topic} />
        </div>
      )}
    </div>
  );
}

/* ── Summary Panel ───────────────────────────────────────────── */
function SummaryPanel({ topic }: { topic: TopicDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary card */}
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ marginBottom: 20, fontSize: "1.3rem" }}>
          <FaFileAlt /> Plain-Language Summary
          <span className="badge badge-accent" style={{ marginLeft: 12, fontSize: "0.65rem", verticalAlign: "middle" }}>AI Generated</span>
        </h2>
        <div className="prose-legal">
          {topic.summary.split("\n").filter(Boolean).map((para, i) => (
            <p key={i} style={{ marginBottom: i < topic.summary.split("\n").length - 1 ? "1em" : 0 }}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Audio player */}
      {topic.audio_url ? (
        <AudioPlayer slug={topic.slug} topicName={topic.name} />
      ) : (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><FaHeadphones /> Audio summary not yet generated. Run the pipeline to generate it.</p>
        </div>
      )}
    </div>
  );
}

/* ── Audio Player ────────────────────────────────────────────── */
function AudioPlayer({ slug, topicName }: { slug: string; topicName: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioUrl = getAudioUrl(slug);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    audio.currentTime = (x / rect.width) * audio.duration;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="card" style={{ padding: 28 }}>
      <h3 style={{ marginBottom: 20, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}><FaHeadphones /> Audio Summary</h3>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          id={`audio-play-${slug}`}
          onClick={togglePlay}
          className="btn btn-primary"
          style={{ minWidth: 52, height: 52, padding: 0, justifyContent: "center", fontSize: "1.2rem", borderRadius: "50%", flexShrink: 0 }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <FaPause /> : <FaPlay />}
        </button>
        <div style={{ flex: 1 }}>
          <div
            className="audio-bar"
            onClick={handleSeek}
            style={{ marginBottom: 8, cursor: "pointer" }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="audio-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <a
          href={audioUrl}
          download={`${slug}.mp3`}
          className="btn btn-ghost"
          style={{ fontSize: "0.8rem", padding: "8px 14px" }}
          aria-label="Download audio"
        >
          <FaDownload /> Download
        </a>
      </div>
    </div>
  );
}

/* ── Key Info Panel ──────────────────────────────────────────── */
function KeyInfoPanel({ topic }: { topic: TopicDetail }) {
  const { key_info } = topic;

  const sections = [
    { title: "Key Rights", icon: <FaLock />, items: key_info.key_rights, color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)" },
    { title: "Important Provisions", icon: <FaClipboardList />, items: key_info.important_provisions, color: "#06B6D4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)" },
    { title: "Penalties", icon: <FaExclamationTriangle />, items: key_info.penalties, color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
    { title: "Who Can Benefit", icon: <FaUsers />, items: key_info.who_can_benefit, color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  ];

  return (
    <div className="key-info-grid">
      {sections.map((section) => (
        <div key={section.title} className="card animate-fade-in-up" style={{
          padding: 24,
          borderColor: section.border,
          background: section.bg,
        }}>
          <h3 style={{ color: section.color, marginBottom: 16, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>{section.icon} {section.title}</h3>
          {section.items.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Processing...</p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <span style={{ color: section.color, flexShrink: 0, marginTop: 2 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Chat Panel (RAG) ────────────────────────────────────────── */
function ChatPanel({ topic }: { topic: TopicDetail }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech-to-text
  const [listening, setListening] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(topic.slug, q, messages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting to the AI service. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, topic.slug]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const startListening = () => {
    // Web Speech API — bonus feature
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = "en-IN";
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
    };
    recog.start();
  };

  const suggestions = [
    `What are the key rights under ${topic.name}?`,
    `What penalties are defined?`,
    `Who can file a complaint?`,
  ];

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: 600 }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", background: "rgba(124,58,237,0.05)" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><FaCommentDots /> Ask AI about {topic.name}</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Answers are grounded in the official legal text · RAG-powered</p>
      </div>

      {/* Messages */}
      <div className="chat-scroll" style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12, display: "flex", justifyContent: "center" }}><FaBalanceScale /></div>
            <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.9rem" }}>
              Ask anything about {topic.name}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 16px",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.15)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.08)"; }}
                >
                  <FaLightbulb style={{ marginRight: 6, display: "inline-block" }} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <span style={{ fontSize: "1.2rem", flexShrink: 0, display: "flex" }}>{msg.role === "user" ? <FaUser /> : <FaBalanceScale />}</span>
              <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                {msg.content}
              </div>
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "85%", marginLeft: 32 }}>
                {msg.sources.map((src, j) => (
                  <CitationCard key={j} citation={src} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: "1.2rem", display: "flex" }}><FaBalanceScale /></span>
            <div className="chat-bubble-assistant" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", animationDelay: "0ms" }} />
              <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", animationDelay: "200ms" }} />
              <span className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", animationDelay: "400ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 10 }}>
        <input
          ref={inputRef}
          id="chat-input"
          className="input"
          placeholder="Ask about your legal rights..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          maxLength={500}
          aria-label="Chat input"
        />
        <button
          onClick={startListening}
          className="btn btn-ghost"
          style={{ padding: "0 14px", fontSize: "1.1rem", flexShrink: 0 }}
          title="Voice input"
          aria-label="Voice input"
        >
          {listening ? <FaCircle style={{ color: "red" }} /> : <FaMicrophone />}
        </button>
        <button
          id="chat-send-btn"
          onClick={send}
          disabled={!input.trim() || loading}
          className="btn btn-primary"
          style={{ flexShrink: 0, padding: "0 20px" }}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ── Citation Card ───────────────────────────────────────────── */
function CitationCard({ citation }: { citation: SourceCitation }) {
  return (
    <div className="citation-card">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ display: "flex" }}><FaPaperclip /></span>
        <span style={{ fontWeight: 600 }}>{citation.section}</span>
        <a
          href={citation.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontSize: "0.75rem" }}
        >
          View ↗
        </a>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.5 }}>
        {citation.excerpt}
      </p>
    </div>
  );
}

/* ── Loading Skeleton ────────────────────────────────────────── */
function TopicSkeleton() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
      <div className="skeleton" style={{ height: 20, width: 80, marginBottom: 32 }} />
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 16 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 32, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 18, width: "70%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 56, marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );
}

function NotFound({ error }: { error: string | null }) {
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16, display: "flex", justifyContent: "center" }}><FaBalanceScale /></div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Topic not found</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>{error ?? "This topic hasn't been processed yet."}</p>
      <a href="/" className="btn btn-primary">← Back to Topics</a>
    </div>
  );
}
