/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on BA v1.1 specification (ADD-05, ADD-07, ADD-09)
 */

import { QuestionProgress, ReviewRating } from '../types';

export interface SM2Result {
  reps: number;
  interval_days: number;
  ease: number;
  lapses: number;
  due_at: number;
  status: 'NEW' | 'LEARNING' | 'MASTERED';
}

/**
 * Calculates updated SM-2 parameters based on user's self-rating
 */
export function calculateSM2(
  current: QuestionProgress | undefined,
  rating: ReviewRating,
  now = Date.now()
): SM2Result {
  const currentReps = current?.reps ?? 0;
  const currentInterval = current?.interval_days ?? 0;
  const currentEase = current?.ease ?? 2.5;
  const currentLapses = current?.lapses ?? 0;

  let newReps = currentReps;
  let newInterval = currentInterval;
  let newEase = currentEase;
  let newLapses = currentLapses;

  switch (rating) {
    case 'AGAIN':
      // Rating 1: Reset repetitions, immediate relearn (1 day), reduce ease factor
      newReps = 0;
      newInterval = 1;
      newEase = Math.max(1.3, Number((currentEase - 0.2).toFixed(2)));
      newLapses = currentLapses + 1;
      break;

    case 'HARD':
      // Rating 2: Minor progress, slight interval increase, reduce ease factor
      newReps = Math.max(1, currentReps);
      newInterval = Math.max(1, Math.round(Math.max(1, currentInterval) * 1.2));
      newEase = Math.max(1.3, Number((currentEase - 0.15).toFixed(2)));
      break;

    case 'GOOD':
      // Rating 3: Standard progression
      newReps = currentReps + 1;
      if (newReps === 1) {
        newInterval = 1;
      } else if (newReps === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentInterval * currentEase);
      }
      // Ease stays steady or slight adjustment
      break;

    case 'EASY':
      // Rating 4: Bonus interval multiplier and increased ease factor
      newReps = currentReps + 1;
      if (newReps === 1) {
        newInterval = 2;
      } else if (newReps === 2) {
        newInterval = 8;
      } else {
        newInterval = Math.round(currentInterval * currentEase * 1.35);
      }
      newEase = Number((currentEase + 0.15).toFixed(2));
      break;
  }

  // Calculate next due timestamp in ms (1 day = 86,400,000 ms)
  const due_at = now + newInterval * 24 * 60 * 60 * 1000;

  // Determine status (ADD-09)
  let status: 'NEW' | 'LEARNING' | 'MASTERED' = 'LEARNING';
  if (newReps >= 3 && newInterval >= 14 && newEase >= 2.2) {
    status = 'MASTERED';
  }

  return {
    reps: newReps,
    interval_days: newInterval,
    ease: newEase,
    lapses: newLapses,
    due_at,
    status
  };
}

export function formatIntervalLabel(days: number): string {
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày';
  if (days < 30) return `${days} ngày`;
  const months = Math.round(days / 30);
  return `${months} tháng`;
}
