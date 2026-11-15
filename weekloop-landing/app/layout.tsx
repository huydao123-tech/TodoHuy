import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./sb-skin.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

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

import { LanguageProvider } from "@/lib/languageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`} suppressHydrationWarning>
            <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('weekloop-theme');
                  var pref = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', pref);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
