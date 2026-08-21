export interface SemanticSignal {
  tier: 'CENTER' | 'BURNING' | 'VERY_HOT' | 'HOT' | 'WARM' | 'LUKEWARM' | 'COOL' | 'COLD' | 'DEEP_SPACE';
  emoji: string;
  label: string;
  color?: string;
  rank?: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  guessesPenalty: number;
  hintsPenalty: number;
  timeBonus: number;
  finalScore: number;
  hintsUsed?: number;
}

export interface GuessResult {
  id?: string;
  word: string;
  normalizedWord: string;
  rank: number;
  semanticScore: number;
  signal: SemanticSignal;
  guessesCount?: number;
  isSolved?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  createdAt?: string;
}

export interface SessionSummary {
  sessionId: string;
  puzzleDate: string;
  puzzleDifficulty: string;
  solved: boolean;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  revealedHints: string[];
  bestRank: number | null;
  startedAt?: string | Date;
  completedAt?: string | Date | null;
  guesses: GuessResult[];
  // Aliases
  date?: string;
  difficulty?: string;
  status?: string;
  unlockedHints?: string[];
}

export interface HintResult {
  hintNumber: number;
  hintText: string;
  hintsUsed: number;
  remainingHints: number;
  penaltyCost: number;
}

export interface AIRoast {
  roastText: string;
  style: 'friendly' | 'savage' | 'hype' | 'balanced';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  guessesCount?: number;
  hintsUsed?: number;
  completedAt?: string;
}

export interface LeaderboardResponse {
  date: string;
  totalEntries: number;
  leaderboard: LeaderboardEntry[];
}