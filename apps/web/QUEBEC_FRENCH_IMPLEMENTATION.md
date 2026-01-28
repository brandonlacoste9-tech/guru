# 🇨🇦 Quebec French (fr-QC) Language Support Implementation

## Overview
This document outlines the implementation of Quebec French language support for FloGuru using `next-intl` with Next.js 16 App Router.

## Architecture

### File Structure
```
apps/web/
├── messages/
│   ├── en-CA.json          # English (Canada) translations
│   └── fr-QC.json          # French (Quebec) translations
├── src/
│   ├── i18n/
│   │   ├── config.ts       # i18n configuration
│   │   ├── routing.ts      # Locale routing configuration
│   │   └── request.ts      # Server-side request config
│   ├── middleware.ts        # Locale detection middleware
│   ├── components/
│   │   └── LanguageSwitcher.tsx  # Language toggle component
│   └── app/
│       ├── [locale]/       # Locale-based routing
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── dashboard/
│       │   ├── gurus/
│       │   └── onboarding/
│       └── layout.tsx       # Root layout (metadata)
```

## Implementation Steps

### ✅ Step 1: Install Dependencies
- [x] Add `next-intl` to package.json
- [x] Create i18n configuration files
- [x] Create translation files (en-CA.json, fr-QC.json)

### 🔄 Step 2: Restructure App Directory
**Current Structure:**
```
src/app/
├── layout.tsx
├── page.tsx
├── dashboard/
├── gurus/
└── onboarding/
```

**New Structure (Required for next-intl):**
```
src/app/
├── layout.tsx              # Root layout (metadata only)
├── [locale]/               # Locale segment
│   ├── layout.tsx          # Locale-specific layout
│   ├── page.tsx            # Home page
│   ├── dashboard/
│   ├── gurus/
│   └── onboarding/
```

### Step 3: Update Components
- Replace hardcoded strings with `useTranslations()` hook
- Update all Link components to use locale-aware routing
- Add LanguageSwitcher to navigation

### Step 4: API Locale Support
- Add `Accept-Language` header handling
- Return localized error messages
- Support locale parameter in API endpoints

## Quebec French Specifics

### Terminology Differences
- **Email**: Use "courriel" (not "email" or "mél")
- **Chat**: Use "clavardage" (not "chat")
- **Website**: Use "site Web" (two words)
- **App**: Use "application" (not "app")

### Formality
- Use "vous" (formal) for user-facing text
- Use "tu" only in casual/informal contexts
- Default to formal unless specified otherwise

### Date/Number Formatting
- Dates: DD/MM/YYYY format
- Numbers: Use French formatting (space as thousand separator)
- Currency: $CAD format

## Usage Examples

### In Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('home');
  
  return (
    <h1>{t('title')}</h1>
    <p>{t('tagline')}</p>
  );
}
```

### In Server Components
```typescript
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('dashboard');
  
  return <h1>{t('title')}</h1>;
}
```

### Navigation Links
```typescript
import { Link } from '@/i18n/routing';

<Link href="/dashboard">Go to Dashboard</Link>
```

## Next Steps

1. **Restructure app directory** - Move pages under `[locale]` folder
2. **Update all pages** - Replace hardcoded text with translation keys
3. **Add LanguageSwitcher** - Integrate into navigation
4. **Test both locales** - Verify all pages work in EN and FR
5. **Add API locale support** - Handle Accept-Language header

## Testing Checklist

- [ ] Home page displays correctly in both languages
- [ ] Language switcher works and persists selection
- [ ] All navigation links preserve locale
- [ ] Dashboard displays in selected language
- [ ] Guru pages are translated
- [ ] Onboarding flow works in both languages
- [ ] API returns localized error messages
- [ ] Browser language detection works
