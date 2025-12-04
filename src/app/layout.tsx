import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Decypher - AI Semantic Archaeologist",
  description: "Reviving Lost Languages Through Intelligent Design. AI-powered platform for ancient text decryption and translation.",
  keywords: ["ancient languages", "AI translation", "cultural heritage", "glyph recognition", "archaeology", "linguistics"],
  authors: [{ name: "Zhicong Technology" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Project Decypher",
    description: "AI-powered ancient text decryption and translation",
    url: "https://project-decypher.com",
    siteName: "Project Decypher",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Decypher",
    description: "AI-powered ancient text decryption and translation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
