'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Save, RotateCcw, Activity, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCopilotAction } from "@copilotkit/react-core";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Step {
    id: string;
    action: 'click' | 'input' | 'navigate' | 'wait' | 'type'; // Added 'type' as action
    selector?: string; // Changed from target
    value?: string;
    timestamp: string;
}

interface TeachingUIProps {
    guruId?: string;
}

export default function TeachingUI({ guruId }: TeachingUIProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [name, setName] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'recording' | 'preview' | 'saving'>('idle');
    const [error, setError] = useState<string | null>(null);

    useCopilotAction({
        name: "addStep",
        description: "Add a new browser automation step to the list",
        parameters: [
            { name: "action", type: "string", description: "Action type (click, type, navigate, wait)", required: true },
            { name: "selector", type: "string", description: "CSS selector" },
            { name: "value", type: "string", description: "Input value or URL" }
        ],
        handler: async ({ action, selector, value }) => {
            // Validate action type
            // Validate action type
            const ALL_ACTIONS = ['click', 'input', 'navigate', 'wait', 'type'] as const;
            const validAction = ALL_ACTIONS.includes(action as typeof ALL_ACTIONS[number])
                ? (action as Step['action'])
                : 'wait';

            setSteps(prev => [...prev, {
                id: Date.now().toString(),
                action: validAction,
                selector,
                value,
                timestamp: new Date().toLocaleTimeString()
            }]);
            return "Step added";
        }
    });

    const startRecording = () => {
        setIsRecording(true);
        setStatus('recording');
        setError(null);
        setSteps([]);
    };

    const stopRecording = () => {
        setIsRecording(false);
        setStatus('preview');
    };

    const validateForm = () => {
        if (!name.trim()) return "Automation name is required";
        if (!currentUrl.trim()) return "Starting URL is required";
        if (steps.length === 0) return "Record at least one step";
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setStatus('saving');
            setError(null);

            const response = await fetch("http://localhost:4000/api/guru-automations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    taskDescription: `Automation for ${name}`,
                    steps,
                    startingUrl: currentUrl,
                    guruId,
                }),
            });

            if (!response.ok) throw new Error("Failed to save automation");

            setStatus('idle');
            setName('');
            setCurrentUrl('');
            setSteps([]);
            alert("Guru Automation Saved!");
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to save";
            setError(message);
            setStatus('preview');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Teach Your Guru
                    </h2>
                    <p className="text-slate-400 mt-1">Record a workflow for your Guru to automate for you.</p>
                </div>
                <div className="flex gap-3">
                    {status === 'idle' && (
                        <button
                            onClick={startRecording}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Play className="w-4 h-4" /> Start Recording
                        </button>
                    )}
                    {status === 'recording' && (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium animate-pulse"
                        >
                            <Square className="w-4 h-4" /> Stop Recording
                        </button>
                    )}
                    {status === 'preview' && (
                        <>
                            <button
                                onClick={() => setStatus('idle')}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium"
                            >
                                <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium shadow-lg shadow-green-500/20"
                            >
                                <Save className="w-4 h-4" /> Save Automation
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" /> Automation Details
                        </h3>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Book Yoga Class"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-hidden"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Initial URL</label>
                            <input
                                type="text"
                                value={currentUrl}
                                onChange={(e) => setCurrentUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all outline-hidden"
                            />
                        </div>
                    </div>

                    {/* Recording Stats */}
                    <AnimatePresence>
                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-blue-400">Live Status</span>
                                    {isRecording && <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-blue-500/10">
                                        <div className="text-2xl font-bold text-white">{steps.length}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Steps</div>
                                    </div>
                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-blue-500/10">
                                        <div className="text-2xl font-bold text-white">0.4s</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Latency</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main: Steps Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
                        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-300">Action History</span>
                            </div>
                            {status === 'recording' && (
                                <span className="text-xs text-blue-400 font-medium animate-pulse">Capturing events...</span>
                            )}
                        </div>

                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {steps.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <p>No steps captured yet. Start recording to begin.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {steps.map((step, idx) => (
                                        <motion.div
                                            key={step.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group flex items-start gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all shadow-sm"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-200 uppercase text-[10px] tracking-wider bg-slate-800 px-2 py-0.5 rounded leading-none">
                                                        {step.action}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {step.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    {step.action === 'navigate' ? (
                                                        <>Navigated to <span className="text-blue-400 break-all">{step.value}</span></>
                                                    ) : step.action === 'click' ? (
                                                        <>Clicked element <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-pink-400 text-xs">{step.selector}</code></>
                                                    ) : (
                                                        <>Typed <span className="text-green-400">"{step.value}"</span> into <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-pink-400 text-xs">{step.selector}</code></>
                                                    )}
                                                </p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {status === 'saving' && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="text-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="font-medium text-slate-200">Saving your new Guru Skill...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
