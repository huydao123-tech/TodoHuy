"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "@phosphor-icons/react";
import { useLanguage } from "@/lib/languageContext";

interface ThemeToggleProps {
  size?: "sm" | "md";
  className?: string;
}

export default function ThemeToggle({ size = "md", className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const { t, isVietnamese } = useLanguage();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("weekloop-theme") as "light" | "dark" | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "light";
        setTheme(initial);
        document.documentElement.setAttribute("data-theme", initial);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("weekloop-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    } catch {}
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={theme === "dark" ? (t.lightMode || "Light Mode") : (t.darkMode || "Dark Mode")}
      title={
        theme === "dark"
          ? isVietnamese
            ? "Chuyển sang giao diện sáng"
            : "Switch to Light Mode"
          : isVietnamese
          ? "Chuyển sang giao diện tối"
          : "Switch to Dark Mode"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        background: "var(--bg-alt, #F4F4F5)",
        color: "var(--text)",
        border: "1px solid var(--border, #E4E4E7)",
        borderRadius: "var(--radius-pill, 9999px)",
        padding: isSmall ? "3px 8px" : "5px 12px",
        fontSize: isSmall ? "0.72rem" : "0.8rem",
        cursor: "pointer",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        userSelect: "none",
      }}
    >
      {mounted && theme === "dark" ? (
        <>
          <Sun size={isSmall ? 14 : 16} weight="fill" color="#FBBF24" />
          <span style={{ fontSize: isSmall ? "0.68rem" : "0.75rem", fontWeight: 550 }}>
            {isVietnamese ? "Sáng" : "Light"}
          </span>
        </>
      ) : (
        <>
          <Moon size={isSmall ? 14 : 16} weight="fill" color="#6366F1" />
          <span style={{ fontSize: isSmall ? "0.68rem" : "0.75rem", fontWeight: 550, color: "var(--text-muted)" }}>
            {isVietnamese ? "Tối" : "Dark"}
          </span>
        </>
      )}
    </button>
  );
}
