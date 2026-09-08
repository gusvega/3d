import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
const sans = localFont({
  src: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
});
const mono = localFont({
  src: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
  variable: "--font-mono",
  weight: "400",
  display: "swap",
});
export const metadata: Metadata = {
  title: "me — Gus Vega",
  description:
    "I build the tools I want to make the music I want to hear. Explore Gus Vega’s connected practice in melodic house, audio plugins, synthesizers, hardware, and software engineering.",
  openGraph: {
    title: "Gus Vega — One creative system",
    description:
      "Music. Instruments. Engineering. Different layers, same purpose.",
    type: "website",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
