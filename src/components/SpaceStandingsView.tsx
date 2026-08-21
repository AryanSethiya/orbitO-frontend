import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import type { LeaderboardEntry } from '../types/game';
import { Users, Globe, Trophy, Loader2 } from 'lucide-react';

export const SpaceStandingsView: FC = () => {
  const [activeCommunity, setActiveCommunity] = useState<string>('Global');
  const [communities, setCommunities] = useState<string[]>(['Global', 'Starfleet Academy', 'Nebula Squad', 'Cosmic Voyagers', 'Astrophysicists']);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async (communityName: string) => {
    try {
      setLoading(true);
      const res = await ApiClient.getDailyLeaderboard(communityName);
      setLeaderboard(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ApiClient.getCommunities().then((res) => {
      if (res.communities && res.communities.length > 0) {
        setCommunities(['Global', ...res.communities.filter((c) => c !== 'Global')]);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchStandings(activeCommunity);
  }, [activeCommunity]);

  return (
    <div className="w-full max-w-4xl mx-auto pt-24 pb-16 px-4 md:px-8 relative z-10 flex flex-col items-center">
      
      {/* Title */}
      <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#eef2ff] text-center mb-1">
        Space Standings
      </h1>
      <p className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest text-center mb-6">
        REAL-TIME LEADERBOARDS // TODAY'S ORBIT
      </p>

      {/* Community / Fleet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 mb-6 scrollbar-none">
        {communities.map((comm) => (
          <button
            key={comm}
            onClick={() => setActiveCommunity(comm)}
            className={`py-1.5 px-4 rounded-full font-mono text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeCommunity === comm
                ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#0c0c1f] text-[#8080a0] border border-white/5 hover:border-white/20 hover:text-[#eef2ff]'
            }`}
          >
            {comm === 'Global' ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{comm}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard Table Card */}
      <div className="w-full stitch-card rounded-2xl p-6 border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#00f0ff] animate-spin" />
            <span className="font-mono text-xs text-[#00f0ff] tracking-widest">
              QUERYING ORBITAL TELEMETRY...
            </span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-[#8080a0]/40" />
            <p className="font-mono text-sm text-[#8080a0]">No completed orbits recorded in {activeCommunity} yet today.</p>
            <p className="font-mono text-xs text-[#00f0ff]">Be the first pilot to solve today's puzzle and claim Rank #1!</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-[#8080a0] uppercase border-b border-white/5 tracking-wider pb-3">
                  <th className="pb-3 px-3 font-semibold">Rank</th>
                  <th className="pb-3 px-3 font-semibold">Pilot</th>
                  <th className="pb-3 px-3 font-semibold">Community</th>
                  <th className="pb-3 px-3 font-semibold text-center">Probes</th>
                  <th className="pb-3 px-3 font-semibold text-right">Holding Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.userId + '-' + entry.rank}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-3 font-bold text-sm">
                        {isTop1 ? '🥇 #1' : isTop2 ? '🥈 #2' : isTop3 ? '🥉 #3' : `#${entry.rank}`}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={entry.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(entry.username)}`}
                            alt={entry.username}
                            className="w-7 h-7 rounded-full border border-white/10"
                          />
                          <span className="font-sans text-sm font-semibold text-[#eef2ff]">
                            {entry.name || entry.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-[#8080a0]">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px]">
                          {entry.community}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center text-[#8080a0]">
                        {entry.guessesCount}
                      </td>
                      <td className="py-4 px-3 text-right font-bold text-[#00f0ff] text-sm">
                        {entry.score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};