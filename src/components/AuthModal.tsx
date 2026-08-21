import { useState, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Shield, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [callsign, setCallsign] = useState('');
  const [community, setCommunity] = useState('Starfleet Academy');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDevPilotLogin = async (pilotName: string, fleet: string) => {
    try {
      setLoading(true);
      const res = await ApiClient.devLogin(pilotName, fleet);
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulatedLogin = async () => {
    try {
      setLoading(true);
      const randomSeed = Math.floor(100 + Math.random() * 900);
      const defaultName = callsign.trim() || `Commander_${randomSeed}`;
      const res = await ApiClient.loginWithGoogle({
        email: `${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        name: defaultName,
        picture: `https://lh3.googleusercontent.com/a/default-user-${randomSeed}`,
        community,
      });
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSimulatedLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-[#05050c] font-sans text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3 mb-5 shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="font-mono text-[10px] text-[#8080a0] uppercase">Or Choose Pilot Callsign</span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {/* Callsign & Community Selection */}
        <div className="flex flex-col gap-3 mb-5 text-left">
          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Pilot Callsign</label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="e.g. AstroPioneer, NovaPilot..."
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-[#00f0ff] placeholder:text-[#8080a0]/40 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1">Community / Fleet</label>
            <select
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="w-full bg-[#070714] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#eef2ff] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="Starfleet Academy">Starfleet Academy</option>
              <option value="Nebula Squad">Nebula Squad</option>
              <option value="Cosmic Voyagers">Cosmic Voyagers</option>
              <option value="Astrophysicists">Astrophysicists</option>
              <option value="Global Explorers">Global Explorers</option>
            </select>
          </div>
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