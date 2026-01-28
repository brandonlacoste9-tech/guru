# 🚀 Quebec French Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Changes
- [x] `next-intl` installed and configured
- [x] Translation files created (en-CA.json, fr-QC.json)
- [x] All pages moved under `[locale]` directory
- [x] Navigation updated to use locale-aware routing
- [x] LanguageSwitcher component created
- [x] Middleware configured for locale detection
- [x] Next.js config updated with next-intl plugin

### Testing Checklist
- [ ] Test `/en-CA` route loads correctly
- [ ] Test `/fr-QC` route loads correctly
- [ ] Test language switcher changes locale
- [ ] Test navigation preserves locale
- [ ] Test dashboard page in both languages
- [ ] Test gurus page in both languages
- [ ] Test onboarding flow in both languages

## 📦 Deployment Steps

### 1. Commit Changes
```bash
cd C:\Users\north\guru
git commit -m "feat: Add Quebec French (fr-QC) language support

- Install and configure next-intl for Next.js 16
- Create translation files (en-CA.json, fr-QC.json)
- Move all pages under [locale] routing structure
- Add LanguageSwitcher component
- Update all navigation to use locale-aware routing
- Add middleware for automatic locale detection"
```

### 2. Push to Trigger Deployment
```bash
git push origin main
```

### 3. Monitor Railway Deployment
- Watch build logs in Railway dashboard
- Verify build completes successfully
- Check for any TypeScript/build errors

### 4. Test Production URLs
- English: `https://floguru-production.up.railway.app/en-CA`
- French: `https://floguru-production.up.railway.app/fr-QC`
- Root redirect: `https://floguru-production.up.railway.app` → should redirect to `/en-CA`

## 🔍 Post-Deployment Verification

### Functional Tests
- [ ] Home page displays in English at `/en-CA`
- [ ] Home page displays in French at `/fr-QC`
- [ ] Language switcher appears and works
- [ ] Switching language preserves current page
- [ ] Dashboard accessible in both languages
- [ ] Gurus page accessible in both languages
- [ ] Onboarding flow works in both languages
- [ ] All navigation links preserve locale

### Translation Quality
- [ ] Quebec French terminology correct (courriel, clavardage, etc.)
- [ ] No hardcoded English text visible in French version
- [ ] Date/number formatting appropriate for locale
- [ ] Proper formality level (vous vs tu)

## 🐛 Troubleshooting

### If Build Fails
1. Check Railway build logs for errors
2. Verify `next-intl` version compatibility with Next.js 16
3. Check for TypeScript errors
4. Verify all imports are correct

### If Routes Don't Work
1. Verify middleware is properly configured
2. Check that `[locale]` directory structure is correct
3. Verify Next.js config has next-intl plugin
4. Check browser console for errors

### If Translations Don't Load
1. Verify translation files are in `messages/` directory
2. Check that locale codes match (en-CA, fr-QC)
3. Verify `getMessages()` is called in layout
4. Check browser network tab for missing JSON files

## 📝 Notes

- Default locale is `en-CA`
- Root path `/` redirects to `/en-CA`
- Language preference is not persisted yet (can be added later)
- API locale support (Accept-Language header) is pending
