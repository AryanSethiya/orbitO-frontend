import { useState, useEffect, type FC } from 'react';
import type { LeaderboardEntry, UserProfile } from '../types/game';
import { ApiClient } from '../api/client';
import { RefreshCw, KeyRound } from 'lucide-react';

interface SpaceStandingsViewProps {
  user: UserProfile | null;
  onOpenCommunity: () => void;
  activeRoomCode?: string | null;
}

export const SpaceStandingsView: FC<SpaceStandingsViewProps> = ({
  onOpenCommunity,
  activeRoomCode,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>(activeRoomCode ? `Room ${activeRoomCode}` : 'Global');
  const [communities, setCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    loadStandings(activeTab);
  }, [activeTab]);

  const loadCommunities = async () => {
    try {
      const res = await ApiClient.getActiveCommunities();
      setCommunities(res.communities || []);
    } catch {}
  };

  const loadStandings = async (tab: string) => {
    try {
      setLoading(true);
      const isRoom = tab.startsWith('Room ');
      const roomCode = isRoom ? tab.replace('Room ', '').trim() : undefined;
      const commFilter = !isRoom && tab !== 'Global' ? tab : undefined;

      const res = await ApiClient.getLeaderboard({ community: commFilter, roomCode });
      setEntries(res.leaderboard || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center">
      <div className="mb-8">
        <h1 className="font-mono text-2xl sm:text-4xl font-black text-[#eef2ff] uppercase tracking-wider">
          Space Standings
        </h1>
        <p className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest mt-1 font-bold">
          Real-Time Leaderboards // Today's Orbit
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab('Global')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
            activeTab === 'Global'
              ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'bg-[#070714] text-[#8080a0] hover:text-[#eef2ff] border border-white/10'
          }`}
        >
          🌐 Global
        </button>

        {activeRoomCode && (
          <button
            onClick={() => setActiveTab(`Room ${activeRoomCode}`)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
              activeTab === `Room ${activeRoomCode}`
                ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#070714] text-[#00f0ff] hover:text-[#eef2ff] border border-[#00f0ff]/30'
            }`}
          >
            🛸 Room {activeRoomCode}
          </button>
        )}

        {communities.map((c) => (
          <button
            key={c}
            onClick={() => setActiveTab(c)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
              activeTab === c
                ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#070714] text-[#8080a0] hover:text-[#eef2ff] border border-white/10'
            }`}
          >
            {c}
          </button>
        ))}

        <button
          onClick={onOpenCommunity}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-[#8080a0] hover:text-[#00f0ff] font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>+ Join/Create Room</span>
        </button>
      </div>

      <div className="stitch-card rounded-3xl p-4 sm:p-6 border border-white/10 text-left overflow-x-auto shadow-2xl">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[#8080a0] uppercase text-[10px]">
              <th className="py-3 px-3 text-left">Rank</th>
              <th className="py-3 px-3 text-left">Pilot</th>
              <th className="py-3 px-3 text-left">Fleet / Room</th>
              <th className="py-3 px-3 text-center">Probes</th>
              <th className="py-3 px-3 text-right">Holding Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-[#8080a0]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00f0ff]" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-[#8080a0]">
                  No pilots have completed today's orbit in this standings category yet.
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <tr
                  key={entry.userId || idx}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-3">
                    <span className={`font-black ${
                      idx === 0
                        ? 'text-[#00ff88]'
                        : idx === 1
                        ? 'text-[#00f0ff]'
                        : idx === 2
                        ? 'text-[#ffaa00]'
                        : 'text-[#8080a0]'
                    }`}>
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={entry.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(entry.name || entry.username)}`}
                        alt="Pilot Avatar"
                        className="w-7 h-7 rounded-full border border-white/20 bg-black/40 object-cover"
                      />
                      <span className="font-bold text-[#eef2ff]">{entry.name || entry.username}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-[#00f0ff]">
                      {entry.community}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center text-[#eef2ff]">
                    {entry.guessesCount}
                  </td>

                  <td className="py-3.5 px-3 text-right font-black text-sm text-[#00ff88]">
                    {entry.score}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};