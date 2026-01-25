'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GURUS, getTemplatesByGuru, AutomationTemplate } from '@floguru/guru-core';
import ActiveGuruCard from '@/components/dashboard/ActiveGuruCard';
import AutomationGrid from '@/components/dashboard/AutomationGrid';
import StatsGrid from '@/components/dashboard/StatsGrid';
import TeachingUI from '@/components/TeachingUI';
import Marketplace from '@/components/marketplace/Marketplace';
import PushSubscriptionToggle from '@/components/dashboard/PushSubscriptionToggle';
import { ExecutionHistoryFeed } from '@/components/dashboard/ExecutionHistoryFeed';
import GuruRadar from '@/components/dashboard/GuruRadar';
import { LayoutDashboard, Scissors, Settings, LogOut, Bell, Search, User, ShoppingBag } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

export default function DashboardPage() {
    const { user, isLoading, signOut } = useSupabase();
    const [activeTab, setActiveTab] = useState('overview');
    const [showTeachingUI, setShowTeachingUI] = useState(false);
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Mock active guru (usually from DB/profile)
    const activeGuru = GURUS.fitnessflow;
    const templates = getTemplatesByGuru(activeGuru.id);

    const handleRunAutomation = (template: AutomationTemplate) => {
        console.log(`🚀 Triggering automation: ${template.name}`);
        // This would call AutomationService.execute() via the API
        alert(`Triggering Guru Skill: ${template.name}. The agent is starting the task...`);
    };

    const mockRuns = [
        {
            id: 'mission-abc-123',
            status: 'success' as const,
            summary: "Successfully booked the 6:00 PM spinning class at 'The Foundry' for tomorrow. Confirmation email received.",
            startedAt: "2023-10-25T16:00:00.000Z",
            durationMs: 45000,
            screenshots: ['/temp/mock-1.png', '/temp/mock-2.png']
        },
        {
            id: 'mission-xyz-789',
            status: 'failed' as const,
            summary: "Failed to update Slack status. Error: Timeout during Slack OAuth handshake. Retrying in automated heal cycle...",
            startedAt: "2023-10-24T09:30:00.000Z",
            durationMs: 120000,
            screenshots: []
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col z-50">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
                        F
                    </div>
                    <span className="hidden lg:block text-2xl font-black bg-white bg-clip-text text-transparent tracking-tighter">
                        FloGuru
                    </span>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavItem icon={Scissors} label="Guru Skills" onClick={() => router.push('/gurus')} />
                    <NavItem icon={ShoppingBag} label="Marketplace" active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} />
                    <NavItem icon={Bell} label="Notifications" badge="3" />
                    <NavItem icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden lg:block font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pl-20 lg:pl-64 pt-6 pb-20">
                <header className="px-8 flex items-center justify-between mb-12">
                    <div className="relative max-w-md w-full hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search skills, habits, or gurus..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-white">{user.email?.split('@')[0] || 'Guru Member'}</div>
                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Member</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 p-0.5 overflow-hidden">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-blue-500 uppercase">
                                {user.email?.[0] || <User className="w-5 h-5 text-slate-500" />}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-8 space-y-12">
                    <AnimatePresence mode="wait">
                        {activeTab === 'marketplace' ? (
                            <motion.div
                                key="marketplace"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Marketplace />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-12"
                            >
                                {/* Hero Section */}
                                <ActiveGuruCard guru={activeGuru} />

                                {/* Grid Section */}
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                    <div className="xl:col-span-2 space-y-12">
                                        <StatsGrid />

                                        <div className="bg-slate-900/30 rounded-3xl p-1 border border-slate-800 flex gap-1 mb-6">
                                            <button
                                                onClick={() => setShowTeachingUI(false)}
                                                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${!showTeachingUI ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                Automation Center
                                            </button>
                                            <button
                                                onClick={() => setShowTeachingUI(true)}
                                                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${showTeachingUI ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                Teach New Skill
                                            </button>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {showTeachingUI ? (
                                                <motion.div
                                                    key="teaching"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                >
                                                    <TeachingUI guruId={activeGuru.id} />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="automation"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                >
                                                    <AutomationGrid templates={templates} onRun={handleRunAutomation} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Right Sidebar: Recent Activity / Community */}
                                    <div className="space-y-8">
                                        <GuruRadar />

                                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                            <h4 className="font-bold text-white mb-6">Mission Intelligence</h4>
                                            <ExecutionHistoryFeed runs={mockRuns} />
                                        </div>

                                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                            <h4 className="font-bold text-white mb-6">Settings</h4>
                                            <PushSubscriptionToggle />
                                        </div>

                                        <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                            <h4 className="font-bold text-lg mb-2">Join the Community</h4>
                                            <p className="text-sm text-indigo-100 mb-4 opacity-80">
                                                Discover and install over 500+ automations created by other users.
                                            </p>
                                            <button
                                                onClick={() => setActiveTab('marketplace')}
                                                className="w-full bg-white text-indigo-600 font-bold py-3 rounded-2xl hover:bg-slate-100 transition-colors shadow-lg"
                                            >
                                                Explore Hub
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

interface NavItemProps {
    icon: any;
    label: string;
    active?: boolean;
    badge?: string;
    onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, badge, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="hidden lg:block font-bold text-sm">{label}</span>
            {badge && (
                <span className="hidden lg:block ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-slate-900">
                    {badge}
                </span>
            )}
        </button>
    );
}


