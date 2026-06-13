"use client";

import { useEffect, useState } from "react";
import { getTopics } from "@/lib/api";
import type { TopicCard } from "@/types/api";
import { FaBalanceScale, FaRobot, FaSearch, FaHeadphones, FaCommentDots, FaBook, FaGlobe, FaMagic } from "react-icons/fa";

export default function HomePage() {
  const [topics, setTopics] = useState<TopicCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroSection />
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12 }}>
            Legal <span className="gradient-text">Knowledge Cards</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto" }}>
            AI-generated summaries of major Indian laws — made simple for every citizen.
          </p>
        </div>

        {loading && <TopicGridSkeleton />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="topic-grid">
            {topics.map((topic, i) => (
              <KnowledgeCard key={topic.slug} topic={topic} delay={i * 100} />
            ))}
          </div>
        )}
      </section>
      <FeaturesSection />
    </>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: "var(--gradient-hero)",
      padding: "100px 24px 80px",
      textAlign: "center",
    }}>
      {/* Decorative orbs */}
      <div className="orb" style={{ width: 500, height: 500, background: "var(--color-primary)", top: -150, left: -100 }} />
      <div className="orb" style={{ width: 400, height: 400, background: "var(--color-accent)", bottom: -100, right: -50 }} />
      <div className="orb" style={{ width: 300, height: 300, background: "var(--color-gold)", top: "30%", left: "60%" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
        <div className="badge badge-gold animate-fade-in" style={{ marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <FaMagic /> AI-Powered Legal Knowledge
        </div>
        <h1 className="animate-fade-in-up" style={{ marginBottom: 20 }}>
          <span className="gradient-text">Actarium</span>
          <br />
          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
            Library of Legal Acts
          </span>
        </h1>
        <p className="animate-fade-in-up delay-100" style={{
          color: "var(--text-secondary)",
          fontSize: "clamp(1rem,2vw,1.2rem)",
          maxWidth: 600,
          margin: "0 auto 40px",
          lineHeight: 1.7,
        }}>
          Understand your legal rights in plain language. Powered by AI — from POCSO to RTI,
          Consumer Protection to Cyber Law.
        </p>
        <div className="animate-fade-in-up delay-200" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#topics" className="btn btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
            Explore Topics ↓
          </a>
          <a href="/search" className="btn btn-secondary" style={{ fontSize: "1rem", padding: "14px 32px", display: "flex", alignItems: "center", gap: 8 }}>
            <FaSearch /> AI Search
          </a>
        </div>

        {/* Stats bar */}
        <div className="animate-fade-in-up delay-300" style={{
          display: "flex", gap: 40, justifyContent: "center", marginTop: 60, flexWrap: "wrap",
        }}>
          {[
            { num: "5", label: "Legal Acts" },
            { num: "AI", label: "Generated Summaries" },
            { num: "RAG", label: "Powered Q&A" },
            { num: "Free", label: "For Everyone" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", fontWeight: 800 }} className="gradient-text">
                {s.num}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Knowledge Card ──────────────────────────────────────────── */
function KnowledgeCard({ topic, delay }: { topic: TopicCard; delay: number }) {
  return (
    <article
      id={`topic-card-${topic.slug}`}
      className="card animate-fade-in-up"
      style={{
        padding: 28,
        opacity: 0,
        animationDelay: `${delay}ms`,
        animationFillMode: "forwards",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{
          fontSize: "2.2rem",
          background: "rgba(124,58,237,0.15)",
          padding: "10px",
          borderRadius: "12px",
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {topic.icon ? topic.icon : <FaBalanceScale />}
        </span>
        <div>
          <h3 style={{ marginBottom: 4, fontSize: "1.1rem" }}>{topic.name}</h3>
          <span className="badge badge-accent" style={{ fontSize: "0.65rem" }}>AI Generated</span>
        </div>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.7, flex: 1 }}>
        {topic.short_description || "Tap to explore this legal topic and your rights."}
      </p>

      <a
        href={`/topics/${topic.slug}`}
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
        aria-label={`Read more about ${topic.name}`}
      >
        Read More →
      </a>
    </article>
  );
}

/* ── Skeleton Loading ────────────────────────────────────────── */
function TopicGridSkeleton() {
  return (
    <div className="topic-grid" id="topics">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 20, marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 80, marginBottom: 16, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 44, borderRadius: 10 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Error State ─────────────────────────────────────────────── */
function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 24px",
      background: "rgba(239,68,68,0.05)",
      border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: 12, display: "flex", justifyContent: "center" }}><FaBalanceScale /></div>
      <h3 style={{ color: "#F87171", marginBottom: 8 }}>Knowledge base not ready</h3>
      <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.9rem" }}>
        {message}
      </p>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Knowledge base is currently empty.
      </p>
    </div>
  );
}

/* ── Features Strip ──────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon: <FaRobot />, title: "AI-Generated", desc: "Summaries automatically generated from official legal texts" },
    { icon: <FaSearch />, title: "Semantic Search", desc: "Find relevant legal information across all topics instantly" },
    { icon: <FaHeadphones />, title: "Audio Summaries", desc: "Listen to legal summaries hands-free with TTS" },
    { icon: <FaCommentDots />, title: "Ask AI", desc: "RAG-powered Q&A grounded in actual legal documents" },
    { icon: <FaBook />, title: "Source Citations", desc: "Every answer references the actual legal text" },
    { icon: <FaGlobe />, title: "Multi-language", desc: "Summaries available in Hindi and regional languages" },
  ];

  return (
    <section style={{
      background: "var(--bg-surface)",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "80px 24px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2>Why <span className="gradient-text">Actarium</span>?</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Built for every citizen, powered by AI</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {features.map((f, i) => (
            <div key={f.title} className="card animate-fade-in-up" style={{
              padding: 24,
              animationDelay: `${i * 80}ms`,
              opacity: 0,
              animationFillMode: "forwards",
            }}>
              {f.icon && <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{f.icon}</div>}
              <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
