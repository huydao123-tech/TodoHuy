"use client";

import { useLanguage } from "@/lib/languageContext";

interface LanguageToggleProps {
  size?: "sm" | "md";
  className?: string;
}

export default function LanguageToggle({ size = "md", className = "" }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  const isSmall = size === "sm";

  return (
    <div
      className={`language-pill-toggle ${className}`}
      role="group"
      aria-label="Chọn ngôn ngữ"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--bg-alt, #F4F4F5)",
        borderRadius: "var(--radius-pill, 9999px)",
        border: "1px solid var(--border, #E4E4E7)",
        padding: "2px",
        userSelect: "none",
      }}
    >
      <button
        type="button"
        onClick={() => setLang("vi")}
        aria-pressed={lang === "vi"}
        title="Tiếng Việt"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          border: "none",
          cursor: "pointer",
          borderRadius: "var(--radius-pill, 9999px)",
          padding: isSmall ? "2px 7px" : "4px 10px",
          fontSize: isSmall ? "0.6875rem" : "0.75rem",
          fontWeight: lang === "vi" ? 620 : 500,
          background: lang === "vi" ? "#FFFFFF" : "transparent",
          color: lang === "vi" ? "var(--text, #18181B)" : "var(--text-muted, #71717A)",
          boxShadow: lang === "vi" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
          transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          lineHeight: 1.2,
        }}
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>

      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        title="English"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          border: "none",
          cursor: "pointer",
          borderRadius: "var(--radius-pill, 9999px)",
          padding: isSmall ? "2px 7px" : "4px 10px",
          fontSize: isSmall ? "0.6875rem" : "0.75rem",
          fontWeight: lang === "en" ? 620 : 500,
          background: lang === "en" ? "#FFFFFF" : "transparent",
          color: lang === "en" ? "var(--text, #18181B)" : "var(--text-muted, #71717A)",
          boxShadow: lang === "en" ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
          transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          lineHeight: 1.2,
        }}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
