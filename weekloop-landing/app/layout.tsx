import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeekLoop. Plan your week. Protect your goals.",
  description:
    "WeekLoop is a personal planning tool built around a rolling last-week, this-week, next-week cycle. Keep long-term goals visible while side tasks stay within reach.",
  openGraph: {
    title: "WeekLoop. Plan your week. Protect your goals.",
    description:
      "A rolling three-week view for people juggling language learning, fitness, and personal projects. One place to plan, track, and review.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
