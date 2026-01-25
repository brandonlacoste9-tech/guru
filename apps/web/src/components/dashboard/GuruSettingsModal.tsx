'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, UserCircle, Files, Save, Trash2, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Guru } from '@floguru/guru-core';

interface GuruSettingsModalProps {
    guru: Guru;
    isOpen: boolean;
    onClose: () => void;
}

export function GuruSettingsModal({ guru, isOpen, onClose }: GuruSettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'soul' | 'identity' | 'memory'>('soul');

    // Mock state for Soul
    const [soul, setSoul] = useState({
        personality: 'Professional yet encouraging',
        systemPrompt: "You are FitnessFlow, a world-class trainer. Be direct about form, but stay motivated.",
        mission: "Helping Alex achieve a 365-day movement streak."
    });

    // Mock state for Identity (Profiles)
    const [profiles, setProfiles] = useState([
        { id: '1', name: 'fitness-default', browser: 'chromium', lastUsed: '2h ago', active: true },
        { id: '2', name: 'gym-wifi-login', browser: 'chromium', lastUsed: '1d ago', active: false },
    ]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="text-3xl">{guru.emoji}</div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">{guru.name} Settings</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Session Mastery Core</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex border-b border-slate-800 bg-slate-950/30">
                    <TabButton
                        active={activeTab === 'soul'}
                        onClick={() => setActiveTab('soul')}
                        icon={Sparkles}
                        label="The Soul"
                    />
                    <TabButton
                        active={activeTab === 'identity'}
                        onClick={() => setActiveTab('identity')}
                        icon={UserCircle}
                        label="Identity"
                    />
                    <TabButton
                        active={activeTab === 'memory'}
                        onClick={() => setActiveTab('memory')}
                        icon={Files}
                        label="Memory"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'soul' && (
                            <motion.div
                                key="soul"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-8"
                            >
                                <section>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Core Mission</label>
                                    <textarea
                                        value={soul.mission}
                                        onChange={(e) => setSoul({ ...soul, mission: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-all"
                                        placeholder="What is this Guru's ultimate goal?"
                                    />
                                </section>

                                <section>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">System Soul (Base Prompt)</label>
                                    <textarea
                                        value={soul.systemPrompt}
                                        onChange={(e) => setSoul({ ...soul, systemPrompt: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-mono text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none h-40 resize-none transition-all"
                                        placeholder="The underlying rules for this AI entity..."
                                    />
                                </section>

                                <section>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Tone Tuning</label>
                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                                        <input type="range" className="w-full accent-blue-500" />
                                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Formal / Analytical</span>
                                            <span>Casual / Motivating</span>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'identity' && (
                            <motion.div
                                key="identity"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest">Browser Profiles</label>
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors">
                                        <Plus className="w-4 h-4" /> New Identity
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {profiles.map(p => (
                                        <div key={p.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${p.active ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-950/50 border-slate-800'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                                                    <ShieldCheck className={`w-6 h-6 ${p.active ? 'text-blue-400' : 'text-slate-700'}`} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{p.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{p.browser} • Used {p.lastUsed}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!p.active && (
                                                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-1">Set Active</button>
                                                )}
                                                <button className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex shrink-0 items-center justify-center text-amber-500">⚠️</div>
                                    <p className="text-xs text-amber-200/80 leading-relaxed italic">
                                        Persistent Identities store your cookies and session data in isolated folders. This allows your Guru to stay logged into services across missions. NEVER share your profile folders.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'memory' && (
                            <motion.div
                                key="memory"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-8"
                            >
                                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">findings.md</span>
                                        <button className="p-1 hover:text-white transition-colors"><Save className="w-4 h-4" /></button>
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent p-6 text-sm font-mono text-slate-300 outline-none h-64 resize-none"
                                        defaultValue={`### Past Observations - 2026-01-24\n- Fitness center login selector is ".login-btn"\n- Successfully extracted schedule using standard table parsing.\n- User preferred workout is High-Intensity Interval Training.`}
                                    />
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">task_plan.md</span>
                                        <button className="p-1 hover:text-white transition-colors"><Save className="w-4 h-4" /></button>
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent p-6 text-sm font-mono text-slate-300 outline-none h-64 resize-none"
                                        defaultValue={`### Current Roadmap\n[x] Initialize FitnessFlow identity\n[ ] Automate daily schedule check\n[ ] Implement automated booking for spinning classes\n[ ] Connect to health metrics API`}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">Reset Soul to Default</button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        Save Configuration <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${active
                ? 'text-blue-500 border-blue-500 bg-blue-500/5'
                : 'text-slate-500 border-transparent hover:bg-slate-800/20 hover:text-slate-300'}`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-blue-500' : 'text-slate-500'}`} />
            {label}
        </button>
    );
}
