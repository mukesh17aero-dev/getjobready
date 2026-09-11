import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
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

// Display face for headlines only — body text stays on Geist. A geometric
// grotesk is what separates the page from the system-font sea without
// tipping into a luxury-brand serif.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ascend — Talent Fulfillment Network",
    template: "%s · Ascend",
  },
  description:
    "Practise the skills a job needs, build auditable evidence that you have them, and share a verified readiness passport with employers.",
  // iOS ignores the web manifest's display mode almost entirely; these are the
  // tags Safari actually reads when someone adds Ascend to their home screen.
  appleWebApp: {
    capable: true,
    // The name under the home-screen icon. Kept to the manifest's short_name
    // so both platforms label the same app the same way.
    title: "Ascend",
    // Lets the page paint under the status bar, which is what makes an
    // installed page stop looking like a browser with the chrome hidden. It
    // only works because the header carries `safe-top` - without that, the
    // clock would sit on top of the wordmark.
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-icon-180.png",
  },
};

// Phone chrome. `viewportFit: "cover"` lets the page paint into the notch and
// home-indicator strip; the `safe-*` classes in globals.css keep actual content
// out of them. Zoom is deliberately left unrestricted - pinch-to-zoom is an
// accessibility right, and locking it is the single most common way a web app
// is made hostile to the people who most need it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Colours the browser's own address bar to match the page, which is most of
  // what makes a browser tab stop looking like a browser tab on a phone.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a121a" },
  ],
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
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
