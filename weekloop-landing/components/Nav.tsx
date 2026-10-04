"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/languageContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t, isVietnamese } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsub();
    };
  }, []);

  return (
    <header
      id="nav"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 64,
        background: scrolled ? "var(--nav-bg-scrolled, var(--bg))" : "var(--bg)",
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
          <ThemeToggle size="sm" />
          <LanguageToggle size="sm" />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="btn-primary"
              id="nav-dashboard"
              style={{ fontSize: "0.84rem", padding: "0.38rem 0.8rem", whiteSpace: "nowrap" }}
            >
              {isVietnamese ? "Vào Bảng điều khiển" : "Dashboard"}
            </Link>
          ) : (
            <>
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
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
              >
                {t.login}
              </Link>
              <Link href="/login" className="btn-primary" id="nav-cta" style={{ whiteSpace: "nowrap" }}>
                {t.signUp}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
