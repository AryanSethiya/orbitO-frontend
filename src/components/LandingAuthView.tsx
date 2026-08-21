import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { Shield, Sparkles, Compass, Flame, AlertCircle, Radio, UserCheck, Rocket, CheckCircle2 } from 'lucide-react';

interface LandingAuthViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const LandingAuthView: FC<LandingAuthViewProps> = ({ onLoginSuccess }) => {
  // Step 1: 'google' | Step 2: 'callsign'
  const [step, setStep] = useState<'google' | 'callsign'>('google');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [pilotName, setPilotName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In did not return a valid credential.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = parseJwt(credentialResponse.credential);
      const userEmail = payload?.email;
      const initialName = payload?.name || payload?.given_name || 'Orbital Pilot';
      const picture = payload?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(initialName)}`;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email: userEmail,
        name: initialName,
        picture,
        googleId,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);

      // Pre-fill pilot name from Google and show Custom Callsign Window
      setPendingUser(res.user);
      setPilotName(res.user.name || initialName);
      setStep('callsign');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCallsign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    const trimmedName = pilotName.trim() || pendingUser.name || 'Orbital Pilot';

    try {
      setLoading(true);
      setError(null);

      // Update name in backend if changed
      let finalUser = pendingUser;
      if (trimmedName !== pendingUser.name) {
        try {
          const updateRes = await ApiClient.updateProfile(pendingUser.id, trimmedName);
          finalUser = updateRes.user;
        } catch {
          finalUser = { ...pendingUser, name: trimmedName };
        }
      }

      localStorage.setItem('orbito_user', JSON.stringify(finalUser));
      onLoginSuccess(finalUser);
    } catch (err: any) {
      setError(err.message || 'Failed to update pilot callsign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 pt-12 pb-16 relative z-10">
      {/* Hero Branding */}
      <div className="text-center max-w-xl mx-auto mb-8 flex flex-col items-center">
        <div className="relative mb-4">
          <img
            src="/logo.png"
            alt="oRBITO Logo"
            className="h-20 sm:h-24 w-auto filter drop-shadow-[0_0_25px_rgba(0,240,255,0.7)] hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-2 right-0 px-2 py-0.5 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Live Daily Orbit
          </div>
        </div>

        <h1 className="font-mono text-3xl sm:text-5xl font-black text-[#eef2ff] uppercase tracking-wider">
          oRBITO
        </h1>
        <p className="font-mono text-xs sm:text-sm text-[#00f0ff] uppercase tracking-widest mt-2 font-bold max-w-md">
          Semantic Word Orbit // Daily AI Proximity Puzzle
        </p>
      </div>

      {/* Main Authentication Launchpad Card */}
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/15 relative shadow-[0_0_60px_rgba(0,240,255,0.12)]">
        {error && (
          <div className="p-3 mb-5 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Google Login */}
        {step === 'google' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div className="text-left">
                <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
                <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Strict Google OAuth 2.0 Access</p>
              </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center bg-[#0c0c1f] p-5 rounded-2xl border border-[#00f0ff]/30 shadow-inner">
              <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
                Sign In with Google Account
              </label>
              <div className="w-full flex justify-center">
                {loading ? (
                  <div className="py-2.5 font-mono text-xs text-[#00f0ff] animate-pulse font-bold">
                    Verifying Google Credentials...
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Sign-In was cancelled or failed.')}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="100%"
                  />
                )}
              </div>
            </div>

            <p className="font-mono text-[9px] text-[#8080a0] mt-4 text-center">
              🔒 Strict Google sign-in protects leaderboard integrity and prevents duplicate sessions.
            </p>
          </div>
        )}

        {/* STEP 2: Custom Pilot Name Window */}
        {step === 'callsign' && pendingUser && (
          <form onSubmit={handleConfirmCallsign} className="text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 border border-[#00ff88] flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#00ff88]" />
              </div>
              <div>
                <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Set Pilot Callsign</h2>
                <div className="flex items-center gap-1 text-[#00ff88] text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Google Authenticated</span>
                </div>
              </div>
            </div>

            {/* Google Profile Preview Badge */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0c0c1f] border border-white/10 mb-5">
              <img
                src={pendingUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pendingUser.name || 'pilot')}`}
                alt="Pilot Avatar"
                className="w-10 h-10 rounded-full border border-[#00f0ff]/50 bg-black/40 object-cover"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-mono text-xs font-bold text-[#eef2ff] truncate">{pendingUser.name}</span>
                <span className="font-mono text-[10px] text-[#8080a0] truncate">{pendingUser.email}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
                Customize Your Callsign (Replaces Google Name on Leaderboards)
              </label>
              <input
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="e.g. Commander Nova"
                maxLength={30}
                required
                className="w-full bg-[#070714] border border-[#00f0ff]/40 rounded-2xl px-4 py-3 text-xs font-mono text-[#00f0ff] font-bold focus:outline-none focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/30 transition-all"
              />
              <p className="font-mono text-[9px] text-[#8080a0] mt-1.5">
                You can customize your name now, or keep your Google name.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-black uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>{loading ? 'Entering Orbit...' : `Confirm Callsign & Enter Orbit 🚀`}</span>
            </button>
          </form>
        )}
      </div>

      {/* 3 Visual Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mt-8 text-left">
        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#00f0ff]">
            <Compass className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">1. Daily Orbit</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            One secret target concept every 24 hours across life, arts, science, and nature.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#ffaa00]">
            <Sparkles className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">2. 3D Radar</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            Launch words as probes. Gemini vectors map your conceptual proximity in 3D orbit.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070714]/80 border border-white/10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#ff5e07]">
            <Flame className="w-4 h-4" />
            <span className="font-mono text-xs font-bold uppercase">3. Savage Roast</span>
          </div>
          <p className="font-mono text-[11px] text-[#8080a0] leading-relaxed">
            Hit Rank #1 and receive an unfiltered AI roast streaming your exact guess trajectory.
          </p>
        </div>
      </div>
    </div>
  );
};