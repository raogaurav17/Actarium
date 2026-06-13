import type { Metadata } from "next";
import "./globals.css";
import { FaBalanceScale, FaSearch } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Actarium — Library of Legal Acts",
  description:
    "AI-powered legal knowledge centre. Browse, understand, and ask questions about Indian laws including POCSO, RTI, Consumer Protection, Cyber Crime, and GST.",
  keywords: ["legal", "India", "RTI", "POCSO", "consumer rights", "cyber law", "GST", "AI"],
  openGraph: {
    title: "Actarium — Library of Legal Acts",
    description: "Understand your legal rights with AI-powered summaries and Q&A",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function NavBar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.5rem" }}><FaBalanceScale /></span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.2rem" }}>
            <span className="gradient-text">Actarium</span>
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/search" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            <FaSearch /> Search
          </a>
          <a href="/" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
            Topics
          </a>
          <a href="/login" className="btn btn-secondary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-subtle)",
      padding: "40px 24px",
      marginTop: 80,
      textAlign: "center",
      color: "var(--text-muted)",
      fontSize: "0.85rem",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }} className="gradient-text">Actarium</span>
          {" "} — Library of Legal Acts
        </p>
        <p>AI-generated summaries are for informational purposes only. Always consult a qualified lawyer for legal advice.</p>
        <p style={{ marginTop: 16, color: "var(--text-muted)" }}>
          Sources: India Code · RTI.gov.in · Consumer Affairs · GST.gov.in
        </p>
      </div>
    </footer>
  );
}
