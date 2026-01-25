'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';

// Step components
import { StepIdentity } from './StepIdentity';
import { StepPersonality } from './StepPersonality';
import { StepAutomations } from './StepAutomations';
import { StepSchedule } from './StepSchedule';
import { StepReview } from './StepReview';

export interface GuruFormData {
    // Identity
    name: string;
    description: string;
    category: string;
    avatarEmoji: string;
    accentColor: string;

    // Personality
    personality: string;
    systemPrompt: string;
    sampleMessages: string[];

    // Automations
    automations: {
        id: string;
        name: string;
        taskDescription: string;
        enabled: boolean;
    }[];

    // Schedule
    schedule: {
        enabled: boolean;
        time: string;
        days: string[];
        timezone: string;
    };

    // Notifications
    notifications: {
        sendStart: boolean;
        sendComplete: boolean;
        sendErrors: boolean;
        channels: string[];
    };
}

const INITIAL_DATA: GuruFormData = {
    name: '',
    description: '',
    category: 'productivity',
    avatarEmoji: '🤖',
    accentColor: '#FFD700',
    personality: 'friendly',
    systemPrompt: '',
    sampleMessages: [],
    automations: [],
    schedule: {
        enabled: false,
        time: '09:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    notifications: {
        sendStart: false,
        sendComplete: true,
        sendErrors: true,
        channels: ['push', 'email'],
    },
};

const STEPS = [
    { id: 'identity', title: 'Identity', description: 'Name & appearance' },
    { id: 'personality', title: 'Personality', description: 'Voice & style' },
    { id: 'automations', title: 'Automations', description: 'What it does' },
    { id: 'schedule', title: 'Schedule', description: 'When it runs' },
    { id: 'review', title: 'Review', description: 'Confirm & create' },
];

export function GuruBuilderWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<GuruFormData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateFormData = (updates: Partial<GuruFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/gurus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const guru = await response.json();
                // Redirect to dashboard with success message
                window.location.href = '/dashboard?created=' + guru.id;
            } else {
                throw new Error('Failed to create guru');
            }
        } catch (error) {
            console.error('Error creating guru:', error);
            alert('Failed to create guru. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <StepIdentity data={formData} onUpdate={updateFormData} />;
            case 1:
                return <StepPersonality data={formData} onUpdate={updateFormData} />;
            case 2:
                return <StepAutomations data={formData} onUpdate={updateFormData} />;
            case 3:
                return <StepSchedule data={formData} onUpdate={updateFormData} />;
            case 4:
                return <StepReview data={formData} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        Create Your Guru
                    </h1>
                    <p className="text-white/60 mt-2">
                        Build a custom AI assistant tailored to your needs
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => index < currentStep && setCurrentStep(index)}
                                className={`flex flex-col items-center ${index < currentStep ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${index < currentStep
                                            ? 'bg-green-500 text-white'
                                            : index === currentStep
                                                ? 'bg-amber-500 text-white ring-4 ring-amber-500/30'
                                                : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    {index < currentStep ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={`mt-2 text-xs ${index <= currentStep ? 'text-white' : 'text-white/40'
                                        }`}
                                >
                                    {step.title}
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-white/10'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${currentStep === 0
                                ? 'opacity-0 cursor-default'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {currentStep === STEPS.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Create Guru
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-bold hover:opacity-90 transition-all"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
