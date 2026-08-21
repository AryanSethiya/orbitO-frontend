import { useState, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import { X, Users, Plus, KeyRound, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onRoomJoined: (room: { id: string; code: string; name: string }) => void;
  onRequireAuth: () => void;
}

export const CommunityModal: FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  user,
  onRoomJoined,
  onRequireAuth,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [roomCode, setRoomCode] = useState('');
  const [fleetName, setFleetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a valid 6-character room code (e.g. ORB-8429)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.joinCommunityRoom(roomCode.trim().toUpperCase(), user.id);
      onRoomJoined(res.room);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join room. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!fleetName.trim()) {
      setError('Please enter a name for your fleet / community room');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.createCommunityRoom(fleetName.trim(), user.id);
      setCreatedRoom(res.room);
      onRoomJoined(res.room);
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
            <Users className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Fleet &amp; Community Rooms</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Play &amp; Compete with Friends</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-[#070714] p-1 rounded-2xl border border-white/10 mb-5">
          <button
            onClick={() => { setTab('join'); setError(null); setCreatedRoom(null); }}
            className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join' ? 'bg-[#00f0ff] text-[#05050c] shadow-lg' : 'text-[#8080a0] hover:text-[#eef2ff]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join with Code</span>
          </button>

          <button
            id="create-tab-btn"
            onClick={() => { setTab('create'); setError(null); setCreatedRoom(null); }}
            className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create' ? 'bg-[#00f0ff] text-[#05050c] shadow-lg' : 'text-[#8080a0] hover:text-[#eef2ff]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>
        </div>

        {tab === 'join' ? (
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
                Enter 6-Digit Room Invite Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ORB-8429"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-[#00f0ff] placeholder:text-[#8080a0]/30 uppercase focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || !roomCode.trim()}
              className="w-full py-3 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Joining Fleet...' : 'Join Community Room'}</span>
            </button>
          </div>
        ) : createdRoom ? (
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#0c0c1f] border border-[#00f0ff]/40 text-center">
            <Sparkles className="w-7 h-7 text-[#00f0ff] mx-auto animate-pulse" />
            <div>
              <h3 className="font-mono text-base font-bold text-[#eef2ff]">{createdRoom.name}</h3>
              <p className="font-mono text-xs text-[#8080a0] mt-0.5">Share this invite code with your friends:</p>
            </div>

            <div className="flex items-center justify-center gap-2 bg-[#05050c] border border-[#00f0ff]/50 rounded-2xl p-3">
              <span className="font-mono text-2xl font-black text-[#00f0ff] tracking-widest">{createdRoom.code}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/40 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all"
            >
              Enter Daily Orbit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
                Community Fleet Name
              </label>
              <input
                id="fleet-name-input"
                type="text"
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                placeholder="e.g. Aryan's Cosmic Squad"
                className="w-full bg-[#070714] border border-white/15 rounded-xl px-4 py-3 font-mono text-xs text-[#eef2ff] placeholder:text-[#8080a0]/30 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <button
              id="create-room-btn"
              onClick={handleCreate}
              disabled={loading || !fleetName.trim()}
              className="w-full py-3 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating Fleet...' : 'Create & Generate Code'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};