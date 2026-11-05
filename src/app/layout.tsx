import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/site-shell";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/public-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <SmoothScrollProvider>
          <SiteShell year={2026}>{children}</SiteShell>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
