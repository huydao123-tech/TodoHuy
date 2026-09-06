"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Flag,
  CalendarBlank,
  ArrowsCounterClockwise,
} from "@phosphor-icons/react";

const STEPS = [
  {
    number: "01",
    icon: Flag,
    title: "Name your goals",
    body: "Add the long-term goals you are working toward: a language, a fitness target, a project. WeekLoop keeps them visible every single week.",
  },
  {
    number: "02",
    icon: CalendarBlank,
    title: "Fill this week",
    body: "Drop concrete actions under each goal into the current week column. Add any side tasks on the right. Nothing more to configure.",
  },
  {
    number: "03",
    icon: ArrowsCounterClockwise,
    title: "Review and roll",
    body: "At the end of the week, last week compresses into history. Next week slides in. You see exactly what you did, and plan from there.",
  },
];

export default function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 3: Numbered vertical step list.
      Large ordinal + icon left, headline + body right, connected by a vertical line.
      One eyebrow used here (within budget: 2 total for 8 sections).
    */
    <section
      id="how-it-works"
      className="section-pad"
      aria-label="How WeekLoop works"
    >
      <div className="container">
        {/* Section header — stacked vertically (no split-header pattern) */}
        <div style={{ marginBottom: "4rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            How it works
          </p>
          <h2
            className="text-headline"
            style={{ maxWidth: "22ch" }}
          >
            Three steps. No configuration.
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0",
            position: "relative",
          }}
        >
          {/* Vertical connector line */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 27,
              top: 48,
              bottom: 48,
              width: 1,
              background: "var(--border)",
            }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={reduce ? false : { opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr",
                  gap: "2rem",
                  paddingBottom: i < STEPS.length - 1 ? "3rem" : 0,
                  position: "relative",
                }}
              >
                {/* Ordinal circle */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "var(--radius-lg)",
                      background: "#fff",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Icon size={22} color="var(--accent)" weight="regular" />
                  </div>
                </div>

                {/* Text */}
                <div style={{ paddingTop: "0.875rem" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: "0.6875rem",
                      color: "var(--text-faint)",
                      letterSpacing: "0.1em",
                      marginBottom: "0.375rem",
                    }}
                  >
                    {step.number}
                  </div>
                  <h3
                    style={{
                      fontWeight: 560,
                      fontSize: "1.25rem",
                      letterSpacing: "-0.02em",
                      marginBottom: "0.5rem",
                      lineHeight: 1.15,
                      color: "var(--text)",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-body-lg"
                    style={{ maxWidth: "52ch", fontSize: "0.9375rem" }}
                  >
                    {step.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile: connector line hidden, grid collapses */}
      <style>{`
        @media (max-width: 480px) {
          #how-it-works [aria-hidden] { display: none; }
        }
      `}</style>
    </section>
  );
}
