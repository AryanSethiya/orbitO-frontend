import { useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import { motion } from 'framer-motion';

export const SpaceStandingsView: FC = () => {
  useEffect(() => {
    ApiClient.getDailyLeaderboard().catch((err) => console.error('Leaderboard error:', err));
  }, []);

  const defaultRanks = [
    { rank: 1, username: 'NovaHunter_X', guesses: 3, score: 1420550 },
    { rank: 2, username: 'Orion42_Sigma', guesses: 5, score: 1384200 },
    { rank: 3, username: 'VoidWalker_99', guesses: 6, score: 1290040 },
  ];

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto pt-24 pb-16 px-4 relative z-10">
      <div className="text-center mb-8">
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
          Space Standings
        </h1>
        <p className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase">
          Global Leaderboard // {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="stitch-card rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl"
      >
        <div className="grid grid-cols-12 pb-4 border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-[#8080a0]">
          <div className="col-span-2 sm:col-span-1">Rank</div>
          <div className="col-span-6 sm:col-span-6">Pilot</div>
          <div className="col-span-2 sm:col-span-2 text-center">Guesses</div>
          <div className="col-span-2 sm:col-span-3 text-right">Holding Score</div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {defaultRanks.map((row) => (
            <div
              key={row.rank}
              className="grid grid-cols-12 items-center p-3.5 rounded-xl bg-[#070714] border border-white/5 hover:border-[#00f0ff]/30 transition-all font-mono text-xs"
            >
              <div className="col-span-2 sm:col-span-1 flex items-center gap-1 text-[#ff9d00] font-bold">
                {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉'} #{row.rank}
              </div>
              <div className="col-span-6 sm:col-span-6 font-sans text-sm font-semibold text-[#eef2ff]">
                {row.username}
              </div>
              <div className="col-span-2 sm:col-span-2 text-center text-[#8080a0]">
                {row.guesses}
              </div>
              <div className="col-span-2 sm:col-span-3 text-right font-bold text-[#00f0ff]">
                {row.score.toLocaleString()}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-12 items-center p-3.5 rounded-xl bg-[#1a1710] border-2 border-[#ff9d00] shadow-[0_0_20px_rgba(255,157,0,0.3)] font-mono text-xs my-2">
            <div className="col-span-2 sm:col-span-1 text-[#ff9d00] font-bold">
              #42
            </div>
            <div className="col-span-6 sm:col-span-6 font-sans text-sm font-bold text-[#ff9d00] flex items-center gap-2">
              <span>You (AstroPioneer)</span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-[#ff9d00]/20 text-[#ff9d00] font-mono">YOU</span>
            </div>
            <div className="col-span-2 sm:col-span-2 text-center text-[#ff9d00]">
              2
            </div>
            <div className="col-span-2 sm:col-span-3 text-right font-bold text-[#ff9d00]">
              890
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};