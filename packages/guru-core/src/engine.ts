import { GURUS } from './gurus';
import { QuizAnswer, GuruMatch } from './types';

/**
 * Matches a user with Gurus based on their quiz answers.
 */
export function matchGuru(answers: QuizAnswer[]): GuruMatch[] {
  const scores: Record<string, { score: number; reasons: string[] }> = {};
  
  // Initialize scores for all gurus
  Object.keys(GURUS).forEach(guruId => {
    scores[guruId] = { score: 0, reasons: [] };
  });

  // Process each answer
  answers.forEach(answer => {
    Object.entries(GURUS).forEach(([guruId, guru]) => {
      // Check keyword matches
      const answerStr = Array.isArray(answer.answer) 
        ? answer.answer.join(' ').toLowerCase() 
        : (answer.answer || '').toLowerCase();
      
      guru.matchingKeywords.forEach(keyword => {
        if (answerStr.includes(keyword)) {
          scores[guruId].score += 5;
          scores[guruId].reasons.push(`Matched keyword: ${keyword}`);
        }
      });

      // Check challenge scores
      // Note: mapping 'welcome' question to challenge scores if it aligns
      if (answer.questionId === 'welcome' && guru.matchingScores.challenge[answerStr]) {
        scores[guruId].score += guru.matchingScores.challenge[answerStr];
        scores[guruId].reasons.push(`Goal alignment: ${answerStr}`);
      }

      if (answer.questionId === 'challenge' && guru.matchingScores.challenge[answerStr]) {
        scores[guruId].score += guru.matchingScores.challenge[answerStr];
        scores[guruId].reasons.push(`Challenge alignment: ${answerStr}`);
      }

      // Check time preference
      if (answer.questionId === 'time_preference' && guru.matchingScores.timeOfDay[answerStr]) {
        scores[guruId].score += guru.matchingScores.timeOfDay[answerStr];
      }

      // Check experience level
      if (answer.questionId === 'experience' && guru.matchingScores.experience[answerStr]) {
        scores[guruId].score += guru.matchingScores.experience[answerStr];
      }
    });
  });

  // Sort by score and return matches
  return Object.entries(scores)
    .map(([guruId, data]) => ({
      guru: GURUS[guruId],
      score: data.score,
      reasons: data.reasons
    }))
    .sort((a, b) => b.score - a.score);
}

// Keeping the class wrapper for backward compatibility if needed by the frontend implementation
export class GuruMatchingEngine {
  calculateScores(answers: Record<string, any>, questions: any[]): Record<string, number> {
    const quizAnswers: QuizAnswer[] = Object.entries(answers).map(([id, val]) => ({
      questionId: id,
      answer: val
    }));
    const matches = matchGuru(quizAnswers);
    const scoreMap: Record<string, number> = {};
    matches.forEach(m => {
      scoreMap[m.guru.id] = m.score;
    });
    return scoreMap;
  }

  recommendGurus(scores: Record<string, number>) {
    const sortedSlugs = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([slug]) => slug);

    return {
      primary: GURUS[sortedSlugs[0]],
      secondary: [GURUS[sortedSlugs[1]], GURUS[sortedSlugs[2]]],
    };
  }
}
