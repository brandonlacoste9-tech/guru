'use client';

import { Clock, Bell, BellOff, Mail, Smartphone } from 'lucide-react';
import { GuruFormData } from './GuruBuilderWizard';

const DAYS = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];

const TIME_PRESETS = [
    { time: '06:00', label: 'Early Bird (6 AM)' },
    { time: '09:00', label: 'Morning (9 AM)' },
    { time: '12:00', label: 'Noon (12 PM)' },
    { time: '18:00', label: 'Evening (6 PM)' },
    { time: '21:00', label: 'Night (9 PM)' },
];

interface StepScheduleProps {
    data: GuruFormData;
    onUpdate: (updates: Partial<GuruFormData>) => void;
}

export function StepSchedule({ data, onUpdate }: StepScheduleProps) {
    const toggleDay = (dayId: string) => {
        const newDays = data.schedule.days.includes(dayId)
            ? data.schedule.days.filter((d) => d !== dayId)
            : [...data.schedule.days, dayId];
        onUpdate({ schedule: { ...data.schedule, days: newDays } });
    };

    const toggleChannel = (channel: string) => {
        const newChannels = data.notifications.channels.includes(channel)
            ? data.notifications.channels.filter((c) => c !== channel)
            : [...data.notifications.channels, channel];
        onUpdate({ notifications: { ...data.notifications, channels: newChannels } });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Set the schedule</h2>
                <p className="text-white/60">When should your Guru run its automations?</p>
            </div>

            {/* Enable Scheduling */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <div>
                        <div className="font-medium text-white">Enable Scheduled Runs</div>
                        <div className="text-sm text-white/50">Run automations automatically</div>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.schedule.enabled}
                        onChange={(e) =>
                            onUpdate({ schedule: { ...data.schedule, enabled: e.target.checked } })
                        }
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
            </div>

            {data.schedule.enabled && (
                <>
                    {/* Time Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-3">
                            Run Time
                        </label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {TIME_PRESETS.map((preset) => (
                                <button
                                    key={preset.time}
                                    onClick={() =>
                                        onUpdate({ schedule: { ...data.schedule, time: preset.time } })
                                    }
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${data.schedule.time === preset.time
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white/60 text-sm">Or set custom time:</span>
                            <input
                                type="time"
                                value={data.schedule.time}
                                onChange={(e) =>
                                    onUpdate({ schedule: { ...data.schedule, time: e.target.value } })
                                }
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                        </div>
                    </div>

                    {/* Day Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-3">
                            Run Days
                        </label>
                        <div className="flex gap-2">
                            {DAYS.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-12 h-12 rounded-lg font-medium text-sm transition-all ${data.schedule.days.includes(day.id)
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() =>
                                    onUpdate({
                                        schedule: {
                                            ...data.schedule,
                                            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                                        },
                                    })
                                }
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                Weekdays
                            </button>
                            <span className="text-white/20">|</span>
                            <button
                                onClick={() =>
                                    onUpdate({
                                        schedule: {
                                            ...data.schedule,
                                            days: ['sat', 'sun'],
                                        },
                                    })
                                }
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                Weekends
                            </button>
                            <span className="text-white/20">|</span>
                            <button
                                onClick={() =>
                                    onUpdate({
                                        schedule: {
                                            ...data.schedule,
                                            days: DAYS.map((d) => d.id),
                                        },
                                    })
                                }
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                Every day
                            </button>
                        </div>
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                            Timezone
                        </label>
                        <div className="text-sm text-white/60">
                            {data.schedule.timezone}
                            <span className="text-white/30 ml-2">(detected from your browser)</span>
                        </div>
                    </div>
                </>
            )}

            {/* Notification Preferences */}
            <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    Notification Preferences
                </h3>

                <div className="space-y-4">
                    {/* Notification Events */}
                    <div className="grid grid-cols-3 gap-3">
                        <label
                            className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${data.notifications.sendComplete
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={data.notifications.sendComplete}
                                onChange={(e) =>
                                    onUpdate({
                                        notifications: { ...data.notifications, sendComplete: e.target.checked },
                                    })
                                }
                                className="sr-only"
                            />
                            <Bell className="w-5 h-5 text-green-400 mb-2" />
                            <span className="text-sm text-white">On Complete</span>
                        </label>

                        <label
                            className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${data.notifications.sendErrors
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={data.notifications.sendErrors}
                                onChange={(e) =>
                                    onUpdate({
                                        notifications: { ...data.notifications, sendErrors: e.target.checked },
                                    })
                                }
                                className="sr-only"
                            />
                            <BellOff className="w-5 h-5 text-red-400 mb-2" />
                            <span className="text-sm text-white">On Error</span>
                        </label>

                        <label
                            className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${data.notifications.sendStart
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={data.notifications.sendStart}
                                onChange={(e) =>
                                    onUpdate({
                                        notifications: { ...data.notifications, sendStart: e.target.checked },
                                    })
                                }
                                className="sr-only"
                            />
                            <Clock className="w-5 h-5 text-blue-400 mb-2" />
                            <span className="text-sm text-white">On Start</span>
                        </label>
                    </div>

                    {/* Notification Channels */}
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-3">
                            Notify via
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => toggleChannel('push')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${data.notifications.channels.includes('push')
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-white/5 text-white/40 border border-white/10'
                                    }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                Push
                            </button>
                            <button
                                onClick={() => toggleChannel('email')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${data.notifications.channels.includes('email')
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : 'bg-white/5 text-white/40 border border-white/10'
                                    }`}
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
