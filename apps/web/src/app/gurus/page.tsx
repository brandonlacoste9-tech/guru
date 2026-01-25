'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Scissors, Settings, LogOut, Bell, ShoppingBag, Plus, MessageCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Guru {
    id: string;
    name: string;
    description: string;
    category: string;
    personality: string;
    avatarUrl?: string;
    accentColor: string;
    stats?: {
        totalRuns: number;
        successRate: number;
    };
}

export default function GurusPage() {
    const [gurus, setGurus] = useState<Guru[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchGurus();
    }, []);

    const fetchGurus = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/gurus');
            if (res.ok) {
                const data = await res.json();
                setGurus(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Guru?')) return;
        try {
            await fetch(`http://localhost:4000/api/gurus/${id}`, { method: 'DELETE' });
            fetchGurus();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Sidebar (Duplicated for now) */}
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
                    <NavItem icon={LayoutDashboard} label="Dashboard" onClick={() => router.push('/dashboard')} />
                    <NavItem icon={Scissors} label="Guru Skills" active onClick={() => { }} />
                    <NavItem icon={ShoppingBag} label="Marketplace" onClick={() => router.push('/dashboard?tab=marketplace')} />
                    <NavItem icon={Bell} label="Notifications" badge="3" />
                    <NavItem icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                        <LogOut className="w-5 h-5" />
                        <span className="hidden lg:block font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pl-20 lg:pl-64 pt-6 pb-20">
                <header className="px-8 flex items-center justify-between mb-12">
                    <h1 className="text-3xl font-bold text-white">My Gurus</h1>
                    <Link href="/gurus/create">
                        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            <Plus className="w-5 h-5" /> Create Guru
                        </button>
                    </Link>
                </header>

                <div className="max-w-7xl mx-auto px-8">
                    {loading ? (
                        <div className="text-center py-20 text-slate-500">Loading Gurus...</div>
                    ) : gurus.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Scissors className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white">No Gurus Found</h3>
                            <p className="text-slate-400 max-w-md mx-auto">You haven&apos;t created any AI Gurus yet. Start by building your first specialized assistant.</p>
                            <Link href="/gurus/create">
                                <button className="mt-6 px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors">
                                    Build Your First Guru
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {gurus.map((guru) => (
                                <motion.div
                                    key={guru.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="group relative bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 transition-all hover:bg-slate-900/80"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-3xl border border-slate-800 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                                {/* Use personality icon mapping or initial */}
                                                {guru.avatarUrl || '🤖'}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{guru.name}</h3>
                                                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{guru.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(guru.id)}
                                                className="p-2 hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-slate-400 text-sm line-clamp-2 h-10 mb-6">
                                        {guru.description || "A specialized AI assistant for your automations."}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                            <div className="text-lg font-bold text-white">{guru.stats?.totalRuns || 0}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Missions</div>
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                            <div className="text-lg font-bold text-green-400">{guru.stats?.successRate || 100}%</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Success</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 py-3 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                            <MessageCircle className="w-4 h-4" /> Chat
                                        </button>
                                        <button className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
                                            View Logs
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
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
