'use client';

import { Check, Clock, Bell, Zap } from 'lucide-react';
import { GuruFormData } from './GuruBuilderWizard';

interface StepReviewProps {
    data: GuruFormData;
}

export function StepReview({ data }: StepReviewProps) {
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formatDays = (days: string[]) => {
        if (days.length === 7) return 'Every day';
        if (
            days.length === 5 &&
            ['mon', 'tue', 'wed', 'thu', 'fri'].every((d) => days.includes(d))
        ) {
            return 'Weekdays';
        }
        if (days.length === 2 && days.includes('sat') && days.includes('sun')) {
            return 'Weekends';
        }
        return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Review your Guru</h2>
                <p className="text-white/60">Make sure everything looks good before creating</p>
            </div>

            {/* Guru Card Preview */}
            <div
                className="p-6 rounded-2xl border-2"
                style={{
                    backgroundColor: data.accentColor + '10',
                    borderColor: data.accentColor + '40',
                }}
            >
                <div className="flex items-start gap-4">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ backgroundColor: data.accentColor + '30' }}
                    >
                        {data.avatarEmoji}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{data.name || 'Unnamed Guru'}</h3>
                        <p className="text-white/60 text-sm mt-1">
                            {data.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: data.accentColor + '20',
                                    color: data.accentColor,
                                }}
                            >
                                {data.category}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/60">
                                {data.personality}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Sections */}
            <div className="grid grid-cols-2 gap-4">
                {/* Automations */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-cyan-400 mb-3">
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">Automations</span>
                    </div>
                    {data.automations.length > 0 ? (
                        <ul className="space-y-2">
                            {data.automations.map((automation) => (
                                <li key={automation.id} className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span className="text-white/80 truncate">{automation.name}</span>
                                    {!automation.enabled && (
                                        <span className="text-xs text-white/30">(disabled)</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-white/40">No automations added</p>
                    )}
                </div>

                {/* Schedule */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Schedule</span>
                    </div>
                    {data.schedule.enabled ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-white/80">
                                    {formatTime(data.schedule.time)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-white/80">{formatDays(data.schedule.days)}</span>
                            </div>
                            <div className="text-xs text-white/40">{data.schedule.timezone}</div>
                        </div>
                    ) : (
                        <p className="text-sm text-white/40">Manual runs only</p>
                    )}
                </div>

                {/* Notifications */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-purple-400 mb-3">
                        <Bell className="w-4 h-4" />
                        <span className="font-medium">Notifications</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        {data.notifications.sendComplete && (
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-white/80">On completion</span>
                            </div>
                        )}
                        {data.notifications.sendErrors && (
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-white/80">On errors</span>
                            </div>
                        )}
                        {data.notifications.sendStart && (
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-white/80">On start</span>
                            </div>
                        )}
                        <div className="text-xs text-white/40">
                            via {data.notifications.channels.join(' & ')}
                        </div>
                    </div>
                </div>

                {/* Personality */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-pink-400 mb-3">
                        <span className="text-base">💬</span>
                        <span className="font-medium">Personality</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="text-white/80 capitalize">{data.personality}</div>
                        {data.systemPrompt && (
                            <div className="text-xs text-white/40 line-clamp-2">
                                {data.systemPrompt}
                            </div>
                        )}
                        {data.sampleMessages.length > 0 && (
                            <div className="text-xs text-white/40">
                                {data.sampleMessages.length} sample message(s)
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Final Confirmation */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">🐝</span>
                    </div>
                    <div>
                        <div className="font-medium text-white">Ready to create your Guru!</div>
                        <div className="text-sm text-white/60 mt-1">
                            Click "Create Guru" below to bring{' '}
                            <span style={{ color: data.accentColor }}>{data.name || 'your Guru'}</span>{' '}
                            to life. You can always edit settings later.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
