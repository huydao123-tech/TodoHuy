"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export default function Hero() {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    /*
      LAYOUT FAMILY 1: Asymmetric Split
      55% text column (left), 45% product image (right).
      Left-aligned, anti-center bias per Section 4.3.
    */
    <section
      id="hero"
      aria-label="Hero"
      style={{
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        alignItems: "center",
        padding: "4rem 0 3rem",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
      >
        {/* Left: text column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <motion.h1
            className="text-display"
            {...fadeUp(0)}
            style={{ maxWidth: "20ch" }}
          >
            Plan your week.{" "}
            <span style={{ color: "var(--text-muted)" }}>Protect your goals.</span>
          </motion.h1>

          <motion.p
            className="text-body-lg"
            {...fadeUp(0.08)}
            style={{ maxWidth: "46ch" }}
          >
            Last week, this week, and next week visible at once. Long-term goals
            stay in view, never buried by the daily noise.
          </motion.p>

          <motion.div
            {...fadeUp(0.16)}
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
          >
            <a href="#pricing" className="btn-primary" id="hero-cta">
              Start free
            </a>
            <a href="#how-it-works" className="btn-ghost" id="hero-secondary">
              See how it works
            </a>
          </motion.div>

          {/* Stat strip (below CTAs — NOT inside the hero text stack, separated visually) */}
          <motion.div
            {...fadeUp(0.22)}
            style={{
              display: "flex",
              gap: "2rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border)",
              marginTop: "0.5rem",
            }}
          >
            {[
              { value: "3 weeks", label: "Always in view" },
              { value: "1 place", label: "Goals and side tasks" },
              { value: "Weekly", label: "Rolling review" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontWeight: 580,
                    fontSize: "1.125rem",
                    letterSpacing: "-0.02em",
                    color: "var(--accent)",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{ fontSize: "0.8125rem", color: "var(--text-faint)", marginTop: 2 }}
                >
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: product image */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, x: 24 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const },
              })}
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 32px rgba(24,24,27,0.06), 0 1px 4px rgba(24,24,27,0.04)",
            background: "var(--card-bg, #fff)",
          }}
        >
          <Image
            src="/weekloop-hero.jpg"
            alt="WeekLoop interface showing three-week planning view with side task checklist"
            width={1200}
            height={800}
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>

      {/* Mobile layout override */}
      <style>{`
        @media (max-width: 767px) {
          #hero .container {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          #hero .container > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
