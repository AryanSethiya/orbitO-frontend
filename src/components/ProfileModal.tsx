import { useState, useEffect, type FC } from 'react';
import type { UserProfile } from '../types/game';
import { ApiClient } from '../api/client';

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
  const [callsign, setCallsign] = useState(user.name || user.username || '');
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
      setCallsign(user.name || user.username || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user.name, user.username]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = callsign.trim();
    if (!trimmed) {
      setError('Callsign cannot be empty');
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
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Callsign is already claimed by another pilot.');
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
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to leave fleet');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
      <div className="w-full max-w-md bg-[#131313] border border-primary/40 relative p-4 sm:p-8 shadow-[0_0_30px_rgba(72,255,72,0.15)] text-left font-telemetry-md my-auto max-h-[90vh] flex flex-col">
        {/* HUD Corners */}
        <div className="telemetry-corner corner-tl text-primary text-[10px] sm:text-xs">DOSSIER_REF: 0x9A</div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Header */}
        <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
          <div className="font-label-caps text-[11px] sm:text-xs text-primary/80 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            PILOT DOSSIER
          </div>
          <h2 className="font-display-hero text-xl sm:text-3xl text-primary uppercase tracking-tight leading-none">
            Identification
          </h2>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-error-container/30 border border-error text-error text-xs font-telemetry-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">warning</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 bg-primary/10 border border-primary text-primary text-xs font-telemetry-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">verified</span>
            <span>DOSSIER SYNCHRONIZED SUCCESSFULLY</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-0.5">
          <div>
            <label className="font-label-caps text-xs text-on-surface-variant uppercase block mb-1 font-bold">
              SECURITY EMAIL
            </label>
            <div className="w-full bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-on-surface-variant/70 font-mono break-all">
              {user.email || 'AUTHENTICATED_PILOT'}
            </div>
          </div>

          <div>
            <label className="font-label-caps text-xs text-on-surface-variant uppercase block mb-1 font-bold">
              PILOT CALLSIGN
            </label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              maxLength={30}
              placeholder="e.g. CMDR_ALPHA"
              required
              className="w-full bg-black/60 border border-primary/50 px-3.5 py-2.5 text-base sm:text-sm font-telemetry-md text-primary font-bold input-glow uppercase tracking-wider"
            />
          </div>

          <div className="p-3 bg-black/40 border border-white/10 space-y-2 text-xs font-telemetry-sm">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">FLEET AFFILIATION:</span>
              <span className="text-primary font-bold">
                {user.community || 'Global Explorers'}
              </span>
            </div>

            {isCustomFleet && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleQuickLeave}
                  disabled={leaving}
                  className="font-label-caps text-[10px] text-error hover:text-white transition-colors uppercase cursor-pointer"
                >
                  {leaving ? 'LEAVING FLEET...' : '[ LEAVE FLEET ]'}
                </button>

                {onOpenCommunity && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCommunity();
                    }}
                    className="font-label-caps text-[10px] text-primary hover:underline uppercase cursor-pointer"
                  >
                    MANAGE FLEETS &rarr;
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 font-label-caps text-xs">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-primary text-black font-bold uppercase tracking-wider glitch-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm font-bold">save</span>
              <span>{saving ? 'UPDATING...' : 'SAVE CALLSIGN'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-3 bg-black/60 border border-white/20 hover:border-error text-on-surface-variant hover:text-error transition-colors uppercase font-bold cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
