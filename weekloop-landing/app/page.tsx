import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Disciplines from "@/components/Disciplines";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

/*
  WeekLoop Landing Page
  ─────────────────────
  Sections (9 content + nav + footer = 11 total components):

  1. Nav            — sticky header
  2. Hero           — LAYOUT: Asymmetric Split (55/45, text left / image right)
  3. Manifesto      — LAYOUT: Full-width centered editorial text
  4. How It Works   — LAYOUT: Numbered vertical step list (with connector)
  5. Features       — LAYOUT: CSS Grid bento (5 cells: 1 wide image + 4 text)
  6. Disciplines    — LAYOUT: 2-column headline-left / pills-right typographic
  7. Testimonials   — LAYOUT: 2-column quote grid
  8. Pricing        — LAYOUT: 2-column comparison panel
  9. CTA            — LAYOUT: Full-width centered (dark zone)
  10. Footer        — LAYOUT: Multi-column footer

  Layout families used: 7 distinct (requirement: 4 minimum) ✓
  Eyebrows: 2 (How it works, Pricing) — budget: ceil(8/3) = 3 ✓
  Theme: Light locked. Dark only at CTA+Footer (terminal zone, not sandwiched) ✓
  CTA intent: ONE — "Start free" — used in nav, hero, pricing (both tiers), final CTA ✓
  Accent: var(--accent) forest green, consistent throughout ✓
*/
export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <HowItWorks />
        <Features />
        <Disciplines />
        <Testimonials />
        <Pricing />
      </main>
      <CtaSection />
      <Footer />
    </>
  );
}
