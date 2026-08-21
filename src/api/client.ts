import type { SessionSummary, GuessResult, HintResult, AIRoast, LeaderboardResponse, UserProfile } from '../types/game';

const RAW_URL = import.meta.env.VITE_API_URL || 'https://orbito-backend-zacg.onrender.com';
const BASE_URL = RAW_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('orbito_auth_token');
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const targetUrl = `${BASE_URL}/api/v1${cleanPath}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'HTTP Error ' + res.status;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async loginWithGoogle(credentialOrData: { credential?: string; email?: string; name?: string; picture?: string; googleId?: string; community?: string }): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(credentialOrData),
    });
  }

  static async devLogin(callsign: string, community = 'Global Explorers', avatarUrl?: string): Promise<{ user: UserProfile; token: string }> {
    return this.request<{ user: UserProfile; token: string }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ callsign, community, avatarUrl }),
    });
  }

  static async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  static async updateCommunity(userId: string, community: string): Promise<{ success: boolean; community: string }> {
    return this.request<{ success: boolean; community: string }>('/auth/community', {
      method: 'PATCH',
      body: JSON.stringify({ userId, community }),
    });
  }

  static async startSession(userId?: string): Promise<SessionSummary> {
    const payload = userId ? { userId } : {};
    return this.request<SessionSummary>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async submitGuess(sessionId: string, guess: string): Promise<GuessResult> {
    return this.request<GuessResult>(`/sessions/${sessionId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ guess: guess.trim().toLowerCase() }),
    });
  }

  static async requestHint(sessionId: string): Promise<HintResult> {
    return this.request<HintResult>(`/sessions/${sessionId}/hints`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  static async generateRoast(sessionId: string, style: 'friendly' | 'savage' | 'hype' | 'balanced' = 'savage'): Promise<AIRoast> {
    return this.request<AIRoast>(`/sessions/${sessionId}/roast`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }

  static async getDailyLeaderboard(community?: string): Promise<LeaderboardResponse> {
    const query = community && community !== 'Global' && community !== 'All' 
      ? `?community=${encodeURIComponent(community)}` 
      : '';
    return this.request<LeaderboardResponse>(`/leaderboards/daily${query}`);
  }

  static async getCommunities(): Promise<{ communities: string[] }> {
    return this.request<{ communities: string[] }>('/leaderboards/communities');
  }
}