// ============================================
// AUTOMATION TASK REGISTRY
// ============================================
// Pre-built browser automation templates for each Guru

export interface AutomationTemplate {
  id: string;
  guruId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  taskDescription: string;
  requiresConfirmation: boolean;
  estimatedDuration: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
}

export const AUTOMATION_TEMPLATES: Record<string, AutomationTemplate> = {
  // 💪 FITNESSFLOW
  'workout-prep': {
    id: 'workout-prep',
    guruId: 'fitnessflow',
    name: 'Workout Prep',
    description: 'Play Spotify workout playlist, enable DND, and open tracking app',
    icon: '🎵',
    category: 'preparation',
    taskDescription: 'Go to Spotify, play the "Workout" playlist. Then update Slack status to "Training 💪". Finally open MyFitnessPal.',
    requiresConfirmation: false,
    estimatedDuration: 30,
    difficulty: 'easy'
  },
  'book-gym-class': {
    id: 'book-gym-class',
    guruId: 'fitnessflow',
    name: 'Book Gym Class',
    description: 'Navigate to gym website and book your favorite session',
    icon: '🏋️',
    category: 'booking',
    taskDescription: 'Navigate to the gym reservation page, login with saved credentials, find the next available Spin class, and click book.',
    requiresConfirmation: true,
    estimatedDuration: 60,
    difficulty: 'medium'
  },

  // 📚 STUDYFLOW
  'focus-mode': {
    id: 'focus-mode',
    guruId: 'studyflow',
    name: 'Focus Mode',
    description: 'Block distractions, open study app, and play focus music',
    icon: '🎯',
    category: 'focus',
    taskDescription: 'Open Notion, then open Spotify and play "Deep Focus" playlist. Set a timer for 50 minutes on the browser.',
    requiresConfirmation: false,
    estimatedDuration: 45,
    difficulty: 'easy'
  },

  // 🧘 STRESSFLOW
  'start-meditation': {
    id: 'start-meditation',
    guruId: 'stressflow',
    name: 'Start Meditation',
    description: 'Update Slack status and open meditation space',
    icon: '🧘',
    category: 'wellness',
    taskDescription: 'Update Slack status to "Meditating 🧘". Navigate to Headspace or Calm and start the daily meditation.',
    requiresConfirmation: false,
    estimatedDuration: 30,
    difficulty: 'easy'
  },

  // 🗂️ ORGANIZEFLOW
  'inbox-zero': {
    id: 'inbox-zero',
    guruId: 'organizeflow',
    name: 'Inbox Zero Sprint',
    description: 'Archive promotions and unsubscribe from newsletters',
    icon: '📧',
    category: 'productivity',
    taskDescription: 'Go to Gmail, filter by "category:promotions", select all and archive. Then find emails with "unsubscribe" and list them for review.',
    requiresConfirmation: true,
    estimatedDuration: 120,
    difficulty: 'medium'
  },

  // 🥗 DIETFLOW
  'meal-prep-shopping': {
    id: 'meal-prep-shopping',
    guruId: 'dietflow',
    name: 'Meal Prep Shopping',
    description: 'Add meal plan ingredients to your grocery cart',
    icon: '🛒',
    category: 'nutrition',
    taskDescription: 'Open Instacart, search for ingredients in the "Weekly Meal Plan" and add them to the cart.',
    requiresConfirmation: true,
    estimatedDuration: 180,
    difficulty: 'hard'
  }
};

export const getTemplatesByGuru = (guruId: string) => {
  return Object.values(AUTOMATION_TEMPLATES).filter(t => t.guruId === guruId);
};
