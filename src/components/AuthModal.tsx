import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, AlertCircle, UserCheck, Rocket, CheckCircle2 } from 'lucide-react';

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
  const [step, setStep] = useState<'google' | 'callsign'>('google');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [pilotName, setPilotName] = useState('');
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update pilot callsign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/10 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'google' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <div className="text-left">
                <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Verification</h2>
                <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Strict Google OAuth 2.0</p>
              </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center bg-[#0c0c1f] p-4 rounded-2xl border border-[#00f0ff]/20">
              <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
                Sign in with Google Account
              </label>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In prompt closed or failed.')}
                theme="filled_black"
                shape="pill"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>

            <p className="font-mono text-[9px] text-[#8080a0] mt-3.5 text-center">
              🔒 Strict Google authentication prevents duplicate scoring and leaderboard spam.
            </p>
          </div>
        )}

        {step === 'callsign' && pendingUser && (
          <form onSubmit={handleConfirmCallsign} className="text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#00ff88]/20 border border-[#00ff88] flex items-center justify-center">
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

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0c0c1f] border border-white/10 mb-4">
              <img
                src={pendingUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pendingUser.name || 'pilot')}`}
                alt="Pilot Avatar"
                className="w-9 h-9 rounded-full border border-[#00f0ff]/50 bg-black/40 object-cover"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-mono text-xs font-bold text-[#eef2ff] truncate">{pendingUser.name}</span>
                <span className="font-mono text-[10px] text-[#8080a0] truncate">{pendingUser.email}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
                Custom Callsign (Replaces Google Name)
              </label>
              <input
                type="text"
                value={pilotName}
                onChange={(e) => setPilotName(e.target.value)}
                placeholder="e.g. Commander Nova"
                maxLength={30}
                required
                className="w-full bg-[#070714] border border-[#00f0ff]/40 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-[#00f0ff] font-bold focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider active:scale-95 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              <span>{loading ? 'Launching...' : 'Confirm Callsign & Enter Orbit 🚀'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};