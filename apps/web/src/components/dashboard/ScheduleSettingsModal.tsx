'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { useScheduler } from '@/hooks/useScheduler';

interface ScheduleSettingsModalProps {
    guruId: string;
    guruName: string;
    currentTrigger?: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const DAYS = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];

export default function ScheduleSettingsModal({
    guruId,
    guruName,
    currentTrigger,
    isOpen,
    onClose,
    onSave
}: ScheduleSettingsModalProps) {
    const { rescheduleGuru, loading, error } = useScheduler();
    const [time, setTime] = useState(currentTrigger?.time || '09:00');
    const [selectedDays, setSelectedDays] = useState<string[]>(currentTrigger?.days || ['mon', 'tue', 'wed', 'thu', 'fri']);
    const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = async () => {
        const success = await rescheduleGuru(guruId, {
            type: 'schedule',
            time,
            days: selectedDays,
            timezone
        });
        if (success) {
            onSave();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Schedule Guru</h3>
                            <p className="text-xs text-slate-400">Configure when {guruName} runs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Time Picker */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" /> Execution Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-hidden"
                        />
                    </div>

                    {/* Day Picker */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-400" /> Recurring Days
                        </label>
                        <div className="flex justify-between gap-1">
                            {DAYS.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${selectedDays.includes(day.id)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timezone Info */}
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div className="text-xs text-slate-400 leading-relaxed">
                            Your Guru will execute at <strong>{time}</strong> in your local timezone (<strong>{timezone}</strong>).
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-xs text-red-400">
                            Error: {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Save Schedule
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
