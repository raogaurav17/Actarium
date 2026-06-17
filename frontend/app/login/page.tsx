"use client";

import { useState } from "react";
import { FaBalanceScale, FaGoogle, FaEnvelope, FaLock } from "react-icons/fa";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      setMessage({ type: "error", text: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } =
        mode === "login"
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: mode === "login"
            ? "Signed in successfully! Redirecting..."
            : "Account created! Check your email to confirm your address.",
        });
        if (mode === "login") {
          setTimeout(() => { window.location.href = "/"; }, 1200);
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabaseConfigured) {
      setMessage({ type: "error", text: "Supabase is not configured. Add credentials to .env.local." });
      return;
    }
    const { error } = await signInWithGoogle();
    if (error) setMessage({ type: "error", text: error.message });
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div className="orb" style={{ width: 400, height: 400, background: "var(--color-primary)", top: -100, right: -100 }} />
        <div className="orb" style={{ width: 300, height: 300, background: "var(--color-accent)", bottom: -50, left: -50 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: "3rem", display: "flex", justifyContent: "center" }}><FaBalanceScale /></span>
          <h1 style={{ fontSize: "1.8rem", marginTop: 12 }}>
            <span className="gradient-text">Actarium</span>
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
            Sign in to save chat history & notes
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Mode toggle */}
          <div className="tab-list" style={{ marginBottom: 28 }}>
            <button id="tab-login" className={`tab-btn ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign In</button>
            <button id="tab-signup" className={`tab-btn ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Sign Up</button>
          </div>

          {/* Feedback message */}
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

          {!supabaseConfigured && (
            <div style={{
              padding: "10px 14px",
              marginBottom: 20,
              borderRadius: "var(--radius-sm)",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "var(--color-gold)",
              fontSize: "0.8rem",
            }}>
              Auth is disabled — Supabase not configured. You can still use the app anonymously.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 6 }}>
                <FaEnvelope /> Email
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
              <label htmlFor="password" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 6 }}>
                <FaLock /> Password
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
              onClick={handleGoogle}
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
