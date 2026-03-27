import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Birdie for Good",
  description:
    "A modern golf subscription platform built around monthly draws and visible charity impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
