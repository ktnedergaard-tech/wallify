import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wallify — Design. Print. Done.",
  description:
    "Create stunning A3 and A4 posters online. Pay €5 and download your print-ready PDF instantly.",
  keywords: ["poster maker", "poster design", "print posters", "A4 poster", "A3 poster"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body
        className="min-h-full antialiased"
        style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
      >
        {children}
      </body>
    </html>
  );
}
