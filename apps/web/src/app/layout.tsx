import type { Metadata } from "next";

// Root layout - only metadata, actual layout is in [locale]/layout.tsx
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
  // This layout is minimal - actual rendering happens in [locale]/layout.tsx
  return children;
}
