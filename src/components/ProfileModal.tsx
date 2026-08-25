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
  onOpenCommunity?: () => void;
  onRoomLeft?: (communityName: string) => void;
}

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  onLogout,
  onOpenCommunity,
  onRoomLeft,
}) => {
  const [callsign, setCallsign] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isCustomFleet =
    user.community &&
    user.community !== 'Global Explorers' &&
    user.community !== 'Solo Orbit' &&
    user.community !== 'Starfleet Academy';

  useEffect(() => {
    if (isOpen) {
      setCallsign(user.name || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user.name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = callsign.trim();
    if (!trimmed) {
      setError('Callsign cannot be empty');
      return;
    }
    if (trimmed.length > 30) {
      setError('Callsign must be 30 characters or fewer');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await ApiClient.updateProfile(user.id, trimmed);
      onProfileUpdated(res.user);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update callsign');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickLeave = async () => {
    try {
      setLeaving(true);
      setError(null);
      const res = await ApiClient.leaveCommunityRoom(user.id);
      const updatedUser = { ...user, community: res.community || 'Global Explorers' };
      onProfileUpdated(updatedUser);
      if (onRoomLeft) {
        onRoomLeft(res.community || 'Global Explorers');
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to leave fleet');
    } finally {
      setLeaving(false);
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
            <User className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Pilot Profile</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Mission Control Identity</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-xs font-mono text-[#00ff88] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
              Account Email
            </label>
            <div className="w-full bg-[#070714] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#8080a0] flex items-center justify-between">
              <span>{user.email}</span>
              <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
            </div>
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold flex justify-between">
              <span>Pilot Callsign / Display Name</span>
              <span className="text-[#00f0ff]">Max 30 chars</span>
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

          <div className="p-3.5 rounded-xl bg-[#0c0c1f] border border-white/5 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8080a0]">Fleet / Community:</span>
              <span className="text-[#00f0ff] font-bold">
                {user.community || 'Solo Orbit'}
              </span>
            </div>

            {isCustomFleet && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                <button
                  type="button"
                  onClick={handleQuickLeave}
                  disabled={leaving}
                  className="px-3 py-1.5 rounded-xl bg-[#ff5e07]/15 hover:bg-[#ff5e07]/25 text-[#ff5e07] border border-[#ff5e07]/30 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5"
                  title="Leave this fleet and return to Global Explorers"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{leaving ? 'Leaving...' : 'Leave Fleet'}</span>
                </button>

                {onOpenCommunity && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCommunity();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/30 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5"
                    title="Open Community Hub to End Community (Admin) or switch rooms"
                  >
                    <span>Manage / End Fleet &rarr;</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-mono pt-1">
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
