"use client";

import { motion, useReducedMotion } from "motion/react";

const DISCIPLINES = [
  { label: "Language learning", color: "var(--accent-bg)", text: "var(--accent)" },
  { label: "Fitness", color: "#FEF9C3", text: "#854D0E" },        // yellow-100 / yellow-900
  { label: "Personal projects", color: "#EDE9FE", text: "#5B21B6" }, // violet-100 / violet-900
  { label: "Reading", color: "#FEE2E2", text: "#991B1B" },         // red-100 / red-900
  { label: "Writing", color: "#E0F2FE", text: "#075985" },         // sky-100 / sky-900
];

export default function Disciplines() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 5: Full-width horizontal discipline strip.
      A single large statement + a horizontal scroll-snap pill row.
      Background: white, full bleed, separated by borders.
      No eyebrow. No image. Layout is entirely typographic + pill chips.
    */
    <section
      id="disciplines"
      className="section-pad"
      aria-label="Goal disciplines WeekLoop supports"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="container">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "end",
          }}
        >
          {/* Left: headline */}
          <div>
            <h2
              className="text-headline"
              style={{ maxWidth: "22ch" }}
            >
              Built for people with several goals, not one.
            </h2>
          </div>

          {/* Right: discipline pills + supporting text */}
          <div>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                marginBottom: "1.5rem",
                maxWidth: "46ch",
              }}
            >
              Most planners assume one domain. WeekLoop gives each of your
              disciplines its own goal column, so language learning and fitness
              and your side project can all advance in the same week.
            </p>

            {/* Pill row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {DISCIPLINES.map((d) => (
                <span
                  key={d.label}
                  style={{
                    display: "inline-block",
                    padding: "0.3125rem 0.875rem",
                    borderRadius: "var(--radius-pill)",
                    background: d.color,
                    color: d.text,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.label}
                </span>
              ))}
              <span
                style={{
                  display: "inline-block",
                  padding: "0.3125rem 0.875rem",
                  borderRadius: "var(--radius-pill)",
                  background: "transparent",
                  border: "1px dashed var(--border-mid)",
                  color: "var(--text-faint)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                + yours
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile: 1 column */}
      <style>{`
        @media (max-width: 767px) {
          #disciplines [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
