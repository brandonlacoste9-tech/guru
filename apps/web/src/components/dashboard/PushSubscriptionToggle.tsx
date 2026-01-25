'use client';

import React, { useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushSubscriptionToggle() {
    const { isSupported, permission, subscription, subscribe, unsubscribe } = usePushNotifications();
    const [loading, setLoading] = useState(false);

    if (!isSupported) {
        return (
            <div className="text-xs text-slate-500 italic">
                Push notifications are not supported in this browser.
            </div>
        );
    }

    const handleToggle = async () => {
        setLoading(true);
        try {
            if (subscription) {
                await unsubscribe();
            } else {
                await subscribe();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subscription ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                    {subscription ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                    <h4 className="font-bold text-white text-sm">Push Notifications</h4>
                    <p className="text-xs text-slate-400">
                        {subscription ? 'You are subscribed' : 'Get real-time updates from your Guru'}
                    </p>
                </div>
            </div>

            <button
                onClick={handleToggle}
                disabled={loading || permission === 'denied'}
                className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${subscription ? 'bg-blue-600' : 'bg-slate-800'
                    } ${loading ? 'opacity-50 cursor-wait' : ''} ${permission === 'denied' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
                <span className="sr-only">Toggle push notifications</span>
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${subscription ? 'translate-x-6' : 'translate-x-1'
                        } flex items-center justify-center`}
                >
                    {loading && <Loader2 className="w-2 h-2 text-blue-600 animate-spin" />}
                </span>
            </button>
        </div>
    );
}
