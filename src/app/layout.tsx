import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Newsreader, Public_Sans } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-display-family",
});

const ui = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ui-family",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-mono-family",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: "India's independent comparison platform for ERP and accounting software.",
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className={`${display.variable} ${ui.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <SmoothScrollProvider>
          <SiteShell year={2026}>{children}</SiteShell>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
