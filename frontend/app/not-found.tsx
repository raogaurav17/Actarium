import Link from "next/link";
import { FaBalanceScale } from "react-icons/fa";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      textAlign: "center",
      padding: "40px 24px",
    }}>
      <div style={{ fontSize: "4rem", marginBottom: 16, display: "flex", justifyContent: "center" }}>
        <FaBalanceScale style={{ color: "var(--color-primary-light)" }} />
      </div>
      <h1 style={{ fontSize: "5rem", fontWeight: 800, lineHeight: 1, marginBottom: 16 }} className="gradient-text">
        404
      </h1>
      <h2 style={{ marginBottom: 12 }}>Page not found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 32, maxWidth: 400 }}>
        This page doesn&apos;t exist. Head back to explore legal topics.
      </p>
      <Link href="/" className="btn btn-primary" style={{ padding: "14px 32px" }}>
        ← Back to Home
      </Link>
    </div>
  );
}
