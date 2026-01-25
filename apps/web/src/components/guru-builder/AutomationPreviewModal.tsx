'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Camera,
    ScrollText,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

interface AutomationPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskDescription: string;
}

export function AutomationPreviewModal({ isOpen, onClose, taskDescription }: AutomationPreviewModalProps) {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('running');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeScreenshot, setActiveScreenshot] = useState(0);

    useEffect(() => {
        if (isOpen) {
            runTest();
        }
    }, [isOpen]);

    const runTest = async () => {
        setStatus('running');
        setResult(null);
        setError(null);

        try {
            const response = await fetch('http://localhost:4000/api/automation/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription }),
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                setStatus('success');
            } else {
                setError(data.error || 'Automation task failed');
                setStatus('error');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect to automation engine');
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-5xl h-[85vh] bg-zinc-900/90 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${status === 'running' ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' :
                                status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {status === 'running' ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                status === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                    <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Automation Intelligence Preview</h3>
                            <p className="text-sm text-white/50 truncate max-w-md">Mission: {taskDescription}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status !== 'running' && (
                            <button
                                onClick={runTest}
                                className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Logs & Stats */}
                    <div className="w-1/3 border-r border-white/5 flex flex-col bg-black/20 overflow-y-auto">
                        <div className="p-6 space-y-8">
                            {/* Stats Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest">
                                    <ScrollText className="w-3 h-3" />
                                    Mission Intel
                                </div>
                                {status === 'running' ? (
                                    <div className="space-y-4">
                                        <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
                                        <div className="h-4 w-2/3 bg-white/5 rounded-full animate-pulse" />
                                        <div className="h-4 w-1/2 bg-white/5 rounded-full animate-pulse" />
                                    </div>
                                ) : result?.success ? (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                            <p className="text-sm text-emerald-400 leading-relaxed font-medium">
                                                {result.summary || "Task completed successfully with structured output."}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Steps</div>
                                                <div className="text-lg font-bold text-white">{result.meta?.steps || 0}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Provider</div>
                                                <div className="text-lg font-bold text-white truncate text-xs mt-1">{result.meta?.provider || "N/A"}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                                        <p className="text-sm text-red-400 font-medium">{error || "Operation failed due to engine interruption."}</p>
                                    </div>
                                )}
                            </div>

                            {/* Visited URLs */}
                            {result?.meta?.urls && result.meta.urls.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest">
                                        <ExternalLink className="w-3 h-3" />
                                        Visited Nodes
                                    </div>
                                    <div className="space-y-2">
                                        {result.meta.urls.map((url: string, idx: number) => (
                                            <div key={idx} className="text-xs text-white/40 truncate hover:text-cyan-400 transition-colors cursor-default">
                                                {url}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Visual Feed */}
                    <div className="flex-1 bg-black/40 relative flex flex-col p-8 items-center justify-center">
                        <div className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest">
                            <Camera className="w-3 h-3" />
                            Visual Feed
                        </div>

                        {status === 'running' ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl" />
                                </div>
                                <p className="text-white/40 font-medium animate-pulse">Establishing browser terminal...</p>
                            </div>
                        ) : result?.screenshots?.length > 0 ? (
                            <div className="w-full h-full flex flex-col gap-6">
                                {/* Main Preview */}
                                <div className="flex-1 relative group bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                                    <img
                                        src={`http://localhost:4000/${result.screenshots[activeScreenshot]}`}
                                        className="w-full h-full object-contain"
                                        alt="Automation step result"
                                    />

                                    {result.screenshots.length > 1 && (
                                        <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                                            <button
                                                onClick={() => setActiveScreenshot(prev => Math.max(0, prev - 1))}
                                                disabled={activeScreenshot === 0}
                                                className={`p-2 rounded-full bg-black/50 text-white pointer-events-auto transition-all ${activeScreenshot === 0 ? 'opacity-0' : 'hover:bg-cyan-500'}`}
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => setActiveScreenshot(prev => Math.min(result.screenshots.length - 1, prev + 1))}
                                                disabled={activeScreenshot === result.screenshots.length - 1}
                                                className={`p-2 rounded-full bg-black/50 text-white pointer-events-auto transition-all ${activeScreenshot === result.screenshots.length - 1 ? 'opacity-0' : 'hover:bg-cyan-500'}`}
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnails */}
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {result.screenshots.map((ss: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveScreenshot(idx)}
                                            className={`min-w-[120px] aspect-video rounded-lg overflow-hidden border transition-all ${activeScreenshot === idx ? 'border-cyan-500 ring-2 ring-cyan-500/20 scale-105' : 'border-white/10 opacity-50 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={`http://localhost:4000/${ss}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-20 px-10 text-center">
                                <div className="p-4 rounded-full bg-white/5 text-white/20">
                                    <Camera className="w-12 h-12" />
                                </div>
                                <p className="text-white/40 max-w-xs">{status === 'error' ? 'Visual feed interrupted due to failure' : 'No visual data captured for this mission'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium border border-white/5"
                    >
                        Dismiss
                    </button>
                    {status === 'success' && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition-all font-bold shadow-lg shadow-cyan-500/20"
                        >
                            Apply Automation
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
