'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Coins, Target } from 'lucide-react';

export default function StatsGrid() {
    const stats = [
        { label: 'Current Streak', value: '12 days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Habits Done', value: '85%', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Coins', value: '1,250', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { label: 'Goals Reached', value: '8', icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6"
                >
                    <div className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{stat.value}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}
