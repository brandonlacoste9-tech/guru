'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AutomationTemplate } from '@floguru/guru-core';
import { Zap, Play, Clock, BarChart3, ChevronRight } from 'lucide-react';

interface AutomationGridProps {
    templates: AutomationTemplate[];
    onRun: (template: AutomationTemplate) => void;
}

export default function AutomationGrid({ templates, onRun }: AutomationGridProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" /> Guru Skills
                </h3>
                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template, idx) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-900/60 transition-all cursor-pointer"
                        onClick={() => onRun(template)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-2xl border border-slate-800 group-hover:bg-slate-800 transition-colors">
                                {template.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-200 truncate">{template.name}</h4>
                                <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                    {template.description}
                                </p>

                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        <Clock className="w-3 h-3" /> {template.estimatedDuration}s
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        <BarChart3 className="w-3 h-3" /> {template.difficulty}
                                    </div>
                                </div>
                            </div>

                            <button className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-500/0 group-hover:shadow-blue-500/20">
                                <Play className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Custom Automation Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: templates.length * 0.1 }}
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all mb-2">
                        <span className="text-xl font-bold">+</span>
                    </div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-blue-400 transition-colors">Teach New Skill</span>
                </motion.div>
            </div>
        </div>
    );
}
