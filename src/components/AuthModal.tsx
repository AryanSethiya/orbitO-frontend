import { useState, type FC, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { AlertCircle, X, Rocket, Check, Lock } from 'lucide-react';

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
  const [step, setStep] = useState<'authenticate' | 'claim_callsign'>('authenticate');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [callsignInput, setCallsignInput] = useState('');
  const [directCallsign, setDirectCallsign] = useState('');
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

      // Check if user already has an established unique callsign
      const isExistingUniqueCallsign = res.user.username && !res.user.username.startsWith('Pilot_') && !res.user.username.startsWith('pilot_');

      if (isExistingUniqueCallsign) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        // Prompt pilot to claim their official, permanent callsign
        setPendingUser(res.user);
        const defaultHandle = (res.user.username || res.user.name || 'PILOT').replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
        setCallsignInput(defaultHandle.startsWith('PILOT_') ? 'CMDR_' + defaultHandle.slice(6) : defaultHandle);
        setStep('claim_callsign');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google clearance authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCallsignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    const finalCallsign = callsignInput.trim().toUpperCase();
    if (!finalCallsign) {
      setError('Please designate a valid Callsign.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update pilot profile with claimed callsign
      const updateRes = await ApiClient.updateProfile(pendingUser.id, finalCallsign);
      const updatedUser: UserProfile = {
        ...pendingUser,
        ...updateRes.user,
        username: finalCallsign,
        name: finalCallsign,
      };

      localStorage.setItem('orbito_user', JSON.stringify(updatedUser));
      onLoginSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      console.warn('Callsign save note:', err);
      setError(err.message || 'Callsign is already claimed by another pilot. Please choose another identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = directCallsign.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a valid Callsign (e.g. CMDR_VALKYRIE).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.devLogin(clean);
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Callsign is protected or registration failed. If bound to Google, please sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1410] border border-primary/50 relative p-6 sm:p-8 shadow-[0_0_50px_rgba(72,255,72,0.3)] text-left font-telemetry-md">
        {/* HUD Corners */}
        <div className="telemetry-corner corner-tl text-primary font-mono text-[10px]">
          {step === 'authenticate' ? 'AUTH_GATE // PILOT_CLEARANCE' : 'PILOT_REGISTRATION // CALLSIGN_CLAIM'}
        </div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 my-4 bg-error-container/30 border border-error text-error text-xs font-telemetry-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'authenticate' ? (
          /* Step 1: Pilot Clearance (Direct Callsign or Google Verification) */
          <div>
            <div className="mt-3 mb-4">
              <div className="font-label-caps text-xs text-primary/80 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                PILOT IDENTIFICATION CLEARANCE
              </div>
              <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight leading-none">
                CLAIM CALLSIGN
              </h2>
              <p className="font-telemetry-sm text-xs text-on-surface-variant/70 mt-2 leading-relaxed">
                Designate your unique pilot callsign to secure your daily streak, lock in today's score, and record your rank on the Space Standings.
              </p>
            </div>

            {/* Direct Instant Callsign Form */}
            <form onSubmit={handleDirectClaimSubmit} className="space-y-3 my-4">
              <div>
                <label className="font-label-caps text-[11px] text-white/90 uppercase block mb-1 font-bold tracking-wider">
                  ENTER PILOT CALLSIGN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directCallsign}
                    onChange={(e) => setDirectCallsign(e.target.value)}
                    placeholder="e.g. CMDR_VALKYRIE"
                    maxLength={24}
                    autoFocus
                    className="flex-1 bg-black/90 border border-primary/60 px-3.5 py-2.5 text-xs font-mono text-primary font-bold uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_12px_rgba(72,255,72,0.15)] placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    disabled={loading || !directCallsign.trim()}
                    className="py-2.5 px-4 bg-primary hover:bg-primary/90 text-black font-mono text-xs font-black uppercase tracking-wider transition-all glitch-hover shrink-0 cursor-pointer disabled:opacity-40 shadow-[0_0_20px_rgba(72,255,72,0.35)]"
                  >
                    {loading ? 'LOCKING...' : '⚡ CLAIM'}
                  </button>
                </div>
              </div>
            </form>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15"></div>
              </div>
              <span className="relative px-3 bg-[#0e1410] font-mono text-[9px] text-white/40 uppercase tracking-widest">
                OR VERIFY VIA GOOGLE
              </span>
            </div>

            {/* Google Login Box */}
            <div className="bg-black/50 p-4 border border-white/10 flex flex-col items-center justify-center text-center">
              {loading ? (
                <div className="py-2 font-telemetry-sm text-xs text-primary animate-pulse font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  <span>SYNCHRONIZING ORBITAL CLEARANCE...</span>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google clearance was cancelled or rejected.')}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width={280}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 p-2.5 bg-white/5 border border-white/10 font-mono text-[10px] text-white/60 text-center leading-relaxed">
              <Lock className="w-3 h-3 inline mr-1 text-primary" />
              1:1 Pilot Protocol • Strictly 1 official flight record per callsign per day.
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-variant hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer py-1"
              >
                &gt; Continue as Casual Guest Pilot &lt;
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Choose Permanent Callsign */
          <form onSubmit={handleClaimCallsignSubmit} className="space-y-4 pt-3">
            <div>
              <div className="font-label-caps text-xs text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>GOOGLE IDENTITY VERIFIED: {pendingUser?.email}</span>
              </div>
              <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                CLAIM PILOT CALLSIGN
              </h2>
              <p className="font-telemetry-sm text-xs text-on-surface-variant/70 leading-relaxed">
                Designate your official permanent flight handle. This callsign will be permanently locked to your Google clearance on the Global Space Standings.
              </p>
            </div>

            <div className="my-4">
              <label className="font-label-caps text-xs text-white uppercase block mb-1.5 font-bold tracking-wider">
                OFFICIAL PILOT CALLSIGN
              </label>
              <input
                type="text"
                value={callsignInput}
                onChange={(e) => setCallsignInput(e.target.value)}
                placeholder="e.g. CMDR_VALKYRIE"
                maxLength={24}
                required
                autoFocus
                className="w-full bg-black/80 border border-primary/60 px-4 py-3 text-sm font-mono text-primary font-bold uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_15px_rgba(72,255,72,0.15)]"
              />
              <span className="font-mono text-[10px] text-white/40 block mt-1">
                Letters, numbers, and underscores allowed (max 24 chars).
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !callsignInput.trim()}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-black font-mono text-xs font-black uppercase tracking-wider glitch-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-[0_0_20px_rgba(72,255,72,0.3)]"
            >
              <Rocket className="w-4 h-4" />
              <span>{loading ? 'LOCKING IN CALLSIGN...' : 'LOCK IN CALLSIGN & ENTER ORBIT'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};