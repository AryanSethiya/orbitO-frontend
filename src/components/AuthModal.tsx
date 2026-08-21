import { useState, type FC } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, AlertCircle, User } from 'lucide-react';

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
  const [customCallsign, setCustomCallsign] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In did not return a valid credential.');
      return;
    }

    try {
      
      setError(null);
      const payload = parseJwt(credentialResponse.credential);
      const userEmail = payload?.email;
      const finalName = customCallsign.trim() || payload?.name || payload?.given_name || 'Orbital Pilot';
      const picture = payload?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalName)}`;
      const googleId = payload?.sub;

      const res = await ApiClient.loginWithGoogle({
        credential: credentialResponse.credential,
        email: userEmail,
        name: finalName,
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Verification</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Strict Google OAuth 2.0</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Optional Custom Pilot Callsign Input */}
        <div className="text-left mb-4">
          <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Custom Pilot Callsign (Optional)</span>
          </label>
          <input
            type="text"
            value={customCallsign}
            onChange={(e) => setCustomCallsign(e.target.value)}
            placeholder="e.g. Commander Nova (leave empty for Google name)"
            maxLength={30}
            className="w-full bg-[#070714] border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-[#eef2ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff] transition-colors"
          />
        </div>

        {/* Official Google OAuth Sign-In Button */}
        <div className="w-full flex flex-col items-center justify-center bg-[#0c0c1f] p-4 rounded-2xl border border-[#00f0ff]/20">
          <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-3 font-bold tracking-wider">
            Authorize &amp; Launch with Google
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
    </div>
  );
};