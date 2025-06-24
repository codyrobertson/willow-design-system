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

// Load local Codec Pro font
const codecPro = Inter({
  subsets: ["latin"],
  variable: "--font-codec-pro",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
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
      <head>
        {/* Load Codec Pro font CSS */}
        <link 
          rel="stylesheet" 
          href="/cdn/fonts/codec-pro-optimized.css"
        />
        {/* Preload critical fonts for better performance */}
        <link 
          rel="preload" 
          href="/cdn/fonts/Codec-Pro-Regular.otf" 
          as="font" 
          type="font/otf" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          href="/cdn/fonts/Codec-Pro-Bold.otf" 
          as="font" 
          type="font/otf" 
          crossOrigin="anonymous"
        />
        {/* Font loader script */}
        <script src="/cdn/fonts/font-loader-enhanced.js" async></script>
      </head>
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