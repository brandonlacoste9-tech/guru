import { Guru } from './types';

export const GURUS: Record<string, Guru> = {
  // ==========================================
  // 🎯 HABITFLOW - The Universal Guide
  // ==========================================
  habitflow: {
    id: 'habitflow',
    name: 'HabitFlow',
    emoji: '🎯',
    tagline: 'Master any habit, one day at a time',
    description: 'Your versatile guide for building any habit. HabitFlow adapts to your goals and helps you create sustainable routines that stick.',
    color: {
      primary: '#667eea',
      secondary: '#764ba2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    personality: {
      tone: 'Encouraging and adaptable',
      style: 'Flexible, supportive, celebrates small wins',
      catchphrases: [
        "Every expert was once a beginner.",
        "Progress, not perfection.",
        "You're building something amazing, one day at a time.",
        "The best habit is the one you actually do."
      ]
    },
    expertise: ['habit formation', 'behavior change', 'routine building', 'goal setting', 'motivation'],
    defaultHabits: [
      { id: 'morning-routine', name: 'Morning Routine', emoji: '🌅', description: 'Start your day with intention', frequency: 'daily', defaultTime: '07:00', duration: 30, automatable: false },
      { id: 'daily-reflection', name: 'Daily Reflection', emoji: '📝', description: 'Review your day and plan tomorrow', frequency: 'daily', defaultTime: '21:00', duration: 10, automatable: false },
      { id: 'weekly-review', name: 'Weekly Review', emoji: '📊', description: 'Assess progress and adjust goals', frequency: 'weekly', duration: 30, automatable: false }
    ],
    automations: [],
    matchingKeywords: ['general', 'habits', 'routine', 'goals', 'motivation', 'discipline', 'consistency'],
    matchingScores: {
      challenge: { 'general_improvement': 10, 'building_habits': 10, 'staying_consistent': 8 },
      timeOfDay: { 'morning': 5, 'evening': 5, 'flexible': 8 },
      experience: { 'beginner': 10, 'intermediate': 7, 'advanced': 5 }
    }
  },

  // ==========================================
  // 💪 FITNESSFLOW - The Strength Coach
  // ==========================================
  fitnessflow: {
    id: 'fitnessflow',
    name: 'FitnessFlow',
    emoji: '💪',
    tagline: 'Your body is capable of amazing things',
    description: 'Your personal fitness coach that books classes, tracks workouts, and keeps you moving. FitnessFlow makes staying active effortless.',
    color: {
      primary: '#f97316',
      secondary: '#ea580c',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
    },
    personality: {
      tone: 'Energetic and motivating',
      style: 'High-energy, action-oriented, celebrates gains',
      catchphrases: [
        "Let's get those gains! 💪",
        "Your only competition is who you were yesterday.",
        "Sweat now, shine later!",
        "Strong body, strong mind."
      ]
    },
    expertise: ['exercise', 'workouts', 'gym', 'fitness tracking', 'recovery', 'nutrition basics'],
    defaultHabits: [
      { id: 'workout', name: 'Workout', emoji: '🏋️', description: 'Get your body moving', frequency: 'daily', duration: 45, automatable: true, automationId: 'start-workout-playlist' },
      { id: 'stretch', name: 'Morning Stretch', emoji: '🧘', description: 'Limber up for the day', frequency: 'daily', defaultTime: '07:00', duration: 10, automatable: true },
      { id: 'hydrate', name: 'Hydration Check', emoji: '💧', description: 'Drink your water!', frequency: 'daily', automatable: false },
      { id: 'steps', name: '10K Steps', emoji: '👟', description: 'Keep moving throughout the day', frequency: 'daily', automatable: false }
    ],
    automations: [
      {
        id: 'start-workout-playlist',
        name: 'Start Workout Playlist',
        description: 'Opens Spotify and plays your workout playlist',
        trigger: 'habit_start',
        actions: [
          { type: 'open_url', target: 'https://open.spotify.com/playlist/workout' },
          { type: 'wait', duration: 2000 },
          { type: 'click', target: 'button[data-testid="play-button"]' }
        ],
        requiredPermissions: ['spotify'],
        premiumOnly: false
      },
      {
        id: 'book-gym-class',
        name: 'Book Gym Class',
        description: 'Books your favorite class at your gym',
        trigger: 'scheduled',
        actions: [
          { type: 'open_url', target: 'https://your-gym.com/schedule' },
          { type: 'click', target: '.class-spin' },
          { type: 'click', target: '.book-now' }
        ],
        requiredPermissions: ['gym_account'],
        premiumOnly: true
      }
    ],
    matchingKeywords: ['fitness', 'exercise', 'gym', 'workout', 'health', 'strength', 'cardio', 'weight', 'muscle'],
    matchingScores: {
      challenge: { 'fitness': 10, 'health': 8, 'weight_loss': 9, 'energy': 7 },
      timeOfDay: { 'morning': 8, 'evening': 6, 'flexible': 5 },
      experience: { 'beginner': 8, 'intermediate': 9, 'advanced': 10 }
    }
  },

  // ==========================================
  // 📚 STUDYFLOW - The Knowledge Seeker
  // ==========================================
  studyflow: {
    id: 'studyflow',
    name: 'StudyFlow',
    emoji: '📚',
    tagline: 'Knowledge is power. Let\'s get powerful.',
    description: 'Your academic ally that blocks distractions, schedules study sessions, and helps you retain what you learn. Perfect for students and lifelong learners.',
    color: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    personality: {
      tone: 'Focused and encouraging',
      style: 'Methodical, patient, celebrates understanding',
      catchphrases: [
        "Every page turned is progress made.",
        "Your brain is a muscle. Let's train it.",
        "Focus mode: ACTIVATED 🎯",
        "The more you learn, the more you earn."
      ]
    },
    expertise: ['studying', 'learning', 'focus', 'time management', 'memory', 'note-taking'],
    defaultHabits: [
      { id: 'study-session', name: 'Study Session', emoji: '📖', description: 'Deep focus learning time', frequency: 'daily', duration: 50, automatable: true, automationId: 'focus-mode' },
      { id: 'review-notes', name: 'Review Notes', emoji: '📝', description: 'Spaced repetition review', frequency: 'daily', defaultTime: '20:00', duration: 15, automatable: false },
      { id: 'read', name: 'Reading Time', emoji: '📕', description: 'Read for knowledge or pleasure', frequency: 'daily', duration: 30, automatable: false }
    ],
    automations: [
      {
        id: 'focus-mode',
        name: 'Focus Mode',
        description: 'Blocks distracting sites and opens study materials',
        trigger: 'habit_start',
        actions: [
          { type: 'api_call', target: 'block-sites', value: 'social,entertainment' },
          { type: 'open_url', target: 'https://notion.so' },
          { type: 'notify', value: 'Focus mode activated for 50 minutes 🎯' }
        ],
        requiredPermissions: ['browser_extension'],
        premiumOnly: false
      }
    ],
    matchingKeywords: ['study', 'learn', 'school', 'college', 'exam', 'focus', 'read', 'education', 'student'],
    matchingScores: {
      challenge: { 'learning': 10, 'focus': 9, 'productivity': 7, 'time_management': 8 },
      timeOfDay: { 'morning': 7, 'evening': 8, 'flexible': 6 },
      experience: { 'beginner': 9, 'intermediate': 8, 'advanced': 7 }
    }
  },

  // ==========================================
  // 🧘 STRESSFLOW - The Calm Guardian
  // ==========================================
  stressflow: {
    id: 'stressflow',
    name: 'StressFlow',
    emoji: '🧘',
    tagline: 'Peace is not the absence of chaos. It\'s your response to it.',
    description: 'Your mindfulness mentor that manages notifications, guides breathing exercises, and creates space for calm. Let StressFlow be your sanctuary.',
    color: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    personality: {
      tone: 'Calm and reassuring',
      style: 'Gentle, present, creates space',
      catchphrases: [
        "Breathe. You are exactly where you need to be.",
        "This too shall pass. Let's ride it together.",
        "Your peace matters. Protect it.",
        "Inhale calm. Exhale chaos. 🌊"
      ]
    },
    expertise: ['meditation', 'breathing', 'stress management', 'mindfulness', 'anxiety', 'sleep'],
    defaultHabits: [
      { id: 'morning-meditation', name: 'Morning Meditation', emoji: '🧘', description: 'Start the day centered', frequency: 'daily', defaultTime: '07:30', duration: 10, automatable: true, automationId: 'meditation-session' },
      { id: 'breathing-break', name: 'Breathing Break', emoji: '🌬️', description: 'Pause and breathe deeply', frequency: 'daily', duration: 5, automatable: true },
      { id: 'gratitude', name: 'Gratitude Journal', emoji: '🙏', description: 'Note 3 things you\'re grateful for', frequency: 'daily', defaultTime: '21:00', duration: 5, automatable: false },
      { id: 'digital-detox', name: 'Digital Detox', emoji: '📵', description: 'Unplug and be present', frequency: 'daily', defaultTime: '20:00', duration: 60, automatable: true }
    ],
    automations: [
      {
        id: 'meditation-session',
        name: 'Start Meditation',
        description: 'Opens Headspace/Calm and starts a session',
        trigger: 'habit_start',
        actions: [
          { type: 'api_call', target: 'slack-status', value: 'Meditating 🧘' },
          { type: 'open_url', target: 'https://headspace.com/meditation' },
          { type: 'notify', value: 'Your meditation space is ready. Breathe. 🌊' }
        ],
        requiredPermissions: ['meditation_app', 'slack'],
        premiumOnly: false
      },
      {
        id: 'wind-down',
        name: 'Wind Down Mode',
        description: 'Dims screen, plays calm music, blocks stimulating content',
        trigger: 'scheduled',
        actions: [
          { type: 'api_call', target: 'screen-dim', value: '50' },
          { type: 'open_url', target: 'https://open.spotify.com/playlist/sleep' },
          { type: 'api_call', target: 'block-sites', value: 'social,news' }
        ],
        requiredPermissions: ['system', 'spotify'],
        premiumOnly: true
      }
    ],
    matchingKeywords: ['stress', 'anxiety', 'calm', 'meditation', 'mindfulness', 'relax', 'peace', 'mental health', 'breathing'],
    matchingScores: {
      challenge: { 'stress': 10, 'anxiety': 10, 'mental_health': 9, 'sleep': 7, 'overwhelm': 9 },
      timeOfDay: { 'morning': 8, 'evening': 9, 'flexible': 6 },
      experience: { 'beginner': 10, 'intermediate': 8, 'advanced': 6 }
    }
  },

  // ==========================================
  // 📋 ORGANIZEFLOW - The Order Architect
  // ==========================================
  organizeflow: {
    id: 'organizeflow',
    name: 'OrganizeFlow',
    emoji: '📋',
    tagline: 'A place for everything, and everything in its place.',
    description: 'Your productivity partner that tames your inbox, schedules your tasks, and brings order to chaos. OrganizeFlow turns overwhelm into action.',
    color: {
      primary: '#10b981',
      secondary: '#059669',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    personality: {
      tone: 'Efficient and satisfying',
      style: 'Systematic, clear, celebrates completion',
      catchphrases: [
        "Inbox zero is not a dream. It's a habit.",
        "Organize your space, organize your mind.",
        "Done is better than perfect. Let's get it done.",
        "Every task completed is a victory. 🏆"
      ]
    },
    expertise: ['productivity', 'organization', 'email', 'time management', 'task management', 'planning'],
    defaultHabits: [
      { id: 'inbox-zero', name: 'Inbox Zero', emoji: '📧', description: 'Process and clear your inbox', frequency: 'daily', defaultTime: '09:00', duration: 20, automatable: true, automationId: 'email-cleanup' },
      { id: 'daily-plan', name: 'Daily Planning', emoji: '📝', description: 'Plan your top 3 priorities', frequency: 'daily', defaultTime: '08:00', duration: 10, automatable: false },
      { id: 'weekly-cleanup', name: 'Weekly Cleanup', emoji: '🧹', description: 'Organize files and clear clutter', frequency: 'weekly', duration: 30, automatable: true }
    ],
    automations: [
      {
        id: 'email-cleanup',
        name: 'Email Cleanup',
        description: 'Opens Gmail and helps archive old emails',
        trigger: 'habit_start',
        actions: [
          { type: 'open_url', target: 'https://mail.google.com' },
          { type: 'notify', value: 'Let\'s get to inbox zero! 📧' }
        ],
        requiredPermissions: ['gmail'],
        premiumOnly: false
      }
    ],
    matchingKeywords: ['organize', 'productivity', 'email', 'tasks', 'planning', 'schedule', 'time', 'inbox', 'clutter'],
    matchingScores: {
      challenge: { 'productivity': 10, 'organization': 10, 'time_management': 9, 'overwhelm': 8 },
      timeOfDay: { 'morning': 9, 'evening': 5, 'flexible': 7 },
      experience: { 'beginner': 7, 'intermediate': 9, 'advanced': 8 }
    }
  },

  // ==========================================
  // 🥗 DIETFLOW - The Nutrition Navigator
  // ==========================================
  dietflow: {
    id: 'dietflow',
    name: 'DietFlow',
    emoji: '🥗',
    tagline: 'Nourish your body. Fuel your life.',
    description: 'Your nutrition companion that plans meals, orders groceries, and tracks what you eat. DietFlow makes healthy eating the easy choice.',
    color: {
      primary: '#22c55e',
      secondary: '#16a34a',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    },
    personality: {
      tone: 'Nurturing and knowledgeable',
      style: 'Supportive, educational, celebrates nourishment',
      catchphrases: [
        "You are what you eat. Let's make it good!",
        "Healthy doesn't mean boring. Trust me.",
        "Every meal is a chance to nourish yourself.",
        "Food is fuel. Premium fuel only! ⛽"
      ]
    },
    expertise: ['nutrition', 'meal planning', 'grocery shopping', 'healthy eating', 'cooking', 'calorie tracking'],
    defaultHabits: [
      { id: 'log-meals', name: 'Log Meals', emoji: '📸', description: 'Track what you eat', frequency: 'daily', automatable: false },
      { id: 'meal-prep', name: 'Meal Prep', emoji: '🍳', description: 'Prepare meals for the week', frequency: 'weekly', duration: 120, automatable: true, automationId: 'order-groceries' },
      { id: 'hydrate', name: 'Water Intake', emoji: '💧', description: 'Drink 8 glasses of water', frequency: 'daily', automatable: false },
      { id: 'healthy-snack', name: 'Healthy Snack', emoji: '🍎', description: 'Choose a nutritious snack', frequency: 'daily', automatable: false }
    ],
    automations: [
      {
        id: 'order-groceries',
        name: 'Order Groceries',
        description: 'Opens Instacart and adds your meal prep ingredients',
        trigger: 'manual',
        actions: [
          { type: 'open_url', target: 'https://instacart.com' },
          { type: 'notify', value: 'Time to stock up on healthy goodness! 🥬' }
        ],
        requiredPermissions: ['instacart'],
        premiumOnly: true
      }
    ],
    matchingKeywords: ['diet', 'nutrition', 'food', 'healthy', 'eat', 'meal', 'weight', 'calories', 'cooking'],
    matchingScores: {
      challenge: { 'diet': 10, 'health': 9, 'weight_loss': 10, 'energy': 7, 'nutrition': 10 },
      timeOfDay: { 'morning': 7, 'evening': 6, 'flexible': 8 },
      experience: { 'beginner': 9, 'intermediate': 8, 'advanced': 7 }
    }
  }
};
