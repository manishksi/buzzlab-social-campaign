import type { Metadata, Viewport } from "next";
import "./globals.css";
import { meta } from "@/content/strategy";

export const metadata: Metadata = {
  title: meta.title,
  description: "BuzzLab's 6-month Instagram growth and content strategy: Spark, Flame, Light.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/assets/fonts/big-shoulders-display-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/assets/fonts/archivo-var.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
