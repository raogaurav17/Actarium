"use client";

import { useState } from "react";
import { FaBalanceScale, FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // TODO: Wire up Supabase Auth here when SUPABASE_URL/KEY are configured
    // For now, show a friendly placeholder message
    setTimeout(() => {
      setMessage({
        type: "success",
        text: mode === "login"
          ? "Authentication coming soon! Configure Supabase credentials to enable login."
          : "Sign-up coming soon! Configure Supabase credentials to enable registration.",
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="orb" style={{ width: 400, height: 400, background: "var(--color-primary)", top: -100, right: -100 }} />
        <div className="orb" style={{ width: 300, height: 300, background: "var(--color-accent)", bottom: -50, left: -50 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: "3rem" }}><FaBalanceScale /></span>
          <h1 style={{ fontSize: "1.8rem", marginTop: 12 }}>
            <span className="gradient-text">Actarium</span>
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
            Sign in to save chat history & notes
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Toggle */}
          <div className="tab-list" style={{ marginBottom: 28 }}>
            <button
              id="tab-login"
              className={`tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              className={`tab-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              marginBottom: 20,
              background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: message.type === "success" ? "#6EE7B7" : "#FCA5A5",
              fontSize: "0.875rem",
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 6 }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 6 }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
              />
            </div>
            <button
              id={`${mode}-submit-btn`}
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 8, width: "100%", justifyContent: "center", padding: "14px" }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: 16 }}>or continue with</p>
            <button
              id="google-oauth-btn"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setMessage({ type: "success", text: "Google OAuth requires Supabase configuration." })}
            >
              <FaGoogle /> Continue with Google
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-muted)", fontSize: "0.8rem" }}>
          You can use Actarium without an account. Sign in to unlock chat history.
        </p>
      </div>
    </div>
  );
}
