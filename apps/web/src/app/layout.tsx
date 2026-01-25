import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import CopilotWrapper from "@/components/CopilotWrapper";
import { SupabaseProvider } from "@/components/SupabaseProvider";

export const metadata: Metadata = {
  title: "FloGuru | Your AI Life Coach",
  description: "Automate your habits and transform your life with specialized AI Gurus.",
  openGraph: {
    title: "FloGuru | Your AI Life Coach",
    description: "Automate your habits and transform your life with specialized AI Gurus.",
    url: "https://floguru.ai",
    siteName: "FloGuru",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FloGuru | Your AI Life Coach",
    description: "Automate your habits and transform your life with specialized AI Gurus.",
    images: ["/og-image.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <SupabaseProvider>
          <CopilotWrapper>
            {children}
          </CopilotWrapper>
        </SupabaseProvider>
      </body>
    </html>
  );
}
