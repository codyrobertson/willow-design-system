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
      <head>
        {/* Preload critical Codec Pro fonts for better performance */}
        <link 
          rel="preload" 
          href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Regular.otf" 
          as="font" 
          type="font/otf" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          href="https://iridescent-brigadeiros-fe4174.netlify.app/cdn/fonts/Codec-Pro-Bold.otf" 
          as="font" 
          type="font/otf" 
          crossOrigin="anonymous"
        />
        {/* Add font-display: swap for better loading experience */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'Codec Pro Fallback';
              src: local('Arial'), local('Helvetica'), local('sans-serif');
              font-display: swap;
            }
          `
        }} />
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