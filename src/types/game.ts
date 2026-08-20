export type ProximityTier = 'CENTER' | 'BURNING' | 'VERY_HOT' | 'HOT' | 'WARM' | 'COLD' | 'DEEP_SPACE';

export interface ProximitySignal {
  tier: ProximityTier;
  label: string;
  emoji: string;
  rank: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  guessesCount: number;
  guessPenaltyTotal: number;
  hintsUsed: number;
  hintPenaltyTotal: number;
  finalScore: number;
}

export interface GuessResult {
  word: string;
  normalizedWord: string;
  rank: number;
  semanticScore: number;
  signal: ProximitySignal;
  guessesCount: number;
  isSolved: boolean;
  scoreBreakdown?: ScoreBreakdown | null;
}

export interface HintResult {
  hintNumber: number;
  hintText: string;
  hintsUsed: number;
  remainingHints: number;
  penaltyCost: number;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  vocabularyVersion: string;
  status: string;
}

export interface SessionSummary {
  sessionId: string;
  puzzleId: string;
  date: string;
  difficulty: string;
  status: 'in_progress' | 'solved' | 'abandoned';
  startedAt: string;
  completedAt?: string | null;
  guessesCount: number;
  hintsUsed: number;
  bestRank?: number | null;
  bestWord?: string | null;
  score: number;
  guesses: GuessResult[];
  unlockedHints: string[];
}

export interface AIRoast {
  sessionId: string;
  roastText: string;
  roastStyle: 'friendly' | 'savage' | 'hype' | 'balanced';
  cached: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  avatarUrl?: string;
}