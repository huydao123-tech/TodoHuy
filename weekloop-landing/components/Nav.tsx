"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      id="nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 64,
        background: scrolled ? "rgba(250,250,250,0.92)" : "var(--bg)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      <nav
        className="container"
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "var(--accent)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          WeekLoop
        </Link>

        {/* Nav links */}
        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.125rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {[
            { label: "How it works", href: "#how-it-works" },
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
          ].map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "var(--radius)",
                  display: "inline-block",
                  transition: "color 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link
            href="/login"
            id="nav-login"
            style={{
              fontSize: "0.9rem",
              fontWeight: 480,
              color: "var(--text-muted)",
              textDecoration: "none",
              padding: "0.375rem 0.75rem",
              borderRadius: "var(--radius)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            Log in
          </Link>
          <a href="#pricing" className="btn-primary" id="nav-cta">
            Start free
          </a>
        </div>
      </nav>
    </header>
  );
}
