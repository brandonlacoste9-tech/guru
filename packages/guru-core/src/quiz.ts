import { QuizQuestion } from './types';

export const ONBOARDING_QUIZ: QuizQuestion[] = [
  {
    id: 'welcome',
    question: "What brings you to FloGuru?",
    subtitle: "We'll match you with the perfect Guru based on your goals.",
    type: 'single',
    options: [
      { value: 'general_improvement', label: 'General self-improvement', emoji: '🎯' },
      { value: 'fitness', label: 'Get fit and healthy', emoji: '💪' },
      { value: 'learning', label: 'Learn and study better', emoji: '📚' },
      { value: 'stress', label: 'Manage stress and anxiety', emoji: '🧘' },
      { value: 'productivity', label: 'Be more productive', emoji: '📋' },
      { value: 'diet', label: 'Eat healthier', emoji: '🥗' }
    ]
  },
  {
    id: 'challenge',
    question: "What's your biggest challenge right now?",
    subtitle: "Be honest - your Guru will help you overcome this.",
    type: 'single',
    options: [
      { value: 'staying_consistent', label: "Staying consistent with habits", emoji: '🔄' },
      { value: 'finding_time', label: "Finding time for myself", emoji: '⏰' },
      { value: 'motivation', label: "Staying motivated", emoji: '🔥' },
      { value: 'overwhelm', label: "Feeling overwhelmed", emoji: '😵' },
      { value: 'accountability', label: "Holding myself accountable", emoji: '🤝' },
      { value: 'not_knowing', label: "Not knowing where to start", emoji: '🤷' }
    ]
  },
  {
    id: 'time_preference',
    question: "When are you most productive?",
    type: 'single',
    options: [
      { value: 'morning', label: 'Morning person 🌅', emoji: '🌅' },
      { value: 'evening', label: 'Night owl 🦉', emoji: '🦉' },
      { value: 'flexible', label: 'Depends on the day', emoji: '🔀' }
    ]
  },
  {
    id: 'experience',
    question: "How experienced are you with habit tracking?",
    type: 'single',
    options: [
      { value: 'beginner', label: "New to this - need guidance", emoji: '🌱' },
      { value: 'intermediate', label: "Tried before, looking for something better", emoji: '🌿' },
      { value: 'advanced', label: "Habit pro - want powerful tools", emoji: '🌳' }
    ]
  },
  {
    id: 'automation_interest',
    question: "How do you feel about AI helping with your habits?",
    subtitle: "FloGuru can actually DO things for you, not just remind you.",
    type: 'single',
    options: [
      { value: 'love_it', label: "Love it! Automate everything", emoji: '🤖' },
      { value: 'curious', label: "Curious - show me what's possible", emoji: '🔍' },
      { value: 'cautious', label: "Cautious - I prefer manual control", emoji: '🛡️' }
    ]
  },
  {
    id: 'name',
    question: "What should your Guru call you?",
    subtitle: "Your Guru will use this name to encourage you.",
    type: 'text'
  }
];
