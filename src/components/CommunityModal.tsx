import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';
import {
  X,
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  LogOut,
  Trash2,
  Globe,
  Radio,
  ShieldAlert,
} from 'lucide-react';

interface CommunityRoomItem {
  id: string;
  code: string;
  name: string;
  creatorId?: string;
  createdAt: string;
  joinedAt: string;
}

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onRoomJoined: (room: { id: string; code: string; name: string }) => void;
  onRoomLeft?: (communityName: string) => void;
  onRequireAuth: () => void;
}

export const CommunityModal: FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  user,
  onRoomJoined,
  onRoomLeft,
  onRequireAuth,
}) => {
  const [tab, setTab] = useState<'my-fleets' | 'join' | 'create'>('my-fleets');
  const [roomCode, setRoomCode] = useState('');
  const [fleetName, setFleetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; code: string; name: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userRooms, setUserRooms] = useState<CommunityRoomItem[]>([]);
  const [confirmDisbandCode, setConfirmDisbandCode] = useState<string | null>(null);

  const isCustomCommunity =
    user?.community &&
    user.community !== 'Global Explorers' &&
    user.community !== 'Solo Orbit' &&
    user.community !== 'Starfleet Academy';

  // Load user's rooms on open
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchUserRooms();
      setConfirmDisbandCode(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user?.id]);

  const fetchUserRooms = async () => {
    if (!user?.id) return;
    try {
      const res = await ApiClient.getUserRooms(user.id);
      setUserRooms(res.rooms || []);
    } catch (err: any) {
      console.warn('Failed to fetch user rooms:', err?.message || err);
    }
  };

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a valid room code (e.g. ORB-8429)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.joinCommunityRoom(roomCode.trim().toUpperCase(), user.id);
      onRoomJoined(res.room);
      setSuccessMsg(`Joined fleet: ${res.room.name}`);
      await fetchUserRooms();
      setRoomCode('');
      setTab('my-fleets');
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
      setFleetName('');
      await fetchUserRooms();
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFleet = async (roomId?: string, code?: string) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.leaveCommunityRoom(user.id, roomId, code);
      if (onRoomLeft) {
        onRoomLeft(res.community || 'Global Explorers');
      }
      setSuccessMsg(res.message || 'Left fleet successfully');
      await fetchUserRooms();
    } catch (err: any) {
      setError(err.message || 'Failed to leave fleet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisbandFleet = async (code: string) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.deleteCommunityRoom(code, user.id);
      if (onRoomLeft) {
        onRoomLeft(res.community || 'Global Explorers');
      }
      setConfirmDisbandCode(null);
      setSuccessMsg(res.message || 'Fleet disbanded successfully');
      await fetchUserRooms();
    } catch (err: any) {
      setError(err.message || 'Failed to disband fleet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#05050c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg stitch-card rounded-3xl p-6 sm:p-8 border border-white/10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[#8080a0] hover:text-[#eef2ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#eef2ff]">Fleet &amp; Community Rooms</h2>
            <p className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider">Play &amp; Compete with Friends</p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[#ff5e07]/10 border border-[#ff5e07]/30 text-xs font-mono text-[#ff5e07] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-xs font-mono text-[#00ff88] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-[#070714] p-1 rounded-2xl border border-white/10 mb-5 gap-1">
          <button
            onClick={() => {
              setTab('my-fleets');
              setError(null);
              setSuccessMsg(null);
              setCreatedRoom(null);
            }}
            className={`flex-1 py-2 px-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'my-fleets' ? 'bg-[#00f0ff] text-[#05050c] shadow-lg' : 'text-[#8080a0] hover:text-[#eef2ff]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>My Fleets</span>
          </button>

          <button
            onClick={() => {
              setTab('join');
              setError(null);
              setSuccessMsg(null);
              setCreatedRoom(null);
            }}
            className={`flex-1 py-2 px-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join' ? 'bg-[#00f0ff] text-[#05050c] shadow-lg' : 'text-[#8080a0] hover:text-[#eef2ff]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Join Code</span>
          </button>

          <button
            id="create-tab-btn"
            onClick={() => {
              setTab('create');
              setError(null);
              setSuccessMsg(null);
              setCreatedRoom(null);
            }}
            className={`flex-1 py-2 px-2 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create' ? 'bg-[#00f0ff] text-[#05050c] shadow-lg' : 'text-[#8080a0] hover:text-[#eef2ff]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>

        {/* Tab 1: My Fleets & Active Status */}
        {tab === 'my-fleets' ? (
          <div className="flex flex-col gap-4 text-left">
            {/* Active Standing Card */}
            <div className="p-4 rounded-2xl bg-[#0c0c1f] border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#8080a0] tracking-wider">
                  Active Leaderboard Standing
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 uppercase">
                  Current
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center text-sm">
                    {isCustomCommunity ? '🛸' : '🌍'}
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-[#eef2ff]">
                      {user?.community || 'Global Explorers'}
                    </h3>
                    <p className="font-mono text-[10px] text-[#8080a0]">
                      {isCustomCommunity ? 'Custom Private Fleet' : 'Public Global Competition'}
                    </p>
                  </div>
                </div>

                {isCustomCommunity && (
                  <button
                    onClick={() => handleLeaveFleet()}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-[#ff5e07]/15 hover:bg-[#ff5e07]/25 text-[#ff5e07] border border-[#ff5e07]/30 font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Exit fleet and return to Global Explorers"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit to Global</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Joined Rooms */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#8080a0] tracking-wider">
                Joined Community Rooms ({userRooms.length})
              </span>

              {userRooms.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#070714] border border-white/5 text-center flex flex-col items-center gap-2">
                  <Globe className="w-8 h-8 text-[#8080a0]/50" />
                  <p className="font-mono text-xs text-[#8080a0]">
                    You haven&apos;t joined any custom fleets yet.
                  </p>
                  <button
                    onClick={() => setTab('join')}
                    className="mt-1 font-mono text-xs text-[#00f0ff] hover:underline font-bold"
                  >
                    Join with an Invite Code &rarr;
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {userRooms.map((room) => {
                    const isCurrent = user?.community === room.name;
                    const isCreator = user?.id && room.creatorId === user.id;
                    const isConfirmingDisband = confirmDisbandCode === room.code;

                    return (
                      <div
                        key={room.id}
                        className={`p-3.5 rounded-2xl bg-[#070714] border transition-all flex flex-col gap-2.5 ${
                          isCurrent ? 'border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-bold text-[#eef2ff]">{room.name}</span>
                              {isCreator && (
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#ffaa00]/15 text-[#ffaa00] border border-[#ffaa00]/30 uppercase font-bold">
                                  Owner
                                </span>
                              )}
                              {isCurrent && (
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 uppercase font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-[#00f0ff] font-bold tracking-wider">{room.code}</span>
                              <button
                                onClick={() => handleCopy(room.code)}
                                className="text-[#8080a0] hover:text-[#00f0ff] transition-colors"
                                title="Copy Room Code"
                              >
                                {copiedCode === room.code ? (
                                  <Check className="w-3 h-3 text-[#00ff88]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isCurrent && (
                              <button
                                onClick={() => onRoomJoined(room)}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/30 font-mono text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <span>Switch</span>
                              </button>
                            )}

                            {isCreator ? (
                              isConfirmingDisband ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleDisbandFleet(room.code)}
                                    disabled={loading}
                                    className="px-3 py-1.5 rounded-xl bg-[#ff5e07] hover:bg-[#ff4400] text-black font-mono text-[11px] font-bold transition-all shadow-[0_0_15px_rgba(255,94,7,0.4)]"
                                  >
                                    Confirm End Room
                                  </button>
                                  <button
                                    onClick={() => setConfirmDisbandCode(null)}
                                    className="p-1.5 rounded-lg bg-white/5 text-[#8080a0] hover:text-[#eef2ff]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDisbandCode(room.code)}
                                  disabled={loading}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#ff5e07]/10 hover:bg-[#ff5e07]/20 text-[#ff5e07] border border-[#ff5e07]/30 font-mono text-[11px] font-bold transition-all flex items-center gap-1.5"
                                  title="End & Delete this community for all participants"
                                >
                                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>End Community</span>
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleLeaveFleet(room.id, room.code)}
                                disabled={loading}
                                className="px-2.5 py-1.5 rounded-xl bg-[#ff5e07]/10 hover:bg-[#ff5e07]/20 text-[#ff5e07] border border-[#ff5e07]/30 font-mono text-[11px] font-bold transition-all flex items-center gap-1.5"
                                title="Leave this community"
                              >
                                <LogOut className="w-3.5 h-3.5 shrink-0" />
                                <span>Leave Fleet</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {isConfirmingDisband && (
                          <div className="p-2.5 rounded-xl bg-[#ff5e07]/15 border border-[#ff5e07]/40 text-[11px] font-mono text-[#ff5e07] flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span><strong>Admin Action:</strong> This will permanently delete and end this community fleet for all participants.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : tab === 'join' ? (
          /* Tab 2: Join with Code */
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="font-mono text-[10px] text-[#8080a0] uppercase block mb-1.5 font-bold">
                Enter Room Invite Code
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
          /* Created Success Screen */
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#0c0c1f] border border-[#00f0ff]/40 text-center">
            <Sparkles className="w-7 h-7 text-[#00f0ff] mx-auto animate-pulse" />
            <div>
              <h3 className="font-mono text-base font-bold text-[#eef2ff]">{createdRoom.name}</h3>
              <p className="font-mono text-xs text-[#8080a0] mt-0.5">Share this invite code with your friends:</p>
            </div>

            <div className="flex items-center justify-center gap-2 bg-[#05050c] border border-[#00f0ff]/50 rounded-2xl p-3">
              <span className="font-mono text-2xl font-black text-[#00f0ff] tracking-widest">{createdRoom.code}</span>
              <button
                onClick={() => handleCopy(createdRoom.code)}
                className="p-2 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/40 transition-colors"
                title="Copy Code"
              >
                {copiedCode === createdRoom.code ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreatedRoom(null);
                  setTab('my-fleets');
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#eef2ff] font-mono text-xs font-bold uppercase transition-all"
              >
                View Fleets
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all"
              >
                Enter Daily Orbit
              </button>
            </div>
          </div>
        ) : (
          /* Tab 3: Create Room */
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