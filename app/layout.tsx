import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const openRunde = localFont({
  src: [
    { path: "../public/fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Omhar Regidor — Agentic Engineer & Web Developer",
  description:
    "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
  openGraph: {
    title: "Omhar Regidor — Agentic Engineer & Web Developer",
    description:
      "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
    images: ["/omhar/me-pro-image.JPG"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omhar Regidor — Agentic Engineer & Web Developer",
    description:
      "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
    images: ["/omhar/me-pro-image.JPG"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={openRunde.variable}>
      <body>
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
