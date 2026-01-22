'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Guru } from '@floguru/guru-core';
import { Sparkles, MessageCircle, Zap } from 'lucide-react';

interface ActiveGuruCardProps {
    guru: Guru;
}

export default function ActiveGuruCard({ guru }: ActiveGuruCardProps) {
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
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-900" />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Primary Guru</span>
                            <Sparkles className="w-3 h-3 text-blue-400" />
                        </div>
                        <h2 className="text-4xl font-bold text-white">{guru.name}</h2>
                        <p className="text-slate-400 mt-2 text-lg italic">&quot;{guru.tagline}&quot;</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {guru.expertise.slice(0, 3).map((exp) => (
                            <span key={exp} className="bg-slate-950/50 border border-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                                {exp}
                            </span>
                        ))}
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 active:scale-95">
                            <MessageCircle className="w-4 h-4" /> Chat
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors active:scale-95 border border-slate-700">
                            <Zap className="w-4 h-4" /> Quick Task
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
        </motion.div>
    );
}
