# 🇨🇦 Quebec French Implementation Status

## ✅ Completed

1. **Installed next-intl** - Added to package.json
2. **Created i18n configuration**:
   - `src/i18n/routing.ts` - Locale routing config
   - `src/i18n/request.ts` - Server-side request config
   - `src/i18n/config.ts` - i18n configuration
3. **Created translation files**:
   - `messages/en-CA.json` - English (Canada) translations
   - `messages/fr-QC.json` - French (Quebec) translations with proper terminology
4. **Created LanguageSwitcher component** - Language toggle UI
5. **Updated Next.js config** - Added next-intl plugin
6. **Created middleware** - Locale detection and routing
7. **Created locale layout** - `src/app/[locale]/layout.tsx`
8. **Updated home page** - `src/app/[locale]/page.tsx` with translations
9. **Created root redirect** - `src/app/page.tsx` redirects to default locale

## 🔄 Remaining Work

### Critical: Move Pages Under [locale]

All pages need to be moved from:
```
src/app/
├── dashboard/
├── gurus/
└── onboarding/
```

To:
```
src/app/[locale]/
├── dashboard/
├── gurus/
└── onboarding/
```

### Update Root Layout

The root `src/app/layout.tsx` should only contain metadata, not the full layout (that's now in `[locale]/layout.tsx`).

### Update All Pages

Replace hardcoded strings with `useTranslations()` or `getTranslations()`:
- Dashboard pages
- Guru pages  
- Onboarding flow
- All components

### Add More Translations

Expand translation files to include:
- Dashboard strings
- Guru builder strings
- Onboarding strings
- Error messages
- Form labels

## 🚀 Quick Start Commands

```bash
# Test the setup locally
cd apps/web
pnpm dev

# Visit:
# http://localhost:3000/en-CA (English)
# http://localhost:3000/fr-QC (French)
```

## 📝 Next Steps

1. **Move pages** - Restructure app directory
2. **Update components** - Add translations to all components
3. **Test** - Verify both locales work
4. **API support** - Add Accept-Language header handling

## ⚠️ Notes

- next-intl shows peer dependency warning for Next.js 16, but should work fine
- Language switcher is positioned fixed top-right
- Default locale is `en-CA`
- URLs will be `/en-CA/...` and `/fr-QC/...`
