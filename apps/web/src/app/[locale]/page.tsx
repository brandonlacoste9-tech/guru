'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { GURUS, type Guru } from '@floguru/guru-core';

export default function Home() {
  const t = useTranslations('home');
  const gurus = Object.values(GURUS) as Guru[];
  const [dots, setDots] = useState<{ width: string; height: string; left: string; top: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const newDots = [...Array(20)].map(() => ({
      width: `${Math.random() * 300 + 100}px`,
      height: `${Math.random() * 300 + 100}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 5}s`,
    }));
    setDots(newDots);
  }, []);

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            {dots.map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-purple-500/20 blur-xl animate-pulse"
                style={{
                  width: dot.width,
                  height: dot.height,
                  left: dot.left,
                  top: dot.top,
                  animationDelay: dot.delay,
                  animationDuration: dot.duration,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-6xl">🌊</span>
              <h1 className="text-6xl font-bold bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                FloGuru
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-2xl text-white/80 mb-4">
              {t('tagline')}
            </p>
            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/onboarding"
                className="px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                🎯 {t('findGuru')}
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all"
              >
                {t('watchDemo')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 text-white/60">
              <div>
                <div className="text-3xl font-bold text-white">6+</div>
                <div className="text-sm">{t('specializedGurus')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-sm">{t('automations')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">∞</div>
                <div className="text-sm">{t('possibilities')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            {t('howItWorks')}
          </h2>
          <p className="text-center text-white/60 mb-16 max-w-2xl mx-auto">
            {t('howItWorksSubtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">{t('step1Title')}</h3>
              <p className="text-white/60">
                {t('step1Description')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">{t('step2Title')}</h3>
              <p className="text-white/60">
                {t('step2Description')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">{t('step3Title')}</h3>
              <p className="text-white/60">
                {t('step3Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Gurus */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            {t('meetGurus')}
          </h2>
          <p className="text-center text-white/60 mb-16 max-w-2xl mx-auto">
            {t('meetGurusSubtitle')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {gurus.map((guru: Guru) => (
              <div
                key={guru.id}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${guru.color.primary}15 0%, ${guru.color.secondary}10 100%)`
                }}
              >
                {/* Guru emoji and name */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{guru.emoji}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{guru.name}</h3>
                    <p className="text-sm text-white/60">{guru.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                  {guru.description}
                </p>

                {/* Sample automations */}
                <div className="flex flex-wrap gap-2">
                  {guru.expertise.slice(0, 3).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Hover effect */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${guru.color.primary}20, transparent 70%)`
                  }}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105"
            >
              🌊 {t('findPerfectGuru')}
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-black/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            {t('pricing')}
          </h2>
          <p className="text-center text-white/60 mb-16">
            {t('pricingSubtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">{t('free')}</h3>
              <div className="text-4xl font-bold text-white mb-4">$0</div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>✓ 1 Guru</li>
                <li>✓ 3 habits</li>
                <li>✓ Manual tracking</li>
                <li>✓ Basic streaks</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all">
                {t('getStarted')}
              </button>
            </div>

            {/* Pro */}
            <div className="bg-linear-to-br from-purple-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-linear-to-r from-purple-500 to-cyan-500 rounded-full text-sm font-bold text-white">
                {t('popular')}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('pro')}</h3>
              <div className="text-4xl font-bold text-white mb-4">
                $7.99<span className="text-lg text-white/60">{t('perMonth')}</span>
              </div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>✓ 3 Gurus</li>
                <li>✓ Unlimited habits</li>
                <li>✓ Basic automations</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <button className="w-full py-3 rounded-full bg-linear-to-r from-purple-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-all">
                {t('startTrial')}
              </button>
            </div>

            {/* Unlimited */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">{t('unlimited')}</h3>
              <div className="text-4xl font-bold text-white mb-4">
                $19.99<span className="text-lg text-white/60">{t('perMonth')}</span>
              </div>
              <ul className="space-y-3 text-white/70 mb-8">
                <li>✓ All Gurus</li>
                <li>✓ Full automation suite</li>
                <li>✓ Priority execution</li>
                <li>✓ Custom automations</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all">
                {t('goUnlimited')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t('readyToTransform')}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            {t('readySubtitle')}
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
          >
            🌊 {t('startJourney')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center text-white/40 text-sm">
          <p>{t('footer')}</p>
          <p className="mt-2">{t('copyright')}</p>
        </div>
      </footer>
    </main>
  );
}
