import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { ChatLauncher } from "@/components/chat/chat-launcher";
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
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
  ),
  title: "Omhar Regidor — Agentic Engineer & Software Developer",
  description:
    "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
  openGraph: {
    title: "Omhar Regidor — Agentic Engineer & Software Developer",
    description:
      "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
    images: ["/omhar/me-pro-image-crop.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omhar Regidor — Agentic Engineer & Software Developer",
    description:
      "Personal portfolio of Omhar Regidor — building scalable web systems and AI-powered workflows from Batangas, Philippines.",
    images: ["/omhar/me-pro-image-crop.jpg"],
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
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
          <SiteFooter />
          <ChatLauncher />
        </ThemeProvider>
      </body>
    </html>
  );
}
