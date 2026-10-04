"use client";

import { motion, useReducedMotion } from "motion/react";

const QUOTES = [
  {
    id: "quote-marcus",
    body: "I tried Notion, Todoist, and a paper bullet journal. WeekLoop is the first tool that makes me feel like I am actually making progress on the things that matter.",
    name: "Marcus Stoll",
    role: "Freelance translator, learning Mandarin and Korean",
  },
  {
    id: "quote-priya",
    body: "The three-week view changed how I think about consistency. I can see when I have been slipping and course-correct before a whole month is gone.",
    name: "Priya Nair",
    role: "Software engineer and amateur boxer",
  },
];

export default function Testimonials() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 6: 2-column quote grid.
      Two quotes side by side, no carousel, no stock avatars.
      Attribution: name + role (no em-dash).
      Quotes use typographic curly quotes, max 3 lines body.
    */
    <section
      id="testimonials"
      className="section-pad"
      aria-label="What people say about WeekLoop"
      style={{ background: "var(--bg-alt)" }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem",
          }}
        >
          {QUOTES.map((q, i) => (
            <motion.figure
              key={q.id}
              id={q.id}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.55,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                margin: 0,
                background: "var(--card-bg, #fff)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1.5rem",
              }}
            >
              {/* Opening mark */}
              <span
                aria-hidden
                style={{
                  fontSize: "2rem",
                  lineHeight: 1,
                  color: "var(--accent)",
                  fontFamily: "Georgia, serif",
                  display: "block",
                  marginBottom: "-0.5rem",
                }}
              >
                &ldquo;
              </span>

              <blockquote
                cite=""
                style={{
                  margin: 0,
                  fontSize: "1.0625rem",
                  lineHeight: 1.6,
                  color: "var(--text)",
                  fontStyle: "normal",
                }}
              >
                {q.body}
              </blockquote>

              <figcaption
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "1rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 550,
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                  }}
                >
                  {q.name}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {q.role}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      {/* Mobile: 1 column */}
      <style>{`
        @media (max-width: 640px) {
          #testimonials [style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
