'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Wand2 } from 'lucide-react';
import { GuruFormData } from './GuruBuilderWizard';
import { AutomationPreviewModal } from './AutomationPreviewModal';

const AUTOMATION_TEMPLATES = [
    {
        id: 'morning-summary',
        name: 'Morning Summary',
        taskDescription: 'Check my calendar for today and send me a summary of my schedule via notification',
        category: 'productivity',
    },
    {
        id: 'habit-reminder',
        name: 'Habit Reminder',
        taskDescription: 'Send me a reminder to complete my daily habits at scheduled times',
        category: 'wellness',
    },
    {
        id: 'email-digest',
        name: 'Email Digest',
        taskDescription: 'Scan my inbox for important emails and create a priority summary',
        category: 'productivity',
    },
    {
        id: 'workout-log',
        name: 'Workout Logger',
        taskDescription: 'Log my workout completion and track my exercise streak',
        category: 'fitness',
    },
    {
        id: 'expense-tracker',
        name: 'Expense Tracker',
        taskDescription: 'Review recent transactions and categorize spending',
        category: 'finance',
    },
    {
        id: 'learning-practice',
        name: 'Learning Practice',
        taskDescription: 'Generate a daily practice quiz based on my learning goals',
        category: 'learning',
    },
];

interface StepAutomationsProps {
    data: GuruFormData;
    onUpdate: (updates: Partial<GuruFormData>) => void;
}

export function StepAutomations({ data, onUpdate }: StepAutomationsProps) {
    const [showTemplates, setShowTemplates] = useState(false);
    const [customTask, setCustomTask] = useState({ name: '', taskDescription: '' });
    const [testingTask, setTestingTask] = useState<string | null>(null);

    const addAutomation = (automation: { name: string; taskDescription: string }) => {
        const newAutomation = {
            id: crypto.randomUUID(),
            name: automation.name,
            taskDescription: automation.taskDescription,
            enabled: true,
        };
        onUpdate({ automations: [...data.automations, newAutomation] });
    };

    const removeAutomation = (id: string) => {
        onUpdate({ automations: data.automations.filter((a) => a.id !== id) });
    };

    const toggleAutomation = (id: string) => {
        onUpdate({
            automations: data.automations.map((a) =>
                a.id === id ? { ...a, enabled: !a.enabled } : a
            ),
        });
    };

    const addCustomAutomation = () => {
        if (customTask.name && customTask.taskDescription) {
            addAutomation(customTask);
            setCustomTask({ name: '', taskDescription: '' });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Add automations</h2>
                <p className="text-white/60">What should your Guru do for you?</p>
            </div>

            {/* Current Automations */}
            {data.automations.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                        Added Automations ({data.automations.length})
                    </label>
                    <div className="space-y-3">
                        {data.automations.map((automation) => (
                            <div
                                key={automation.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${automation.enabled
                                    ? 'bg-cyan-500/10 border-cyan-500/30'
                                    : 'bg-white/5 border-white/10 opacity-60'
                                    }`}
                            >
                                <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                                <div className="flex-1">
                                    <div className="font-medium text-white">{automation.name}</div>
                                    <div className="text-sm text-white/50 line-clamp-1">
                                        {automation.taskDescription}
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={automation.enabled}
                                        onChange={() => toggleAutomation(automation.id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                                <button
                                    onClick={() => setTestingTask(automation.taskDescription)}
                                    className="p-2 text-white/40 hover:text-cyan-400 transition-colors"
                                    title="Test Automation"
                                >
                                    <Wand2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeAutomation(automation.id)}
                                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add from Templates */}
            <div>
                <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    <Wand2 className="w-4 h-4" />
                    {showTemplates ? 'Hide templates' : 'Choose from templates'}
                </button>

                {showTemplates && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {AUTOMATION_TEMPLATES.filter(
                            (t) => !data.automations.some((a) => a.name === t.name)
                        ).map((template) => (
                            <button
                                key={template.id}
                                onClick={() => addAutomation(template)}
                                className="flex flex-col items-start p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-left"
                            >
                                <span className="font-medium text-white text-sm">{template.name}</span>
                                <span className="text-xs text-white/40 mt-1 line-clamp-2">
                                    {template.taskDescription}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Automation */}
            <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-3">
                    Or create a custom automation
                </label>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={customTask.name}
                        onChange={(e) => setCustomTask({ ...customTask, name: e.target.value })}
                        placeholder="Automation name (e.g., Daily Journal Prompt)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    <textarea
                        value={customTask.taskDescription}
                        onChange={(e) => setCustomTask({ ...customTask, taskDescription: e.target.value })}
                        placeholder="Describe what this automation should do..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    />
                    <button
                        onClick={addCustomAutomation}
                        disabled={!customTask.name || !customTask.taskDescription}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                        Add Automation
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {data.automations.length === 0 && (
                <div className="text-center py-8 text-white/40">
                    <p className="mb-2">No automations added yet</p>
                    <p className="text-sm">Add from templates above or create your own</p>
                </div>
            )}

            <AutomationPreviewModal
                isOpen={!!testingTask}
                onClose={() => setTestingTask(null)}
                taskDescription={testingTask || ''}
            />
        </div>
    );
}
