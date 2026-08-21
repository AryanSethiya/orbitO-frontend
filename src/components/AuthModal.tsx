import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

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
  const [email, setEmail] = useState('aryansethiya111@gmail.com');
  const [pilotName, setPilotName] = useState('Aryan Sethiya');
  const [community, setCommunity] = useState('Starfleet Academy');
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
      const userEmail = payload?.email || email;
      const userName = payload?.name || payload?.given_name || pilotName;
      const picture = payload?.picture;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email: userEmail,
        name: userName,
        picture,
        googleId,
        community,
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

  const handleDirectGoogleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter a valid Google email.');
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
        community,
      });

      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Google Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Pilot Identity &amp; Fleet Standing</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Community / Fleet selector */}
        <div className="mb-4 text-left">
          <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Select Your Fleet</label>
          <select
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#00f0ff] focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="Starfleet Academy">🚀 Starfleet Academy</option>
            <option value="Nebula Squad">🌌 Nebula Squad</option>
            <option value="Cosmic Voyagers">🛸 Cosmic Voyagers</option>
            <option value="Astrophysicists">🔭 Astrophysicists</option>
            <option value="Global Explorers">🧭 Global Explorers</option>
          </select>
        </div>

        {/* Direct Google Account Sign-In */}
        <div className="p-4 rounded-2xl bg-[#0c0c1f] border border-[#00f0ff]/20 flex flex-col gap-3 mb-4 text-left">
          <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Sign in with Google Account
          </span>

          <div>
            <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1">Google Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@gmail.com"
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div>
            <label className="font-mono text-[9px] text-[#8080a0] uppercase block mb-1">Pilot Name / Callsign</label>
            <input
              type="text"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
              placeholder="Aryan Sethiya"
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <button
            onClick={handleDirectGoogleLogin}
            disabled={loading || !email.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
          >
            <span>Authenticate as {pilotName || 'Pilot'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Google Identity One-Tap */}
        <div className="w-full flex flex-col items-center justify-center pt-1 border-t border-white/5">
          <span className="font-mono text-[9px] text-[#8080a0] uppercase mb-2">Or via Google Cloud Identity Button</span>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google OAuth Client not configured in Google Console yet. Use the Google Sign-In above!')}
            theme="filled_black"
            shape="pill"
            size="medium"
            text="continue_with"
          />
        </div>

      </div>
    </div>
  );
};