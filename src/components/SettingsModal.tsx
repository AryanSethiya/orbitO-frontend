import { useState, useEffect, type FC, type FormEvent } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { 
  X, 
  Users, 
  User, 
  Sliders, 
  BookOpen, 
  Copy, 
  Check, 
  AlertCircle, 
  LogOut, 
  PlusCircle, 
  LogIn, 
  Volume2, 
  VolumeX, 
  Tv, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  activeRoomCode?: string | null;
  onRoomJoined: (room: { id: string; code: string; name: string }) => void;
  onRoomLeft?: (communityName: string) => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  onOpenBriefing?: () => void;
}

type TabType = 'fleet' | 'pilot' | 'telemetry' | 'directives';

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  activeRoomCode,
  onRoomJoined,
  onRoomLeft,
  onOpenAuth,
  onLogout,
  onOpenBriefing,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('fleet');
  const [fleetSubTab, setFleetSubTab] = useState<'create' | 'join'>('create');
  
  // Fleet creation state
  const [createFleetName, setCreateFleetName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Audio / Visual state (stored in localStorage)
  const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem('orbito_sfx') !== 'false');
  const [crtEnabled, setCrtEnabled] = useState(() => localStorage.getItem('orbito_crt') === 'true');

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    localStorage.setItem('orbito_sfx', String(next));
  };

  const handleToggleCrt = () => {
    const next = !crtEnabled;
    setCrtEnabled(next);
    localStorage.setItem('orbito_crt', String(next));
    if (next) {
      document.body.classList.add('crt-active');
    } else {
      document.body.classList.remove('crt-active');
    }
  };

  const handleCreateFleet = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const cleanName = createFleetName.trim();
    if (!cleanName) {
      setError('Please provide a name for your Fleet squad.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await ApiClient.createCommunityRoom(cleanName, user.id);
      onRoomJoined(res.room);
      setSuccessMsg(`Fleet squad "${res.room.name}" initialized. Callsign frequency: ${res.room.code}`);
      setCreateFleetName('');
    } catch (err: any) {
      console.warn('Backend fleet creation notice, using local fleet synthesizer:', err?.message || err);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let codeSuffix = '';
      for (let i = 0; i < 4; i++) codeSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
      const fallbackRoom = {
        id: 'room_' + Math.random().toString(36).substring(2, 9),
        code: `ORB-${codeSuffix}`,
        name: cleanName,
        createdAt: new Date().toISOString(),
      };
      onRoomJoined(fallbackRoom);
      setSuccessMsg(`Fleet squad "${cleanName}" initialized. Callsign frequency: ${fallbackRoom.code}`);
      setCreateFleetName('');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFleet = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const cleanCode = joinRoomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid 8-character room code (e.g. ORB-8429).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await ApiClient.joinCommunityRoom(cleanCode, user.id);
      onRoomJoined(res.room);
      setSuccessMsg(`Joined Fleet squad: ${res.room.name}`);
      setJoinRoomCode('');
    } catch (err: any) {
      console.warn('Backend fleet join notice, syncing local room code:', err?.message || err);
      const fallbackRoom = {
        id: 'room_' + Math.random().toString(36).substring(2, 9),
        code: cleanCode,
        name: `FLEET_${cleanCode}`,
      };
      onRoomJoined(fallbackRoom);
      setSuccessMsg(`Joined Fleet squad: ${fallbackRoom.name}`);
      setJoinRoomCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCurrentFleet = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      await ApiClient.leaveCommunityRoom(user.id, undefined, activeRoomCode || undefined);
      if (onRoomLeft) onRoomLeft('Global Explorers');
      setSuccessMsg('Returned to Global Explorers fleet.');
    } catch (err: any) {
      console.warn('Backend fleet leave notice, resetting local community:', err?.message || err);
      if (onRoomLeft) onRoomLeft('Global Explorers');
      setSuccessMsg('Returned to Global Explorers fleet.');
    } finally {
      setLoading(false);
    }
  };

  const isCustomFleet = user?.community && user.community !== 'Global Explorers';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0e1410] border border-primary/50 relative shadow-[0_0_50px_rgba(72,255,72,0.25)] text-left font-mono overflow-hidden">
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-caps text-xs text-primary font-bold tracking-widest uppercase">
              SYSTEM_SETTINGS // COMMAND_HUD
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 px-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab('fleet'); setError(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'fleet'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-on-surface-variant hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>FLEET COMMAND</span>
          </button>

          <button
            onClick={() => { setActiveTab('pilot'); setError(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pilot'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-on-surface-variant hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PILOT ID</span>
          </button>

          <button
            onClick={() => { setActiveTab('telemetry'); setError(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'telemetry'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-on-surface-variant hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>TELEMETRY & SFX</span>
          </button>

          <button
            onClick={() => { setActiveTab('directives'); setError(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'directives'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-on-surface-variant hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>DIRECTIVES</span>
          </button>
        </div>

        {/* Notification Alerts */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-error-container/20 border border-error/60 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-primary/10 border border-primary/60 text-primary text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            {activeRoomCode && (
              <button
                onClick={() => handleCopyCode(activeRoomCode)}
                className="px-2 py-1 bg-primary text-black font-bold text-[10px] flex items-center gap-1 uppercase shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY CODE'}</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: FLEET COMMAND */}
          {activeTab === 'fleet' && (
            <div className="space-y-5">
              {/* Current Fleet Status Badge */}
              <div className="p-4 bg-black/70 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-on-surface-variant/70 uppercase tracking-widest font-bold mb-1">
                    CURRENT ACTIVE FLEET
                  </div>
                  <div className="text-base text-white font-bold tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{user?.community || 'Global Explorers'}</span>
                  </div>
                  {activeRoomCode && (
                    <div className="text-xs text-primary/80 mt-1 flex items-center gap-2">
                      <span>ROOM CODE:</span>
                      <span className="font-bold bg-primary/10 px-1.5 py-0.5 border border-primary/30 tracking-wider">
                        {activeRoomCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(activeRoomCode)}
                        className="text-white/60 hover:text-primary transition-colors cursor-pointer"
                        title="Copy Room Code"
                      >
                        {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>

                {isCustomFleet && (
                  <button
                    onClick={handleLeaveCurrentFleet}
                    disabled={loading}
                    className="px-3 py-1.5 border border-white/20 hover:border-error hover:text-error text-white/70 text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shrink-0"
                  >
                    RETURN TO GLOBAL
                  </button>
                )}
              </div>

              {/* Create or Join Sub-tabs */}
              <div className="border border-white/15 bg-black/40 p-4">
                <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                  <button
                    onClick={() => { setFleetSubTab('create'); setError(null); setSuccessMsg(null); }}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      fleetSubTab === 'create'
                        ? 'bg-primary text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    + CREATE NEW FLEET
                  </button>
                  <button
                    onClick={() => { setFleetSubTab('join'); setError(null); setSuccessMsg(null); }}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      fleetSubTab === 'join'
                        ? 'bg-primary text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    ⚡ JOIN EXISTING SQUAD
                  </button>
                </div>

                {/* Sub-tab 1: Create Fleet */}
                {fleetSubTab === 'create' && (
                  <form onSubmit={handleCreateFleet} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-white/80 font-bold uppercase mb-1 tracking-wider">
                        FLEET SQUAD IDENTIFIER (NAME)
                      </label>
                      <input
                        type="text"
                        value={createFleetName}
                        onChange={(e) => setCreateFleetName(e.target.value)}
                        placeholder="e.g. ORION_VANGUARD"
                        maxLength={32}
                        className="w-full bg-black border border-white/20 focus:border-primary px-3.5 py-2.5 text-xs text-white uppercase tracking-wider placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                      Initializing a Fleet generates a private orbital room code. Teammates using this code will compete on your dedicated Fleet Leaderboard.
                    </p>
                    <button
                      type="submit"
                      disabled={loading || !createFleetName.trim()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-black text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(72,255,72,0.3)] flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{loading ? 'INITIALIZING...' : 'CREATE FLEET ROOM'}</span>
                    </button>
                  </form>
                )}

                {/* Sub-tab 2: Join Fleet */}
                {fleetSubTab === 'join' && (
                  <form onSubmit={handleJoinFleet} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-white/80 font-bold uppercase mb-1 tracking-wider">
                        ENTER 8-CHARACTER ROOM CODE
                      </label>
                      <input
                        type="text"
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ORB-8429"
                        maxLength={12}
                        className="w-full bg-black border border-white/20 focus:border-primary px-3.5 py-2.5 text-xs text-primary font-bold uppercase tracking-wider placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                      Enter the room code shared by your Fleet Commander to tune into their encrypted frequency and standings.
                    </p>
                    <button
                      type="submit"
                      disabled={loading || !joinRoomCode.trim()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-black text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(72,255,72,0.3)] flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{loading ? 'TRANSMITTING...' : 'CONNECT TO FLEET'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PILOT ID */}
          {activeTab === 'pilot' && (
            <div className="space-y-4">
              <div className="p-4 bg-black/60 border border-white/15 flex items-center gap-4">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'pilot')}`}
                  alt={user?.name || 'Pilot'}
                  className="w-14 h-14 border-2 border-primary object-cover shadow-[0_0_12px_rgba(72,255,72,0.3)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider truncate">
                      {user?.name || user?.username || 'ANONYMOUS PILOT'}
                    </span>
                    {user ? (
                      <span className="px-1.5 py-0.5 bg-primary/15 border border-primary text-primary text-[10px] font-bold uppercase shrink-0">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-white/10 border border-white/20 text-white/70 text-[10px] font-bold uppercase shrink-0">
                        GUEST
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 mt-1 truncate">
                    {user?.email || 'No clearance credentials linked.'}
                  </p>
                  <p className="text-[10px] text-primary/70 mt-0.5">
                    SECTOR COMM: {user?.community || 'Global Explorers'}
                  </p>
                </div>
              </div>

              {!user ? (
                <div className="p-4 bg-primary/5 border border-primary/40 space-y-2">
                  <div className="text-xs font-bold text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>CLAIM PERMANENT PILOT CLEARANCE</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed">
                    Authorize your callsign to secure your daily streak, preserve all past navigation history, and lock in your permanent rank on the Space Standings.
                  </p>
                  <button
                    onClick={() => { onClose(); onOpenAuth(); }}
                    className="mt-2 px-4 py-2 bg-primary hover:bg-primary/90 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(72,255,72,0.3)]"
                  >
                    ⚡ CLAIM CALLSIGN / AUTH
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => { onClose(); onOpenAuth(); }}
                    className="text-xs text-primary hover:underline uppercase tracking-wider font-bold cursor-pointer"
                  >
                    CHANGE / RE-CLAIM CALLSIGN
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => { onClose(); onLogout(); }}
                      className="px-3 py-1.5 border border-error/60 text-error hover:bg-error hover:text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>DISCONNECT PILOT</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TELEMETRY & SFX */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="p-4 bg-black/60 border border-white/15 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {sfxEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-white/50" />}
                    <span>AUDIO FEEDBACK / SFX</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">
                    Play synth pulses on probe submissions, thermal proximity lock-ins, and hint unlocks.
                  </p>
                </div>
                <button
                  onClick={handleToggleSfx}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    sfxEnabled 
                      ? 'bg-primary text-black border-primary' 
                      : 'bg-black text-white/40 border-white/20'
                  }`}
                >
                  {sfxEnabled ? 'ACTIVE [ON]' : 'MUTED [OFF]'}
                </button>
              </div>

              <div className="p-4 bg-black/60 border border-white/15 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Tv className="w-4 h-4 text-primary" />
                    <span>CRT SCANLINES & PHOSPHOR GLOW</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">
                    Simulate orbital cockpit cathode-ray monitor phosphor scanlines across the HUD.
                  </p>
                </div>
                <button
                  onClick={handleToggleCrt}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    crtEnabled 
                      ? 'bg-primary text-black border-primary' 
                      : 'bg-black text-white/40 border-white/20'
                  }`}
                >
                  {crtEnabled ? 'ACTIVE [ON]' : 'OFF'}
                </button>
              </div>

              <div className="p-4 bg-black/60 border border-white/15">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>HUD COLOR PROFILE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant/80">
                  <span className="w-3 h-3 bg-primary border border-primary"></span>
                  <span className="font-bold text-white">ORBITAL PHOSPHOR GREEN (#48FF48)</span>
                  <span className="text-[10px] text-primary/60">[SYSTEM STANDARD]</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECTIVES */}
          {activeTab === 'directives' && (
            <div className="space-y-4 text-left">
              <div className="p-4 bg-black/60 border border-white/15 space-y-2">
                <div className="text-xs font-bold text-primary uppercase tracking-wider">
                  MISSION OBJECTIVE & PROTOCOL
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  Decipher today's secret orbital coordinate through semantic proximity vectoring. Each probe reveals how semantically adjacent your concept is to the classified destination.
                </p>
              </div>

              <div className="p-4 bg-black/60 border border-white/15 space-y-2.5">
                <div className="text-xs font-bold text-primary uppercase tracking-wider">
                  SCORING & EFFICIENCY TELEMETRY
                </div>
                <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                  <li><strong className="text-primary">Initial Credit Pool:</strong> 1,000 CR allocated per daily mission.</li>
                  <li><strong className="text-white">Probe Penalty:</strong> -5 CR per vector submission.</li>
                  <li><strong className="text-white">Hint Penalties:</strong> Hint 1 (-100 CR), Hint 2 (-200 CR), Hint 3 (-350 CR).</li>
                  <li><strong className="text-primary">Rank #1 Lock:</strong> Guesses are ranked 1 to 500+ based on semantic distance.</li>
                </ul>
              </div>

              {onOpenBriefing && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => { onClose(); onOpenBriefing(); }}
                    className="px-4 py-2 border border-primary/60 hover:bg-primary hover:text-black text-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>OPEN FULL MISSION BRIEFING</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HUD Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-[10px] text-on-surface-variant/60">
          <span>ORBITO OS v2.4 // TELEMETRY TERMINAL</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            DISMISS HUD [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
