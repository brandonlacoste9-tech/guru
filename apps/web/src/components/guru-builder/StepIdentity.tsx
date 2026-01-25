'use client';

import { GuruFormData } from './GuruBuilderWizard';

const CATEGORIES = [
    { id: 'productivity', emoji: '📈', label: 'Productivity' },
    { id: 'fitness', emoji: '💪', label: 'Fitness & Health' },
    { id: 'learning', emoji: '📚', label: 'Learning' },
    { id: 'finance', emoji: '💰', label: 'Finance' },
    { id: 'wellness', emoji: '🧘', label: 'Wellness' },
    { id: 'creative', emoji: '🎨', label: 'Creative' },
    { id: 'social', emoji: '🤝', label: 'Social' },
    { id: 'custom', emoji: '⚙️', label: 'Custom' },
];

const EMOJI_OPTIONS = [
    '🤖', '🐝', '🦊', '🦉', '🐙', '🦁', '🐺', '🦅',
    '🌟', '⚡', '🔥', '💎', '🎯', '🚀', '🌊', '🌈',
];

const COLOR_OPTIONS = [
    '#FFD700', // Gold
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#A855F7', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F97316', // Orange
    '#EC4899', // Pink
];

interface StepIdentityProps {
    data: GuruFormData;
    onUpdate: (updates: Partial<GuruFormData>) => void;
}

export function StepIdentity({ data, onUpdate }: StepIdentityProps) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Give your Guru an identity</h2>
                <p className="text-white/60">Choose a name, avatar, and category for your AI assistant</p>
            </div>

            {/* Name Input */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                    Guru Name
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="e.g., Morning Routine Master"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                    Description
                </label>
                <textarea
                    value={data.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder="What does this Guru help you with?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
            </div>

            {/* Category Selection */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                    Category
                </label>
                <div className="grid grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => onUpdate({ category: cat.id })}
                            className={`flex flex-col items-center p-4 rounded-xl border transition-all ${data.category === cat.id
                                    ? 'bg-amber-500/20 border-amber-500 text-white'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-2xl mb-1">{cat.emoji}</span>
                            <span className="text-xs">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Avatar & Color */}
            <div className="grid grid-cols-2 gap-6">
                {/* Avatar Emoji */}
                <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                        Avatar
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => onUpdate({ avatarEmoji: emoji })}
                                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-all ${data.avatarEmoji === emoji
                                        ? 'bg-amber-500/20 ring-2 ring-amber-500'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent Color */}
                <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                        Accent Color
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                            <button
                                key={color}
                                onClick={() => onUpdate({ accentColor: color })}
                                className={`w-10 h-10 rounded-lg transition-all ${data.accentColor === color
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                                        : ''
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/40 mb-3">Preview</p>
                <div
                    className="inline-flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: data.accentColor + '20' }}
                >
                    <span className="text-3xl">{data.avatarEmoji}</span>
                    <div>
                        <div className="font-bold text-white">
                            {data.name || 'Your Guru'}
                        </div>
                        <div className="text-sm text-white/60">
                            {data.description || 'Add a description...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
