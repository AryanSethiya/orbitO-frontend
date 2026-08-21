import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { Shield, Sparkles, Compass, Flame, ArrowRight, AlertCircle, Radio } from 'lucide-react';

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
  const [email, setEmail] = useState('');
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
      const userEmail = payload?.email || email;
      const userName = payload?.name || payload?.given_name || pilotName || 'Orbital Pilot';
      const picture = payload?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email: userEmail,
        name: userName,
        picture,
        googleId,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your Google email.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const name = pilotName.trim() || email.split('@')[0];
      const picture = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

      const res = await ApiClient.loginWithGoogle({
        email: email.trim().toLowerCase(),
        name,
        picture,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div className="text-left">
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Sign In to Launch Today's Orbit</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Official Google OAuth Button */}
        <div className="w-full flex flex-col items-center justify-center mb-5 bg-[#0c0c1f] p-4 rounded-2xl border border-[#00f0ff]/20 shadow-inner">
          <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
            Sign In with Google Account
          </label>
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In was cancelled or failed.')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width="100%"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Quick Launch Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* 2. Direct Pilot Form */}
        <form onSubmit={handleDirectLogin} className="flex flex-col gap-3 text-left">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1 font-semibold">Google Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@gmail.com"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1 font-semibold">Pilot Callsign</label>
              <input
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="StarVoyager"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            id="landing-launch-btn"
            disabled={loading}
            className="w-full mt-1 py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Initializing Orbit...' : (pilotName.trim() ? `Launch as ${pilotName}` : 'Launch Mission')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
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