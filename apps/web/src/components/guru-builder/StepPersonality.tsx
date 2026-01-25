'use client';

import { GuruFormData } from './GuruBuilderWizard';

const PERSONALITIES = [
    { id: 'friendly', emoji: '😊', label: 'Friendly', description: 'Warm, encouraging, and supportive' },
    { id: 'professional', emoji: '💼', label: 'Professional', description: 'Formal, focused, and efficient' },
    { id: 'coach', emoji: '🏆', label: 'Coach', description: 'Motivating, challenging, and direct' },
    { id: 'zen', emoji: '🧘', label: 'Zen', description: 'Calm, patient, and mindful' },
    { id: 'energetic', emoji: '⚡', label: 'Energetic', description: 'Upbeat, enthusiastic, and fun' },
    { id: 'custom', emoji: '🎨', label: 'Custom', description: 'Define your own style' },
];

interface StepPersonalityProps {
    data: GuruFormData;
    onUpdate: (updates: Partial<GuruFormData>) => void;
}

export function StepPersonality({ data, onUpdate }: StepPersonalityProps) {
    const selectedPersonality = PERSONALITIES.find((p) => p.id === data.personality);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Define the personality</h2>
                <p className="text-white/60">How should your Guru communicate with you?</p>
            </div>

            {/* Personality Selection */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                    Communication Style
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {PERSONALITIES.map((personality) => (
                        <button
                            key={personality.id}
                            onClick={() => onUpdate({ personality: personality.id })}
                            className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${data.personality === personality.id
                                    ? 'bg-purple-500/20 border-purple-500'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-2xl mb-2">{personality.emoji}</span>
                            <span className="font-medium text-white">{personality.label}</span>
                            <span className="text-xs text-white/50 mt-1">{personality.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* System Prompt */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                    Custom Instructions (Optional)
                </label>
                <p className="text-xs text-white/40 mb-3">
                    Give your Guru specific instructions on how to behave
                </p>
                <textarea
                    value={data.systemPrompt}
                    onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
                    placeholder={`Example: "Always start with a motivational quote. Use emojis occasionally. Remind me of my goals when I seem distracted."`}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
                />
            </div>

            {/* Sample Messages */}
            <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                    Sample Messages (Optional)
                </label>
                <p className="text-xs text-white/40 mb-3">
                    Add example messages to train your Guru's voice
                </p>
                <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                        <input
                            key={index}
                            type="text"
                            value={data.sampleMessages[index] || ''}
                            onChange={(e) => {
                                const newMessages = [...data.sampleMessages];
                                newMessages[index] = e.target.value;
                                onUpdate({ sampleMessages: newMessages.filter(Boolean) });
                            }}
                            placeholder={
                                index === 0
                                    ? '"Great job completing your task! Keep it up! 🎉"'
                                    : index === 1
                                        ? '"Time to start your morning routine!"'
                                        : '"Remember: consistency beats perfection."'
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                        />
                    ))}
                </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/40 mb-3">How your Guru might respond</p>
                <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: data.accentColor + '30' }}
                        >
                            {data.avatarEmoji}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-white mb-1">{data.name || 'Your Guru'}</div>
                            <div className="text-white/70 text-sm">
                                {selectedPersonality?.id === 'friendly' &&
                                    "Hey there! Ready to crush it today? I'm here to help you every step of the way! 🌟"}
                                {selectedPersonality?.id === 'professional' &&
                                    "Good morning. Let's review your priorities for today and ensure optimal productivity."}
                                {selectedPersonality?.id === 'coach' &&
                                    "Time to get after it! No excuses. You've got goals to hit and I'm here to push you!"}
                                {selectedPersonality?.id === 'zen' &&
                                    "Take a deep breath. Let's approach today with intention and mindfulness."}
                                {selectedPersonality?.id === 'energetic' &&
                                    "WOOHOO! Let's GO! Today is going to be AMAZING! 🚀🔥💪"}
                                {selectedPersonality?.id === 'custom' &&
                                    (data.systemPrompt || "Your custom personality will be defined by your instructions.")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
