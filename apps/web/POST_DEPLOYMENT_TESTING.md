# 🧪 Post-Deployment Testing Guide

## Quick Test URLs

Once deployed, test these URLs:

### English (Default)
- Home: `https://floguru-production.up.railway.app/en-CA`
- Dashboard: `https://floguru-production.up.railway.app/en-CA/dashboard`
- Gurus: `https://floguru-production.up.railway.app/en-CA/gurus`
- Onboarding: `https://floguru-production.up.railway.app/en-CA/onboarding`

### French (Quebec)
- Home: `https://floguru-production.up.railway.app/fr-QC`
- Dashboard: `https://floguru-production.up.railway.app/fr-QC/dashboard`
- Gurus: `https://floguru-production.up.railway.app/fr-QC/gurus`
- Onboarding: `https://floguru-production.up.railway.app/fr-QC/onboarding`

### Root Redirect
- Root: `https://floguru-production.up.railway.app` → Should redirect to `/en-CA`

## ✅ Testing Checklist

### 1. Language Detection
- [ ] Root URL redirects to `/en-CA`
- [ ] Browser with French locale redirects to `/fr-QC` (if configured)
- [ ] Invalid locale shows 404

### 2. Language Switcher
- [ ] Switcher appears in top-right corner
- [ ] Clicking switcher shows dropdown (EN/FR)
- [ ] Selecting EN switches to `/en-CA` version
- [ ] Selecting FR switches to `/fr-QC` version
- [ ] Current page is preserved when switching
- [ ] URL updates correctly

### 3. English Version (`/en-CA`)
- [ ] Home page displays in English
- [ ] All text is in English
- [ ] Navigation works
- [ ] Dashboard accessible
- [ ] Gurus page accessible
- [ ] Onboarding flow works

### 4. French Version (`/fr-QC`)
- [ ] Home page displays in Quebec French
- [ ] Uses proper terminology:
  - "courriel" (not "email")
  - "clavardage" (not "chat")
  - "site Web" (two words)
- [ ] All text is in French
- [ ] Navigation works
- [ ] Dashboard accessible
- [ ] Gurus page accessible
- [ ] Onboarding flow works

### 5. Navigation & Routing
- [ ] Links preserve locale when navigating
- [ ] Direct URL access works for both locales
- [ ] Browser back/forward buttons work correctly
- [ ] No locale switching on navigation

### 6. Translation Quality
- [ ] No hardcoded English text in French version
- [ ] No hardcoded French text in English version
- [ ] Proper Quebec French terminology used
- [ ] Date/number formatting appropriate
- [ ] Formality level correct (vous vs tu)

### 7. Performance
- [ ] Pages load quickly
- [ ] Language switcher responds instantly
- [ ] No console errors
- [ ] No 404 errors for translations

## 🐛 Common Issues & Fixes

### Issue: Root URL doesn't redirect
**Fix:** Check middleware matcher configuration

### Issue: Language switcher doesn't work
**Fix:** Verify `useRouter` from `@/i18n/routing` is used

### Issue: Translations don't load
**Fix:** Check `messages/` directory exists and JSON files are valid

### Issue: Navigation loses locale
**Fix:** Ensure all `Link` components use `@/i18n/routing`

### Issue: Build fails
**Fix:** Check Railway logs for TypeScript errors or missing dependencies

## 📊 Monitoring

### Railway Dashboard
- Check build logs for errors
- Monitor deployment status
- View application logs

### Browser DevTools
- Check Network tab for translation JSON files
- Verify no 404 errors
- Check Console for JavaScript errors

### Grafana (if configured)
- Monitor application metrics
- Check error rates
- View request logs

## 🎯 Success Criteria

✅ All URLs accessible in both languages
✅ Language switcher functional
✅ Navigation preserves locale
✅ No console errors
✅ Translations load correctly
✅ Proper Quebec French terminology

## 📝 Notes

- Default locale: `en-CA`
- Supported locales: `en-CA`, `fr-QC`
- Language preference not persisted (can be added later)
- API locale support pending (Accept-Language header)
