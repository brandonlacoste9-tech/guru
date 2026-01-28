'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { GURUS, type Guru, type Habit } from '@floguru/guru-core';

function ResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const guruId = searchParams.get('guru');

    const [userName, setUserName] = useState('Friend');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!guruId || !GURUS[guruId]) {
            router.push('/onboarding');
        }

        const userData = localStorage.getItem('floguru_user');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                if (parsed.name) setUserName(parsed.name);
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, [guruId, router]);

    // Handle case where guruId is invalid or guru not found
    const guru = (guruId && GURUS[guruId]) ? (GURUS[guruId] as Guru) : null;

    if (!mounted || !guru) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white">Loading your Guru...</div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${guru.color.primary}20 0%, #0a0a0f 50%, ${guru.color.secondary}20 100%)`
            }}
        >
            {/* Background glow */}
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
                style={{ background: guru.color.gradient }}
            />

            <div className="container mx-auto px-6 py-12 relative z-10">
                {/* Result Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    {/* Celebration header */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mb-8"
                    >
                        <span className="text-8xl">{guru.emoji}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        Meet Your Guru, {userName}!
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-8"
                    >
                        <h2
                            className="text-3xl font-bold mb-2"
                            style={{ color: guru.color.primary }}
                        >
                            {guru.name}
                        </h2>
                        <p className="text-xl text-white/80">{guru.tagline}</p>
                    </motion.div>

                    {/* Guru description */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/70 text-lg mb-12 max-w-xl mx-auto"
                    >
                        {guru.description}
                    </motion.p>

                    {/* Guru catchphrase */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-12"
                    >
                        <p className="text-white/60 text-sm mb-2">Your Guru says:</p>
                        <p className="text-xl text-white italic">
                            &quot;{guru.personality.catchphrases[0]}&quot;
                        </p>
                    </motion.div>

                    {/* What your guru offers */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mb-12"
                    >
                        <h3 className="text-xl font-bold text-white mb-6">
                            What {guru.name} Will Help You With
                        </h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            {guru.expertise.map((skill: string, i: number) => (
                                <motion.span
                                    key={skill}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                    className="px-4 py-2 rounded-full text-white"
                                    style={{
                                        background: `linear-gradient(135deg, ${guru.color.primary}40, ${guru.color.secondary}40)`,
                                        border: `1px solid ${guru.color.primary}50`
                                    }}
                                >
                                    {skill}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Starter habits preview */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mb-12"
                    >
                        <h3 className="text-xl font-bold text-white mb-6">
                            Your Starter Habits
                        </h3>
                        <div className="grid gap-4 max-w-md mx-auto">
                            {guru.defaultHabits.slice(0, 3).map((habit: Habit, i: number) => (
                                <motion.div
                                    key={habit.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + i * 0.15 }}
                                    className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                                >
                                    <span className="text-2xl">{habit.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-white font-medium">{habit.name}</p>
                                        <p className="text-white/60 text-sm">{habit.description}</p>
                                    </div>
                                    {habit.automatable && (
                                        <span
                                            className="ml-auto text-xs px-2 py-1 rounded-full"
                                            style={{ background: guru.color.primary + '30', color: guru.color.primary }}
                                        >
                                            ⚡ Auto
                                        </span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-full text-white font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                            style={{
                                background: guru.color.gradient,
                                boxShadow: `0 10px 40px ${guru.color.primary}40`
                            }}
                        >
                            🚀 Start with {guru.name}
                        </Link>
                        <Link
                            href="/onboarding"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all"
                        >
                            Try Different Guru
                        </Link>
                    </motion.div>

                    {/* Multi-guru hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="mt-8 text-white/40 text-sm"
                    >
                        Pro tip: You can add more Gurus later to cover all areas of your life!
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}

export default function OnboardingResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white">Loading your Guru...</div>
            </div>
        }>
            <ResultContent />
        </Suspense>
    );
}
