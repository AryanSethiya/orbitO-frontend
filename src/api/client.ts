import type { DailyPuzzle, SessionSummary, GuessResult, HintResult, AIRoast, LeaderboardEntry } from '../types/game';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'Request failed';
      try {
        const err = await res.json();
        errorMsg = err.message || err.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await res.json();

    // Map backend session format if necessary
    if (endpoint === '/sessions' && options.method === 'POST') {
      return {
        sessionId: data.sessionId,
        puzzleId: data.puzzleId || '',
        date: data.puzzleDate || new Date().toISOString().split('T')[0],
        difficulty: data.puzzleDifficulty || 'medium',
        status: data.solved ? 'solved' : 'in_progress',
        startedAt: data.startedAt || new Date().toISOString(),
        completedAt: data.completedAt || null,
        guessesCount: data.guessesCount || 0,
        hintsUsed: data.hintsUsed || 0,
        bestRank: data.bestRank || null,
        score: data.score ?? 1000,
        guesses: (data.guesses || []).map((g: any) => ({
          word: g.word,
          normalizedWord: g.normalizedWord,
          rank: g.rank,
          semanticScore: g.semanticScore,
          signal: g.signal,
          guessesCount: g.rank,
          isSolved: g.rank === 1,
        })),
        unlockedHints: data.revealedHints || [],
      } as unknown as T;
    }

    return data;
  }

  static async getTodayPuzzle(): Promise<DailyPuzzle> {
    return this.request<DailyPuzzle>('/puzzles/today');
  }

  static async startSession(userId?: string): Promise<SessionSummary> {
    return this.request<SessionSummary>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  static async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    return this.request<SessionSummary>(`/sessions/${sessionId}`);
  }

  static async submitGuess(sessionId: string, guess: string): Promise<GuessResult> {
    return this.request<GuessResult>(`/sessions/${sessionId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ guess }),
    });
  }

  static async requestHint(sessionId: string): Promise<HintResult> {
    return this.request<HintResult>(`/sessions/${sessionId}/hints`, {
      method: 'POST',
    });
  }

  static async generateRoast(sessionId: string, style: 'friendly' | 'savage' | 'hype' | 'balanced' = 'savage'): Promise<AIRoast> {
    return this.request<AIRoast>(`/sessions/${sessionId}/roast`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }

  static async getDailyLeaderboard(date?: string): Promise<{ date: string; totalEntries: number; leaderboard: LeaderboardEntry[] }> {
    const query = date ? `?date=${date}` : '';
    return this.request(`/leaderboards/daily${query}`);
  }
}