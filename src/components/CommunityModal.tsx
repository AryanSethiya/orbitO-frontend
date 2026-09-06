import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { UserProfile } from '../types/game';

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
  activeRoomCode?: string | null;
  onRoomJoined: (room: { id: string; code: string; name: string }) => void;
  onRoomLeft?: (communityName: string) => void;
  onRequireAuth: () => void;
}

export const CommunityModal: FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  user,
  activeRoomCode,
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
      setSuccessMsg(`Joined Fleet: ${res.room.name}`);
      await fetchUserRooms();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to join fleet room.');
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
      setError('Please enter a fleet or community name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let room: { id: string; code: string; name: string };
      try {
        const res = await ApiClient.createCommunityRoom(fleetName.trim(), user.id);
        room = res.room;
      } catch {
        const fallbackCode = `ORB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        room = {
          id: `room_${Date.now()}`,
          code: fallbackCode,
          name: fleetName.trim(),
        };
      }
      setCreatedRoom(room);
      onRoomJoined(room);
      setSuccessMsg(`Fleet Created: ${room.name}`);
      setUserRooms((prev) => [
        ...prev,
        {
          id: room.id,
          code: room.code,
          name: room.name,
          creatorId: user.id,
          createdAt: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
        }
      ]);
    } catch (err: any) {
      setError(err?.message || 'Failed to create fleet room.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCurrentFleet = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.leaveCommunityRoom(user.id);
      if (onRoomLeft) {
        onRoomLeft(res.community || 'Global Explorers');
      }
      setSuccessMsg('Returned to Global Explorers');
      await fetchUserRooms();
    } catch (err: any) {
      setError(err?.message || 'Failed to leave fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisbandRoom = async (code: string) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.deleteCommunityRoom(code, user.id);
      if (onRoomLeft) {
        onRoomLeft(res.community || 'Global Explorers');
      }
      setConfirmDisbandCode(null);
      setSuccessMsg('Fleet room disbanded permanently.');
      await fetchUserRooms();
    } catch (err: any) {
      setError(err?.message || 'Failed to disband fleet.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
      <div className="w-full max-w-lg bg-[#131313] border border-primary/40 relative p-4 sm:p-8 shadow-[0_0_30px_rgba(72,255,72,0.15)] text-left font-telemetry-md my-auto max-h-[90vh] flex flex-col">
        {/* HUD Corners */}
        <div className="telemetry-corner corner-tl text-primary text-[10px] sm:text-xs">COMMUNITY_SYS: 0x4B</div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Title */}
        <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
          <div className="font-label-caps text-[11px] sm:text-xs text-primary/80 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            SECTOR FLEET SQUADRONS
          </div>
          <h2 className="font-display-hero text-xl sm:text-3xl text-primary uppercase tracking-tight leading-none">
            Fleet Operations Hub
          </h2>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-error-container/30 border border-error text-error text-xs font-telemetry-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">warning</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-primary/10 border border-primary text-primary text-xs font-telemetry-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">verified</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-4 sm:mb-6 font-label-caps text-[10px] xs:text-xs">
          <button
            onClick={() => setTab('my-fleets')}
            className={`flex-1 py-2 px-1 text-center uppercase tracking-wider transition-all cursor-pointer truncate ${
              tab === 'my-fleets'
                ? 'border-b-2 border-primary text-primary font-bold bg-primary/5'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            MY FLEETS ({userRooms.length})
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 px-1 text-center uppercase tracking-wider transition-all cursor-pointer truncate ${
              tab === 'join'
                ? 'border-b-2 border-primary text-primary font-bold bg-primary/5'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            JOIN SQUADRON
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 px-1 text-center uppercase tracking-wider transition-all cursor-pointer truncate ${
              tab === 'create'
                ? 'border-b-2 border-primary text-primary font-bold bg-primary/5'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            + CREATE FLEET
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-0.5">
          {/* Tab 1: My Fleets */}
          {tab === 'my-fleets' && (
            <div className="space-y-4">
              <div className="p-3 bg-black/40 border border-white/10 flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">ACTIVE FLEET:</span>
                <span className="text-primary font-bold">
                  {activeRoomCode ? `ROOM_${activeRoomCode}` : (user?.community || 'Global Explorers')}
                </span>
              </div>

              {userRooms.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant/50 text-xs font-telemetry-sm leading-relaxed">
                  NO REGISTERED FLEET SQUADRONS.<br/>JOIN OR CREATE A PRIVATE FLEET CODE TO COMPETE WITH FRIENDS.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {userRooms.map((room) => {
                    const isCreator = user && room.creatorId === user.id;
                    const isActive = activeRoomCode === room.code || user?.community === room.name;

                    return (
                      <div 
                        key={room.id}
                        className={`p-3 bg-black/60 border flex justify-between items-center text-xs ${
                          isActive ? 'border-primary/60 bg-primary/5' : 'border-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white uppercase">{room.name}</div>
                          <div className="font-label-caps text-[10px] text-primary mt-0.5">
                            CODE: {room.code}
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => copyToClipboard(room.code)}
                            title="Copy Code"
                            className="p-1 border border-white/20 text-on-surface-variant hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {copiedCode === room.code ? 'check' : 'content_copy'}
                            </span>
                          </button>

                          {!isActive && (
                            <button
                              onClick={() => onRoomJoined(room)}
                              className="px-2.5 py-1 bg-primary text-black font-label-caps text-[10px] font-bold uppercase"
                            >
                              SELECT
                            </button>
                          )}

                          {isCreator && (
                            confirmDisbandCode === room.code ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDisbandRoom(room.code)}
                                  title="Confirm Disband"
                                  className="px-2 py-0.5 bg-error text-black font-label-caps text-[9px] font-bold uppercase"
                                >
                                  DISBAND?
                                </button>
                                <button
                                  onClick={() => setConfirmDisbandCode(null)}
                                  className="px-1.5 py-0.5 border border-white/20 text-[9px]"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDisbandCode(room.code)}
                                title="Disband Fleet"
                                className="p-1 border border-error/40 text-error hover:bg-error/10"
                              >
                                <span className="material-symbols-outlined text-xs">delete</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isCustomCommunity && (
                <button
                  onClick={handleLeaveCurrentFleet}
                  disabled={loading}
                  className="w-full py-2 bg-transparent border border-error/40 text-error hover:bg-error/10 font-label-caps text-xs uppercase cursor-pointer"
                >
                  LEAVE CURRENT FLEET
                </button>
              )}
            </div>
          )}

          {/* Tab 2: Join Squadron */}
          {tab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase block mb-1 font-bold">
                  ENTER SQUADRON CODE
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ORB-8429"
                  required
                  className="w-full bg-black/60 border border-primary/50 px-3.5 py-2.5 text-base sm:text-sm font-telemetry-md text-primary font-bold input-glow uppercase tracking-wider"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading || !roomCode.trim()}
                className="w-full py-3.5 px-4 bg-primary text-black font-label-caps text-xs font-bold uppercase tracking-wider glitch-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm font-bold">hub</span>
                <span>{loading ? 'CALIBRATING...' : 'ENTER SQUADRON'}</span>
              </button>
            </div>
          )}

          {/* Tab 3: Create Fleet */}
          {tab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="font-label-caps text-xs text-on-surface-variant uppercase block mb-1 font-bold">
                  FLEET / SQUADRON NAME
                </label>
                <input
                  type="text"
                  value={fleetName}
                  onChange={(e) => setFleetName(e.target.value)}
                  placeholder="e.g. Nebula Corsairs"
                  maxLength={40}
                  required
                  className="w-full bg-black/60 border border-primary/50 px-3.5 py-2.5 text-base sm:text-sm font-telemetry-md text-primary font-bold input-glow uppercase tracking-wider"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !fleetName.trim()}
                className="w-full py-3.5 px-4 bg-primary text-black font-label-caps text-xs font-bold uppercase tracking-wider glitch-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
                <span>{loading ? 'COMMISSIONING FLEET...' : 'COMMISSION FLEET'}</span>
              </button>

              {createdRoom && (
                <div className="p-3.5 bg-black/80 border border-primary/60 mt-3 text-xs flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 shadow-[0_0_15px_rgba(72,255,72,0.1)]">
                  <div>
                    <div className="font-bold text-primary font-label-caps mb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">verified</span>
                      <span>FLEET ESTABLISHED</span>
                    </div>
                    <div className="text-on-surface-variant flex items-center gap-2">
                      <span>SHARE CODE:</span>
                      <span className="text-white font-mono font-bold tracking-widest text-sm">{createdRoom.code}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdRoom.code)}
                    className="w-full xs:w-auto px-3 py-2 bg-primary text-black hover:bg-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-label-caps shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCode === createdRoom.code ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode === createdRoom.code ? 'COPIED!' : 'COPY CODE'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};