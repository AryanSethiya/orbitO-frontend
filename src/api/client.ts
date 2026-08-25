import type { GuessResponse, HintResponse, RoastResponse, LeaderboardResponse, UserProfile } from '../types/game';

const LOCAL_URL = 'http://127.0.0.1:3000';
const PROD_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://orbito-backend-zacg.onrender.com').replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

// Primary URL defaults to local when developing locally, with graceful fallback
const RAW_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? LOCAL_URL : PROD_URL;
const BASE_URL = RAW_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}/api/v1${endpoint}`;
    const token = localStorage.getItem('orbito_auth_token');
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let errMessage = `Request failed with status ${res.status}`;
        try {
          const body = await res.json();
          errMessage = body.message || errMessage;
        } catch {}
        throw new Error(errMessage);
      }
      return (await res.json()) as T;
    } catch (err: any) {
      // If local request failed and we are not already on prod, try prod fallback
      if (BASE_URL === LOCAL_URL) {
        try {
          const fallbackUrl = `${PROD_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}/api/v1${endpoint}`;
          const res = await fetch(fallbackUrl, { ...options, headers });
          if (res.ok) return (await res.json()) as T;
        } catch {}
      }
      throw err;
    }
  }

  static async getTodayPuzzle() {
    return this.request<{ id: string; date: string; hints?: [string, string, string] }>('/puzzles/today');
  }

  static async startSession(userId?: string) {
    return this.request<{ sessionId: string; puzzleId: string; date: string; solved?: boolean; score?: number; guesses?: any[]; revealedHints?: string[] }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  static async getSession(sessionId: string) {
    return this.request<any>(`/sessions/${sessionId}`);
  }

  static async submitGuess(sessionId: string, guess: string) {
    return this.request<GuessResponse>(`/sessions/${sessionId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ guess }),
    });
  }

  static async requestHint(sessionId: string, hintIndex?: number) {
    return this.request<HintResponse>(`/sessions/${sessionId}/hints`, {
      method: 'POST',
      body: JSON.stringify({ hintIndex }),
    });
  }

  static async generateRoast(sessionId: string, style: 'savage' | 'playful' | 'hype' = 'playful') {
    return this.request<RoastResponse>(`/sessions/${sessionId}/roast`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }

  static async getLeaderboard(params?: { date?: string; limit?: number; community?: string; roomCode?: string }) {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.community && params.community !== 'Global') query.set('community', params.community);
    if (params?.roomCode) query.set('roomCode', params.roomCode);
    return this.request<LeaderboardResponse>(`/leaderboards/daily?${query.toString()}`);
  }

  static async getActiveCommunities() {
    return this.request<{ communities: string[] }>('/leaderboards/communities');
  }

  static async loginWithGoogle(payload: { credential?: string; email?: string; name?: string; picture?: string; googleId?: string; community?: string }) {
    return this.request<{ token: string; user: UserProfile; isNewUser?: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async devLogin(callsign: string, community?: string) {
    return this.request<{ token: string; user: UserProfile }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ callsign, community }),
    });
  }

  static async updateProfile(userId: string, name: string) {
    return this.request<{ success: boolean; user: UserProfile }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ userId, name }),
    });
  }

  static async getMe() {
    return this.request<UserProfile>('/auth/me');
  }

  static async createCommunityRoom(name: string, creatorId: string) {
    return this.request<{ room: { id: string; code: string; name: string; createdAt: string } }>('/communities/create', {
      method: 'POST',
      body: JSON.stringify({ name, creatorId }),
    });
  }

  static async joinCommunityRoom(code: string, userId: string) {
    return this.request<{ message: string; room: { id: string; code: string; name: string } }>('/communities/join', {
      method: 'POST',
      body: JSON.stringify({ code, userId }),
    });
  }

  static async getUserRooms(userId: string) {
    return this.request<{ rooms: Array<{ id: string; code: string; name: string; creatorId?: string; createdAt: string; joinedAt: string }> }>(`/communities/user/${userId}`);
  }

  static async leaveCommunityRoom(userId: string, roomId?: string, roomCode?: string) {
    return this.request<{ success: boolean; message: string; community: string }>('/communities/leave', {
      method: 'POST',
      body: JSON.stringify({ userId, roomId, roomCode }),
    });
  }

  static async deleteCommunityRoom(code: string, userId: string) {
    return this.request<{ success: boolean; message: string; community: string }>(`/communities/room/${code}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
}