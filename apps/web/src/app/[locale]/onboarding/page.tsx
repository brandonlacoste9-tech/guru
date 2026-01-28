'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import { ONBOARDING_QUIZ, matchGuru, type QuizAnswer, type QuizQuestion } from '@floguru/guru-core';

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [textInput, setTextInput] = useState('');
    const [isMatching, setIsMatching] = useState(false);

    const currentQuestion: QuizQuestion = ONBOARDING_QUIZ[currentStep];
    const progress = ((currentStep + 1) / ONBOARDING_QUIZ.length) * 100;

    const handleAnswer = (answer: string | string[]) => {
        const newAnswers = [
            ...answers,
            { questionId: currentQuestion.id, answer }
        ];
        setAnswers(newAnswers);

        if (currentStep < ONBOARDING_QUIZ.length - 1) {
            setCurrentStep(currentStep + 1);
            setTextInput('');
        } else {
            // Quiz complete - find guru match
            setIsMatching(true);

            // Simulate matching animation
            setTimeout(() => {
                const matches = matchGuru(newAnswers);
                const topMatch = matches[0];

                // Store in localStorage for now (would be database in production)
                localStorage.setItem('floguru_user', JSON.stringify({
                    name: newAnswers.find(a => a.questionId === 'name')?.answer || 'Friend',
                    answers: newAnswers,
                    matchedGuru: topMatch.guru.id,
                    matchScore: topMatch.score
                }));

                // Navigate to result
                router.push(`/onboarding/result?guru=${topMatch.guru.id}`);
            }, 2000);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setAnswers(answers.slice(0, -1));
        }
    };

    // Matching animation screen
    if (isMatching) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    {/* Animated guru emojis */}
                    <div className="flex justify-center gap-4 mb-8">
                        {['🎯', '💪', '📚', '🧘', '📋', '🥗'].map((emoji, i) => (
                            <motion.span
                                key={emoji}
                                className="text-4xl"
                                animate={{
                                    y: [0, -20, 0],
                                    opacity: [0.3, 1, 0.3]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.15
                                }}
                            >
                                {emoji}
                            </motion.span>
                        ))}
                    </div>

                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Finding Your Perfect Guru...
                        </h2>
                        <p className="text-white/60">
                            Analyzing your responses to match you with the ideal coach
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
                <motion.div
                    className="h-full bg-linear-to-r from-cyan-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div className="container mx-auto px-6 py-12 min-h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 text-white/60 hover:text-white transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''
                            }`}
                    >
                        ← Back
                    </button>
                    <div className="text-white/60">
                        {currentStep + 1} / {ONBOARDING_QUIZ.length}
                    </div>
                </div>

                {/* Question */}
                <div className="flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-2xl"
                        >
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                                {currentQuestion.question}
                            </h1>

                            {currentQuestion.subtitle && (
                                <p className="text-white/60 text-center mb-12">
                                    {currentQuestion.subtitle}
                                </p>
                            )}

                            {/* Options */}
                            {currentQuestion.type === 'single' && currentQuestion.options && (
                                <div className="grid gap-4">
                                    {currentQuestion.options.map((option) => (
                                        <motion.button
                                            key={option.value}
                                            onClick={() => handleAnswer(option.value)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-white/20 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                {option.emoji && (
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">
                                                        {option.emoji}
                                                    </span>
                                                )}
                                                <span className="text-white text-lg">{option.label}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Text input */}
                            {currentQuestion.type === 'text' && (
                                <div className="space-y-6">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Enter your name..."
                                        className="w-full p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white text-lg placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                                        autoFocus
                                    />
                                    <motion.button
                                        onClick={() => textInput && handleAnswer(textInput)}
                                        disabled={!textInput}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full p-5 rounded-xl text-white font-bold text-lg transition-all ${textInput
                                                ? 'bg-linear-to-r from-cyan-500 to-purple-600 hover:opacity-90'
                                                : 'bg-white/10 cursor-not-allowed'
                                            }`}
                                    >
                                        Continue →
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="text-center text-white/40 text-sm">
                    <p>Your answers help us find the perfect Guru for you</p>
                </div>
            </div>
        </div>
    );
}
