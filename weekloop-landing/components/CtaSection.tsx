"use client";

import { motion, useReducedMotion } from "motion/react";

export default function CtaSection() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 8: Full-width centered CTA.
      Dark (zinc-900) section — a single theme switch at page bottom is allowed.
      Deliberately the last content section before footer, not sandwiched.
    */
    <section
      id="cta"
      aria-label="Get started with WeekLoop"
      style={{
        background: "var(--bg-dark)",
        padding: "6rem 0",
        textAlign: "center",
      }}
    >
      <div className="container">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}
        >
          <h2
            style={{
              fontWeight: 560,
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#FAFAFA",
              maxWidth: "22ch",
            }}
          >
            Start this week. Not next month.
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "#A1A1AA",
              maxWidth: "40ch",
              lineHeight: 1.6,
            }}
          >
            Free forever for solo use. No credit card, no trial period, no
            onboarding call.
          </p>
          <a
            href="#pricing"
            id="final-cta"
            className="btn-primary"
            style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}
          >
            Start free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
