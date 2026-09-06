"use client";

import Link from "next/link";

const LINKS = {
  Product: ["How it works", "Features", "Pricing", "Changelog"],
  Learn: ["Documentation", "Blog", "Templates"],
  Legal: ["Privacy", "Terms"],
};

export default function Footer() {
  return (
    /*
      LAYOUT FAMILY 9: Multi-column footer.
      Dark zinc-900 continues from CtaSection (same theme zone).
      Link columns: Product, Learn, Legal.
    */
    <footer
      id="footer"
      aria-label="Site footer"
      style={{
        background: "var(--bg-dark)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "3rem 0 2.5rem",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr repeat(3, 1fr)",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "var(--accent)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "#FAFAFA",
                  letterSpacing: "-0.02em",
                }}
              >
                WeekLoop
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#71717A", lineHeight: 1.6, maxWidth: "26ch" }}>
              Personal planning on a rolling three-week cycle.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.6875rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#52525B",
                  marginBottom: "1rem",
                }}
              >
                {group}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        fontSize: "0.875rem",
                        color: "#A1A1AA",
                        textDecoration: "none",
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#FAFAFA";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "#A1A1AA";
                      }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "#52525B" }}>
            2026 WeekLoop. All rights reserved.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#52525B" }}>
            Made for people who take the long view.
          </p>
        </div>
      </div>

      {/* Mobile: 2-column footer grid */}
      <style>{`
        @media (max-width: 640px) {
          #footer [style*="grid-template-columns: 2fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
          #footer [style*="grid-template-columns: 2fr"] > div:first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </footer>
  );
}
