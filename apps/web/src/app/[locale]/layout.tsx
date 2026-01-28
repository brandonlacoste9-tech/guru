import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

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
import LanguageSwitcher from "@/components/LanguageSwitcher";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <SupabaseProvider>
          <CopilotWrapper>
            <div className="fixed top-4 right-4 z-50">
              <LanguageSwitcher />
            </div>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </CopilotWrapper>
        </SupabaseProvider>
      </body>
    </html>
  );
}
