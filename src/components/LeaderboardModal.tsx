import { useEffect, useState, type FC } from 'react';
import type { LeaderboardEntry } from '../types/game.js';
import { ApiClient } from '../api/client.js';
import { X, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardModalProps {
  onClose: () => void;
  userScore?: number;
}

export const LeaderboardModal: FC<LeaderboardModalProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getDailyLeaderboard()
      .then((res) => {
        setEntries(res.leaderboard);
      })
      .catch((err) => console.error('Failed to load leaderboard:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl w-full max-w-lg p-6 flex flex-col relative max-h-[85vh] overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00f0ff]" />
            <h2 className="font-display-lg-mobile text-xl font-bold text-[#e2e0fb]">
              SPACE STANDINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#849495] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-label-mono text-[#b9cacb] animate-pulse">
            Fetching standings from Redis orbital cache...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-xs font-label-mono text-[#849495]">
            No orbital solves recorded yet today. Be the first to claim the center!
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {entries.map((entry) => {
              const isFirst = entry.rank === 1;
              return (
                <div
                  key={entry.userId + entry.rank}
                  className={`p-3.5 rounded-xl flex items-center justify-between transition-all ${
                    isFirst
                      ? 'bg-[#333348]/80 border border-[#00f0ff]/50 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                      : 'bg-[#1e1e31]/40 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-label-mono text-xs w-6 text-center font-bold ${
                        isFirst ? 'text-[#00f0ff]' : entry.rank <= 3 ? 'text-[#ffb59a]' : 'text-[#849495]'
                      }`}
                    >
                      #{entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#28283c] border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-body-md text-sm text-[#e2e0fb] font-medium">
                      {entry.username}
                    </span>
                  </div>

                  <span
                    className={`font-label-mono text-sm font-bold ${
                      isFirst ? 'text-[#00f0ff] drop-shadow-[0_0_8px_#00f0ff]' : 'text-[#ffb59a]'
                    }`}
                  >
                    {entry.score} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};