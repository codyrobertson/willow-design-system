import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Using Inter as fallback for Codec Pro
const codecPro = Inter({
  subsets: ["latin"],
  variable: "--font-codec-pro",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Willow Design System",
  description: "AI-Powered Aftercare Partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${codecPro.variable} antialiased h-full`}
      >
        <main className="h-full">
          {children}
        </main>
      </body>
    </html>
  );
}