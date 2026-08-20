export interface SemanticSignal {
  tier: 'CENTER' | 'BURNING' | 'VERY_HOT' | 'HOT' | 'WARM' | 'LUKEWARM' | 'COOL' | 'COLD' | 'DEEP_SPACE';
  emoji: string;
  label: string;
  color: string;
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
  word: string;
  rank: number;
  similarity: number;
  distance: number;
  signal: SemanticSignal;
  isSolved: boolean;
  scoreBreakdown?: ScoreBreakdown;
}

export interface SessionSummary {
  sessionId: string;
  puzzleId: string;
  date: string;
  difficulty: string;
  status: 'in_progress' | 'solved' | 'abandoned';
  guessesCount: number;
  hintsUsed: number;
  score: number;
  guesses: GuessResult[];
  unlockedHints: string[];
}

export interface HintResult {
  hintText: string;
  hintsUsed: number;
  penalty: number;
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
  guessesCount: number;
  hintsUsed: number;
  completedAt: string;
}

export interface LeaderboardResponse {
  date: string;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
}