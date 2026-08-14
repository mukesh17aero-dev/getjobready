import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Ambience } from "@/components/ambience";
import { AppHeader } from "@/components/app-header";
import { FootprintTracker } from "@/components/footprint-tracker";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ascend — Talent Fulfillment Network",
    template: "%s · Ascend",
  },
  description:
    "Practise the skills a job needs, build auditable evidence that you have them, and share a verified readiness passport with employers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // THEME_BOOTSTRAP below stamps data-theme on this element before React
      // hydrates, so that a dark-mode user never sees a white flash. That is a
      // deliberate difference between the server HTML and the live DOM, and
      // this is the one place it is expected: the flag covers this element's
      // own attributes only, not anything inside it.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Ambience />
        <AppHeader />
        <FootprintTracker />
        {children}
      </body>
    </html>
  );
}
