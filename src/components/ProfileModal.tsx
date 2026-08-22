import { useState, useEffect, type FC } from 'react';
import type { UserProfile } from '../types/game';
import { ApiClient } from '../api/client';
import { X, User, Check, ShieldCheck, AlertCircle, RefreshCw, Sparkles, LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  onLogout,
}) => {
  const [callsign, setCallsign] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCallsign(user.name || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = callsign.trim();
    if (!trimmed) {
      setError('Callsign cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await ApiClient.updateProfile(user.id, trimmed);
      const updatedUser: UserProfile = {
        ...user,
        name: res.user?.name || trimmed,
      };

      localStorage.setItem('orbito_user', JSON.stringify(updatedUser));
      onProfileUpdated(updatedUser);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to update callsign:', err);
      setError(err.message || 'Failed to update pilot callsign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md stitch-card rounded-3xl p-6 sm:p-8 border border-white/10 relative shadow-2xl text-left">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="relative">
            <img
              src={
                user.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || user.email || 'pilot')}`
              }
              alt="Pilot Avatar"
              className="w-14 h-14 rounded-2xl border-2 border-[#00f0ff] bg-black/50 object-cover shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00ff88] border-2 border-[#05050c] flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-[#05050c]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Profile</h2>
            </div>
            <p className="font-mono text-xs text-[#8080a0] truncate max-w-[220px]">
              {user.email || 'Google Authenticated'}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-xs font-mono text-[#00ff88] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Pilot callsign updated and saved permanently!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] text-[#00f0ff] uppercase block mb-1.5 font-bold tracking-wider">
              Pilot Callsign (Leaderboard & Standings Name)
            </label>
            <div className="relative">
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                maxLength={30}
                placeholder="e.g. AstroNova"
                required
                className="w-full bg-[#070714] border border-white/20 focus:border-[#00f0ff] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#eef2ff] placeholder-[#8080a0] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] transition-all"
              />
              <User className="w-4 h-4 text-[#8080a0] absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="font-mono text-[10px] text-[#8080a0] mt-1.5">
              Saved to database. You won&apos;t be asked to re-enter this when signing in again.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c0c1f] border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8080a0]">Fleet / Community:</span>
              <span className="text-[#00f0ff] font-bold">
                {user.community || 'Solo Orbit'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8080a0]">Status:</span>
              <span className="text-[#00ff88] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                Active Pilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Callsign</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff5e07]/40 hover:text-[#ff5e07] text-[#8080a0] font-mono text-xs font-bold transition-all flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
