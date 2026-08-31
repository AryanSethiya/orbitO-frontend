import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { Shield, AlertCircle, X, CheckCircle2, Rocket } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'callsign'>('google');
  const [callsignInput, setCallsignInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      const initialName = payload?.name || payload?.given_name || 'Pilot';
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

      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallsignLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = callsignInput.trim();
    if (!trimmed) return;

    const pilotUser: UserProfile = {
      id: 'pilot_' + Math.random().toString(36).substring(2, 9),
      email: `${trimmed.toLowerCase().replace(/\s+/g, '_')}@orbito.system`,
      username: trimmed,
      name: trimmed,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmed)}`,
      community: 'Global Explorers',
    };

    localStorage.setItem('orbito_user', JSON.stringify(pilotUser));
    localStorage.setItem('orbito_player_id', pilotUser.id);
    onLoginSuccess(pilotUser);
    onClose();

    // Background sync with backend
    try {
      const res = await ApiClient.devLogin(trimmed);
      if (res.token) {
        localStorage.setItem('orbito_auth_token', res.token);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131313] border border-primary/40 relative p-6 sm:p-8 shadow-[0_0_30px_rgba(72,255,72,0.2)] text-left font-telemetry-md">
        {/* HUD Corners */}
        <div className="telemetry-corner corner-tl text-primary font-mono text-[10px]">AUTH_GATE // GOOGLE_CLEARANCE</div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-4 mb-5">
          <div className="font-label-caps text-xs text-primary/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            PILOT IDENTIFICATION REQUIRED
          </div>
          <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight leading-none">
            {authMethod === 'google' ? 'Sign In with Google' : 'Pilot Callsign Access'}
          </h2>
          <p className="font-telemetry-sm text-xs text-on-surface-variant/70 mt-2">
            Authenticate to enter Mission Control, calculate semantic proximity, and record telemetry.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-white/10 mb-5 font-mono text-xs">
          <button
            onClick={() => setAuthMethod('google')}
            className={`flex-1 py-2 text-center uppercase tracking-wider transition-all cursor-pointer font-bold ${
              authMethod === 'google'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => setAuthMethod('callsign')}
            className={`flex-1 py-2 text-center uppercase tracking-wider transition-all cursor-pointer font-bold ${
              authMethod === 'callsign'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Callsign Login
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-error-container/30 border border-error text-error text-xs font-telemetry-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {authMethod === 'google' ? (
          <div className="space-y-4">
            {/* Google Login Box */}
            <div className="bg-black/60 p-5 border border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-primary" />
              </div>

              <label className="font-label-caps text-xs text-white uppercase block mb-3 font-bold tracking-wider">
                AUTHORIZE VIA GOOGLE
              </label>

              {loading ? (
                <div className="py-3 font-telemetry-sm text-xs text-primary animate-pulse font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  <span>SYNCHRONIZING WITH SYSTEM COMMAND...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google clearance cancelled or rejected. Check port 5173.')}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width={300}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-on-surface-variant/60">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>Ensure running on <strong>http://localhost:5173/</strong> for Google OAuth authorization.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCallsignLogin} className="space-y-4">
            <div>
              <label className="font-label-caps text-xs text-white uppercase block mb-1 font-bold">
                ENTER PILOT CALLSIGN
              </label>
              <input
                type="text"
                value={callsignInput}
                onChange={(e) => setCallsignInput(e.target.value)}
                placeholder="e.g. CMDR_VANGUARD"
                maxLength={30}
                required
                autoFocus
                className="w-full bg-black/60 border border-primary/50 px-3.5 py-2.5 text-xs sm:text-sm font-telemetry-md text-primary font-bold input-glow uppercase tracking-wider"
              />
              <p className="font-telemetry-sm text-[10px] text-on-surface-variant/60 mt-1">
                Instantly enter Mission Control without Google OAuth credentials.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !callsignInput.trim()}
              className="w-full py-3.5 px-4 bg-primary text-black font-label-caps text-xs font-bold uppercase tracking-wider glitch-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Rocket className="w-4 h-4" />
              <span>{loading ? 'CALIBRATING...' : 'ENTER MISSION CONTROL'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};