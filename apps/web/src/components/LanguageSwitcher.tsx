'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    // Get current path without locale prefix
    const pathWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.replace(`/${locale}`, '') || '/'
      : pathname;
    
    // Navigate to new locale with same path
    router.replace(pathWithoutLocale, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
        aria-label="Switch language"
      >
        <span className="text-lg">
          {locale === 'fr-QC' ? '🇨🇦' : '🇨🇦'}
        </span>
        <span className="font-medium">
          {locale === 'fr-QC' ? 'FR' : 'EN'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
            <button
              onClick={() => switchLocale('en-CA')}
              className={`w-full px-4 py-2 text-left hover:bg-white/50 transition-colors ${
                locale === 'en-CA' ? 'bg-white/30 font-semibold' : ''
              }`}
            >
              <span className="mr-2">🇨🇦</span>
              English (CA)
            </button>
            <button
              onClick={() => switchLocale('fr-QC')}
              className={`w-full px-4 py-2 text-left hover:bg-white/50 transition-colors ${
                locale === 'fr-QC' ? 'bg-white/30 font-semibold' : ''
              }`}
            >
              <span className="mr-2">🇨🇦</span>
              Français (QC)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
