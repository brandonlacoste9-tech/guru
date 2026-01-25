'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Star, Users, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface GuruTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    avatarEmoji: string;
    accentColor: string;
    downloads: number;
    rating: string;
    price: string | null;
    creatorName: string;
}

export default function Marketplace() {
    const [templates, setTemplates] = useState<GuruTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const CATEGORIES = [
        { id: 'all', label: 'All' },
        { id: 'productivity', label: 'Productivity' },
        { id: 'fitness', label: 'Fitness' },
        { id: 'wellness', label: 'Wellness' },
        { id: 'learning', label: 'Learning' },
    ];

    useEffect(() => {
        // Fetch templates from API
        fetch('/api/marketplace/templates')
            .then(res => res.json())
            .then(data => {
                // If data is an array, use it directly. If it's an object with a 'templates' key, use that.
                const templateList = Array.isArray(data) ? data : (data.templates || []);
                setTemplates(templateList);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Hero */}
            <div className="bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-2xl">
                        🏪
                    </div>
                </div>
                <h1 className="text-4xl font-black text-white mb-3">Guru Marketplace</h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Discover and install pre-trained AI Gurus created by the community.
                    From focused study partners to relentless workout coaches.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search marketplace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-hidden text-white"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
                    ))}
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-white">No Gurus found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}

function TemplateCard({ template }: { template: GuruTemplate }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-full hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
        >
            <div
                className="absolute inset-x-0 -top-24 h-48 opacity-10 blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity"
                style={{ background: template.accentColor }}
            />

            <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-3xl shadow-xl border border-slate-800">
                    {template.avatarEmoji}
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="text-[10px] font-black">{template.rating}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {template.category}
                    </span>
                </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2">{template.name}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">
                {template.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Download className="w-3 h-3 text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">{template.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                        {template.price ? (
                            <span className="text-xs font-bold">${template.price}</span>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span className="text-xs font-black uppercase tracking-tighter">Free</span>
                            </div>
                        )}
                    </div>
                </div>

                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:text-blue-400 transition-colors">
                    Install <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">
                    👤
                </div>
                <span className="text-[10px] text-slate-500 font-bold italic">By {template.creatorName}</span>
            </div>
        </motion.div>
    );
}
