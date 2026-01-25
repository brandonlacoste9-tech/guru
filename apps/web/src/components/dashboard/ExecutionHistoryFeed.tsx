'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ExternalLink, Image as ImageIcon, FileText } from 'lucide-react';

interface MissionRun {
    id: string;
    status: 'success' | 'failed' | 'running';
    summary: string;
    startedAt: string;
    durationMs: number;
    screenshots: string[];
}

interface ExecutionHistoryFeedProps {
    runs: MissionRun[];
}

export function ExecutionHistoryFeed({ runs }: ExecutionHistoryFeedProps) {
    if (runs.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-3xl">
                <p className="text-slate-500 font-medium italic">No mission history yet. Start a run to see logs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {runs.map((run, idx) => (
                <motion.div
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group"
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center border transition-colors ${run.status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                run.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                    'bg-blue-500/10 border-blue-500/30 text-blue-500'
                            }`}>
                            {run.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                run.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h5 className="text-sm font-bold text-slate-200 truncate">Mission {run.id.substring(0, 8)}</h5>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {new Date(run.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">
                                {run.summary}
                            </p>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                    <Clock className="w-3 h-3" /> {(run.durationMs / 1000).toFixed(1)}s
                                </div>

                                {run.screenshots.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-blue-400 group-hover:text-blue-300 transition-colors">
                                        <ImageIcon className="w-3 h-3" /> {run.screenshots.length} Observations
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                    <FileText className="w-3 h-3" /> Snapshot Captured
                                </div>
                            </div>
                        </div>

                        <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Screenshot Preview on Hover */}
                    {run.screenshots.length > 0 && (
                        <div className="hidden group-hover:grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
                            {run.screenshots.slice(0, 4).map((shot, i) => (
                                <div key={i} className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                                    <img src={shot} alt="observation" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity cursor-zoom-in" />
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
