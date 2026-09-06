"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { CheckSquare, BookOpen, ClockCounterClockwise, SlidersHorizontal } from "@phosphor-icons/react";

const TEXT_CELLS = [
  {
    icon: CheckSquare,
    title: "Side-task checklist",
    body: "Quick captures that live next to your week without cluttering it. Side tasks clear on their own schedule.",
    bg: "var(--accent)",
    textColor: "#fff",
    bodyColor: "rgba(255,255,255,0.72)",
  },
  {
    icon: BookOpen,
    title: "Reference materials",
    body: "Attach vocabulary lists, training plans, or research notes directly to a goal. Always one click away.",
    bg: "#fff",
    textColor: "var(--text)",
    bodyColor: "var(--text-muted)",
  },
  {
    icon: ClockCounterClockwise,
    title: "Goal history",
    body: "Last week compresses into a searchable log. See when you were consistent and when you slipped, without judgment.",
    bg: "var(--bg-alt)",
    textColor: "var(--text)",
    bodyColor: "var(--text-muted)",
  },
  {
    icon: SlidersHorizontal,
    title: "Weekly review prompt",
    body: "A short guided question at the start of each week. What moved? What stalled? What changes?",
    bg: "var(--bg-alt)",
    textColor: "var(--text)",
    bodyColor: "var(--text-muted)",
  },
];

export default function Features() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 4: CSS Grid bento — mixed cell sizes.
      Grid: 2 columns desktop.
      Row 1: [cycle image, col-span-2 — full width]
      Row 2: [green cell] [white cell]
      Row 3: [zinc-100 cell] [zinc-100 cell]
      Total: 5 cells, 0 empty. Visual variety: image bg, green bg, white, zinc-100 x2.
    */
    <section
      id="features"
      className="section-pad"
      aria-label="WeekLoop features"
      style={{ background: "var(--bg-alt)" }}
    >
      <div className="container">
        <h2
          className="text-headline"
          style={{ marginBottom: "2.5rem", maxWidth: "28ch" }}
        >
          Everything a week needs. Nothing it does not.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
        >
          {/* Cell 1: Full-width image — the cycle view */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              gridColumn: "1 / -1",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "#fff",
              position: "relative",
            }}
          >
            <div style={{ padding: "1.75rem 1.75rem 0" }}>
              <p
                style={{
                  fontWeight: 560,
                  fontSize: "1.125rem",
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  marginBottom: "0.375rem",
                }}
              >
                The rolling three-week view
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "52ch" }}>
                Last week, this week, and next week visible at once. Goals
                that span months stay grounded in the present.
              </p>
            </div>
            <Image
              src="/weekloop-cycle.jpg"
              alt="Diagram showing last week, this week, and next week columns in WeekLoop"
              width={1600}
              height={900}
              style={{ width: "100%", height: "auto", display: "block", marginTop: "1.25rem" }}
            />
          </motion.div>

          {/* Cells 2-5: feature text cells */}
          {TEXT_CELLS.map((cell, i) => {
            const Icon = cell.icon;
            return (
              <motion.div
                key={cell.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  background: cell.bg,
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius)",
                    background: cell.bg === "var(--accent)" ? "rgba(255,255,255,0.15)" : "var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={20}
                    color={cell.bg === "var(--accent)" ? "#fff" : "var(--accent)"}
                    weight="regular"
                  />
                </div>
                <div>
                  <h3
                    style={{
                      fontWeight: 550,
                      fontSize: "1.0625rem",
                      letterSpacing: "-0.018em",
                      color: cell.textColor,
                      marginBottom: "0.375rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {cell.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: cell.bodyColor,
                      lineHeight: 1.6,
                    }}
                  >
                    {cell.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile: 1-column */}
      <style>{`
        @media (max-width: 640px) {
          #features [style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
          #features [style*="grid-column: 1 / -1"] {
            grid-column: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
