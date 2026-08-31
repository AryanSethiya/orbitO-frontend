import { useState, useEffect, type FC } from 'react';
import type { LeaderboardEntry, UserProfile } from '../types/game';
import { ApiClient } from '../api/client';
import { 
  Globe, 
  Users, 
  PlusCircle, 
  RefreshCw, 
  Radar 
} from 'lucide-react';

interface SpaceStandingsViewProps {
  user: UserProfile | null;
  onOpenCommunity: () => void;
  activeRoomCode?: string | null;
  currentGuessesCount?: number;
  currentScore?: number;
  solved?: boolean;
  isForfeited?: boolean;
}

export const SpaceStandingsView: FC<SpaceStandingsViewProps> = ({
  user,
  onOpenCommunity,
  activeRoomCode,
  currentGuessesCount = 0,
  currentScore = 1000,
  solved = false,
  isForfeited = false,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>(activeRoomCode ? 'Room' : 'Global');
  const [loading, setLoading] = useState(true);
  const [hudTime, setHudTime] = useState('');

  // Live HUD Time updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHudTime(now.toISOString().substring(11, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeRoomCode) {
      setActiveTab('Room');
    }
  }, [activeRoomCode]);

  useEffect(() => {
    loadStandings(activeTab);
  }, [activeTab, activeRoomCode, currentGuessesCount, currentScore, solved, isForfeited]);

  const loadStandings = async (tab: string) => {
    try {
      setLoading(true);
      const isRoomTab = tab === 'Room';
      const roomFilter = isRoomTab && activeRoomCode ? activeRoomCode : undefined;
      const commFilter = isRoomTab && user?.community && user.community !== 'Global Explorers' ? user.community : undefined;
      
      let serverEntries: LeaderboardEntry[] = [];
      try {
        const res = await ApiClient.getLeaderboard({ roomCode: roomFilter, community: commFilter });
        serverEntries = res.leaderboard || [];
      } catch (err) {
        console.warn('Backend leaderboard fetch notice:', err);
      }

      // If current pilot has flight telemetry, inject or update them in the standings
      if (user && (currentGuessesCount > 0 || solved || isForfeited)) {
        const existingIdx = serverEntries.findIndex(
          (e) => (user.id && e.userId === user.id) || (user.username && e.username.toLowerCase() === user.username.toLowerCase())
        );
        const myScore = isForfeited ? 0 : currentScore;
        const myStatus = isForfeited ? 'FORFEITED' : (solved ? 'SOLVED' : 'ACTIVE');

        const myEntry: LeaderboardEntry = {
          userId: user.id,
          username: user.username || user.name || 'PILOT',
          name: user.name || user.username || 'PILOT',
          avatarUrl: user.avatarUrl || '/cyber_pepe_astronaut.jpg',
          score: myScore,
          guessesCount: currentGuessesCount,
          community: user.community || (activeRoomCode ? `ROOM_${activeRoomCode}` : 'Global Explorers'),
          solved: solved,
          status: myStatus,
          completedAt: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          // Keep best performance
          if (myScore >= serverEntries[existingIdx].score) {
            serverEntries[existingIdx] = myEntry;
          }
        } else {
          serverEntries.push(myEntry);
        }
      }

      // Deduplicate unique pilots by username
      const uniqueMap = new Map<string, LeaderboardEntry>();
      for (const entry of serverEntries) {
        const key = entry.username.toLowerCase().trim();
        const existing = uniqueMap.get(key);
        if (!existing || entry.score > existing.score || (entry.score === existing.score && entry.guessesCount < existing.guessesCount)) {
          uniqueMap.set(key, entry);
        }
      }

      const deduplicated = Array.from(uniqueMap.values());

      // Sort by score descending, then guesses count ascending, then prioritize active user on ties
      deduplicated.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.guessesCount !== b.guessesCount) return a.guessesCount - b.guessesCount;
        const isUserA = user && ((user.id && a.userId === user.id) || (user.username && a.username.toLowerCase() === user.username.toLowerCase()));
        const isUserB = user && ((user.id && b.userId === user.id) || (user.username && b.username.toLowerCase() === user.username.toLowerCase()));
        if (isUserA) return -1;
        if (isUserB) return 1;
        return 0;
      });

      setEntries(deduplicated);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCommunityName = user?.community && user.community !== 'Global Explorers'
    ? user.community
    : activeRoomCode
    ? `ROOM_${activeRoomCode}`
    : null;

  // Determine ship class from pilot score
  const getFleetClass = (score: number) => {
    if (score >= 950) return 'DREADNOUGHT';
    if (score >= 850) return 'CRUISER';
    if (score >= 700) return 'FRIGATE';
    return 'INTERCEPTOR';
  };

  return (
    <div className="min-h-screen flex flex-col font-telemetry-md starfield-bg text-on-background relative overflow-x-hidden pt-20">
      <div className="scanline"></div>
      <div className="hud-scanline"></div>

      {/* Fixed HUD Elements (Corners) */}
      <div className="fixed top-24 left-margin-desktop font-label-caps text-xs text-on-surface-variant/50 hidden lg:block z-40 tracking-widest">
        SYS.TIME: <span className="text-primary">{hudTime}</span>
      </div>
      <div className="fixed top-24 right-margin-desktop font-label-caps text-xs text-primary/70 hidden lg:block z-40 tracking-widest text-right">
        UPLINK: SECURE<br/>LAT: 12ms
      </div>

      {/* Main Canvas */}
      <main className="flex-grow pt-24 md:pt-28 pb-28 px-4 md:px-margin-desktop max-w-container-max mx-auto w-full relative z-10 flex flex-col gap-6">
        {/* Header Section (Matching Landing Page & Mission Briefing Font) */}
        <header className="border-b border-white/10 pb-6 relative">
          <div className="flex justify-between items-start">
            <h1 className="font-display-hero text-4xl sm:text-5xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-none">
              SPACE STANDINGS
            </h1>
            <div className="font-mono text-xs text-on-surface-variant/60 tracking-wider">
              SECTOR 0x01 • TELEMETRY LOGS
            </div>
          </div>

          <p className="font-telemetry-md text-sm sm:text-base text-on-surface-variant mt-4 max-w-3xl leading-relaxed">
            Global pilot telemetry. Displaying top-tier navigators and their current fleet status across the sector.
          </p>
        </header>

        {/* Tab Switcher: Global & Fleet Room */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('Global')}
            className={`font-label-caps text-xs px-5 py-2.5 border uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'Global'
                ? 'bg-primary text-black font-bold border-primary shadow-[0_0_12px_rgba(72,255,72,0.4)]'
                : 'bg-white/5 text-on-surface-variant border-white/15 hover:text-primary hover:border-primary/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL STANDINGS</span>
          </button>

          {currentCommunityName && (
            <button
              onClick={() => setActiveTab('Room')}
              className={`font-label-caps text-xs px-5 py-2.5 border uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'Room'
                  ? 'bg-primary text-black font-bold border-primary shadow-[0_0_12px_rgba(72,255,72,0.4)]'
                  : 'bg-white/5 text-primary border-primary/40 hover:bg-primary/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{currentCommunityName}</span>
            </button>
          )}

          <button
            onClick={onOpenCommunity}
            className="font-label-caps text-xs px-4 py-2.5 bg-black/40 border border-white/20 text-on-surface-variant hover:text-primary hover:border-primary/60 uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{currentCommunityName ? 'SWITCH FLEET' : '+ FLEET ROOM'}</span>
          </button>
        </div>

        {/* Leaderboard Data Grid */}
        <div className="w-full bg-white/[0.03] backdrop-blur-[12px] border border-white/10 relative">
          {/* Telemetry Tag */}
          <div className="absolute -top-3 right-4 bg-surface px-2 py-1 border border-white/10 font-label-caps text-[10px] text-primary/70">
            [DATA_STREAM: ACTIVE]
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/10 font-label-caps text-xs text-on-surface-variant">
                  <th className="py-4 px-4 w-16 text-center">RANK</th>
                  <th className="py-4 px-4">PILOT_ID</th>
                  <th className="py-4 px-4">FLEET_CLASS</th>
                  <th className="py-4 px-4 text-right">PROBES (GUESSES)</th>
                  <th className="py-4 px-4 text-right">CREDITS (CR)</th>
                  <th className="py-4 px-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-telemetry-sm text-xs sm:text-telemetry-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-primary font-label-caps text-sm">
                      <div className="flex items-center justify-center gap-2 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>RETRIEVING SECTOR TELEMETRY...</span>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-on-surface-variant/60">
                      <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
                        <Radar className="w-8 h-8 text-on-surface-variant/40" />
                        <p className="font-bold text-on-surface font-label-caps">NO PILOTS DETECTED IN THIS SECTOR</p>
                        <p className="text-xs">Be the first navigator to transmit today's coordinates!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    const isCurrentUser = user && (entry.userId === user.id || entry.username === user.username);
                    const rankStr = (idx + 1).toString().padStart(2, '0');
                    const fleetClass = getFleetClass(entry.score);

                    return (
                      <tr 
                        key={entry.userId || idx}
                        className={`telemetry-row border-b border-white/[0.05] ${
                          isCurrentUser ? 'active-pilot' : ''
                        }`}
                      >
                        <td className={`py-4 px-4 text-center font-bold font-label-caps ${
                          idx === 0 ? 'text-primary' : idx < 3 ? 'text-[#eefff6]' : 'text-on-surface-variant'
                        }`}>
                          {rankStr}
                        </td>

                        <td className="py-4 px-4 flex items-center gap-3">
                          <img 
                            className={`w-8 h-8 rounded-none border object-cover ${
                              isCurrentUser ? 'border-primary shadow-[0_0_8px_rgba(72,255,72,0.4)]' : 'border-white/20'
                            }`}
                            alt={entry.name || entry.username} 
                            src={entry.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(entry.name || entry.username || 'pilot')}`}
                          />
                          <div className="flex flex-col">
                            <span className={`font-bold ${isCurrentUser ? 'text-primary font-label-caps' : 'text-on-surface'}`}>
                              {isCurrentUser ? `[ YOU ] ${entry.name || entry.username}` : (entry.name || entry.username)}
                            </span>
                            {entry.community && (
                              <span className="text-[10px] font-label-caps text-on-surface-variant/60">
                                {entry.community}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-on-surface-variant font-label-caps text-xs">
                          {fleetClass}
                        </td>

                        <td className="py-4 px-4 text-right font-telemetry-md text-on-surface">
                          {entry.guessesCount}
                        </td>

                        <td className={`py-4 px-4 text-right font-bold ${
                          idx === 0 ? 'text-primary' : 'text-primary/80'
                        }`}>
                          {entry.score} CR
                        </td>

                        <td className="py-4 px-4 text-center">
                          {entry.status === 'FORFEITED' ? (
                            <span className="px-2 py-0.5 bg-[#FF003C]/20 border border-[#FF003C]/50 text-[#FF2A55] font-label-caps text-[9px] font-bold uppercase tracking-wider">
                              FORFEIT
                            </span>
                          ) : entry.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-label-caps text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              IN FLIGHT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-primary/20 border border-primary/50 text-primary font-label-caps text-[9px] font-bold uppercase tracking-wider">
                              SOLVED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer of Table */}
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/40">
            <div className="font-label-caps text-xs text-on-surface-variant/70">
              TOTAL PILOTS: {entries.length}
            </div>
            <button 
              onClick={() => loadStandings(activeTab)}
              disabled={loading}
              className="bg-primary text-black font-label-caps text-xs px-6 py-2 border border-primary hover:bg-black hover:text-primary transition-colors duration-300 glitch-hover uppercase font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH FEED</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-white/5 flex flex-col md:flex-row justify-between items-center px-4 md:px-margin-desktop py-6 z-40 relative mt-auto">
        <div className="font-label-caps text-xs text-primary mb-4 md:mb-0">
          © 2144 ORBITO SYSTEM COMMAND. ALL RIGHTS RESERVED.
        </div>
        <div className="flex flex-wrap gap-4 md:gap-8 font-telemetry-sm text-xs text-on-surface-variant/60">
          <span className="hover:text-primary transition-colors cursor-default">MISSION_STATUS: ONLINE</span>
          <span className="hover:text-primary transition-colors cursor-default">COORDINATES: 0.0.0.1</span>
          <span className="hover:text-primary transition-colors cursor-default">CLOCK: UTC+0</span>
        </div>
      </footer>
    </div>
  );
};