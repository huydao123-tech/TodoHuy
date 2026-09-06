"use client";

import { motion, useReducedMotion } from "motion/react";

export default function Manifesto() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 2: Full-width centered editorial text.
      Large display statement, no section header, no eyebrow.
      Background: zinc-100 tint for contrast within same light theme.
    */
    <section
      id="manifesto"
      aria-label="Product philosophy"
      style={{
        background: "var(--bg-alt)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "5rem 0",
        textAlign: "center",
      }}
    >
      <div className="container">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: "-0.025em",
            color: "var(--text)",
            maxWidth: "32ch",
            marginInline: "auto",
          }}
        >
          Most apps track tasks.{" "}
          <span style={{ color: "var(--text-muted)" }}>
            WeekLoop tracks weeks.
          </span>
        </motion.p>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: "1.25rem",
            fontSize: "1rem",
            color: "var(--text-muted)",
            maxWidth: "44ch",
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          A completed task is noise without context. A completed week is a unit
          of meaningful progress.
        </motion.p>
      </div>
    </section>
  );
}
