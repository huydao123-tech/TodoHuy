"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "@phosphor-icons/react";

const PLANS = [
  {
    id: "plan-solo",
    tier: "Solo",
    price: "Free",
    priceNote: "forever",
    description: "The full three-week cycle for one person.",
    features: [
      "Rolling three-week view",
      "Up to 6 active goals",
      "Side-task checklist",
      "Weekly review prompt",
      "Goal history (last 4 weeks)",
    ],
    cta: "Start free",
    ctaId: "pricing-solo-cta",
    highlight: false,
  },
  {
    id: "plan-pro",
    tier: "Pro",
    price: "$8",
    priceNote: "per month",
    description: "Deeper history and reference for serious practitioners.",
    features: [
      "Everything in Solo",
      "Unlimited goal history",
      "Reference materials per goal",
      "Goal archive and export",
      "Priority support",
    ],
    cta: "Start free",
    ctaId: "pricing-pro-cta",
    highlight: true,
  },
];

export default function Pricing() {
  const reduce = useReducedMotion();

  return (
    /*
      LAYOUT FAMILY 7: 2-column comparison panel.
      Free plan on the left, Pro on the right (highlighted with accent border).
      NOT three equal cards — two plans, clear distinction.
      One eyebrow used here (second and final eyebrow for this page).
    */
    <section
      id="pricing"
      className="section-pad"
      aria-label="WeekLoop pricing"
    >
      <div className="container">
        {/* Section header */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            Pricing
          </p>
          <h2 className="text-headline" style={{ maxWidth: "22ch" }}>
            One free plan. One honest upgrade.
          </h2>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
            maxWidth: "800px",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              id={plan.id}
              style={{
                borderRadius: "var(--radius-lg)",
                border: plan.highlight
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                background: plan.highlight ? "var(--card-bg, #fff)" : "var(--bg-alt)",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Header */}
              <div>
                <p
                  style={{
                    fontWeight: 560,
                    fontSize: "1rem",
                    color: plan.highlight ? "var(--accent)" : "var(--text-muted)",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {plan.tier}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "2.25rem",
                      letterSpacing: "-0.035em",
                      color: "var(--text)",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {plan.priceNote}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                    lineHeight: 1.5,
                  }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Feature list */}
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                  flexGrow: 1,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      color: "var(--text)",
                    }}
                  >
                    <Check
                      size={16}
                      color="var(--accent)"
                      weight="bold"
                      style={{ flexShrink: 0, marginTop: "0.15em" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#"
                id={plan.ctaId}
                className="btn-primary"
                style={
                  plan.highlight
                    ? {}
                    : {
                        background: "transparent",
                        color: "var(--text)",
                        border: "1px solid var(--border-mid)",
                      }
                }
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Mobile: 1 column */}
      <style>{`
        @media (max-width: 640px) {
          #pricing [style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
