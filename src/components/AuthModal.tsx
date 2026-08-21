import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, Sparkles, AlertCircle } from 'lucide-react';

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
  const [callsign, setCallsign] = useState('');
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
      
      // Extract Google profile from ID token
      const payload = parseJwt(credentialResponse.credential);
      const email = payload?.email;
      const name = payload?.name || payload?.given_name || 'Google Pilot';
      const picture = payload?.picture;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email,
        name,
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

  const handleDevPilotLogin = async (pilotName: string, fleet: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.devLogin(pilotName, fleet);
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Callsign login failed');
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
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Authentication</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Google OAuth &amp; Fleet Access</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Community / Fleet selector prior to login */}
        <div className="mb-4 text-left">
          <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Select Your Community / Fleet</label>
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

        {/* Official Google Sign In Button */}
        <div className="w-full flex flex-col items-center justify-center my-3">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Sign-In modal closed or failed.')}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Quick Launch as Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Callsign Input */}
        <div className="flex flex-col gap-3 mb-4 text-left">
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            placeholder="Enter custom callsign (e.g. AstroPioneer)..."
            className="w-full bg-[#070714] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        <button
          onClick={() => handleDevPilotLogin(callsign.trim() || 'AstroPioneer', community)}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch as {callsign.trim() || 'AstroPioneer'}</span>
        </button>
      </div>
    </div>
  );
};