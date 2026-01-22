// ============================================
// FLOGURU - GURU CORE INTELLIGENCE ENGINE
// ============================================

export interface Guru {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  personality: {
    tone: string;
    style: string;
    catchphrases: string[];
  };
  expertise: string[];
  defaultHabits: Habit[];
  automations: Automation[];
  matchingKeywords: string[];
  matchingScores: {
    challenge: Record<string, number>;
    timeOfDay: Record<string, number>;
    experience: Record<string, number>;
  };
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  defaultTime?: string;
  duration?: number; // minutes
  automatable: boolean;
  automationId?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: 'scheduled' | 'manual' | 'habit_complete' | 'habit_start';
  actions: AutomationAction[];
  requiredPermissions: string[];
  premiumOnly: boolean;
}

export interface AutomationAction {
  type: 'open_url' | 'click' | 'type' | 'wait' | 'notify' | 'api_call';
  target?: string;
  value?: string;
  duration?: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface GuruMatch {
  guru: Guru;
  score: number;
  reasons: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: { value: string; label: string; emoji?: string }[];
  min?: number;
  max?: number;
}
