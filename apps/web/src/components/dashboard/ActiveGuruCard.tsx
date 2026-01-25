import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Guru } from '@floguru/guru-core';
import { Sparkles, MessageCircle, Zap, Clock, Pause, Play, Settings2 } from 'lucide-react';
import { useScheduler, ScheduledJob } from '@/hooks/useScheduler';
import { useSocket } from '@/hooks/useSocket';
import ScheduleSettingsModal from './ScheduleSettingsModal';
import { GuruSettingsModal } from './GuruSettingsModal';

interface ActiveGuruCardProps {
    guru: Guru;
}

export default function ActiveGuruCard({ guru }: ActiveGuruCardProps) {
    const { getJobs, pauseGuru, rescheduleGuru } = useScheduler();
    const { status } = useSocket(guru.id);
    const [job, setJob] = useState<ScheduledJob | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const refreshSchedule = async () => {
        const jobs = await getJobs();
        const guruJob = jobs.find(j => j.id === guru.id);
        setJob(guruJob || null);
        setIsPaused(!guruJob);
    };

    useEffect(() => {
        refreshSchedule();
    }, [guru.id]);

    const handleTogglePause = async () => {
        if (isPaused) {
            // Re-schedule with default if not found
            await rescheduleGuru(guru.id, {
                type: 'schedule',
                time: '09:00',
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        } else {
            await pauseGuru(guru.id);
        }
        refreshSchedule();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden group bg-slate-900/50 border border-slate-800 rounded-3xl p-8"
        >
            {/* Background Gradient */}
            <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                style={{ background: guru.color.gradient }}
            />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                {/* Guru Emoji/Avatar */}
                <div className="shrink-0 relative">
                    <div className="w-24 h-24 rounded-2xl bg-slate-950 flex items-center justify-center text-5xl shadow-2xl border border-slate-800 group-hover:scale-105 transition-transform duration-500">
                        {guru.emoji}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-slate-900 ${isPaused ? 'bg-amber-500' : 'bg-green-500'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                    {/* Live Status Overlay */}
                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-3 mb-4 overflow-hidden"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-75" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-150" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Live from {guru.name}</span>
                                </div>
                                <p className="text-sm text-blue-100 mt-1 font-medium">{status.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Primary Guru</span>
                                <Sparkles className="w-3 h-3 text-blue-400" />
                            </div>
                            <h2 className="text-4xl font-bold text-white">{guru.name}</h2>
                            <p className="text-slate-400 mt-2 text-lg italic">&quot;{guru.tagline}&quot;</p>
                        </div>

                        {/* Schedule Badge */}
                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-4 self-center md:self-start">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Next Automation</span>
                                <div className="flex items-center gap-2 text-white">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span className="text-sm font-bold">
                                        {isPaused ? 'Paused' : job?.nextRun ? new Date(job.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Schedule'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={handleTogglePause}
                                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    title={isPaused ? "Resume Schedule" : "Pause Schedule"}
                                >
                                    {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                    title="Edit Schedule"
                                >
                                    <Settings2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {guru.expertise.slice(0, 3).map((exp) => (
                            <span key={exp} className="bg-slate-950/50 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                                {exp}
                            </span>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-4 justify-center md:justify-start">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 active:scale-95">
                            <MessageCircle className="w-4 h-4" /> Chat
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700"
                        >
                            <Settings2 className="w-4 h-4" /> Guru Settings
                        </button>
                    </div>
                </div>

                {/* Catchphrase Card */}
                <div className="hidden lg:block w-64 bg-slate-950/50 border border-slate-800 p-6 rounded-2xl">
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                        {guru.personality.catchphrases[Math.floor(Math.random() * guru.personality.catchphrases.length)]}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                            {guru.emoji}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Daily Wisdom</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <ScheduleSettingsModal
                        guruId={guru.id}
                        guruName={guru.name}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={refreshSchedule}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSettingsOpen && (
                    <GuruSettingsModal
                        guru={guru}
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
