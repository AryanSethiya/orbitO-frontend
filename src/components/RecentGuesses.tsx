import type { FC } from 'react';
import type { GuessResult } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentGuessesProps {
  guesses: GuessResult[];
}

export const RecentGuesses: FC<RecentGuessesProps> = ({ guesses }) => {
  if (!guesses || guesses.length === 0) {
    return (
      <div className="w-full max-w-md my-6 text-center text-[#b9cacb] font-label-mono text-xs opacity-60">
        Type any word to probe the semantic starfield...
      </div>
    );
  }

  const reversed = [...guesses].reverse();

  return (
    <div className="w-full max-w-md flex flex-col gap-2 mt-4">
      <div className="flex justify-between items-center px-2 mb-1">
        <h2 className="font-label-mono text-xs text-[#b9cacb] uppercase tracking-wider">
          Trajectory History ({guesses.length})
        </h2>
        <span className="font-label-mono text-[10px] text-[#b9cacb]">
          Similarity Distance
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {reversed.map((g, idx) => {
            const isLatest = idx === 0;
            const percent = Math.max(5, Math.min(100, Math.round(100 - Math.log10(g.rank || 1) * 22)));

            return (
              <motion.div
                key={`${g.word}-${idx}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`glass-panel rounded-xl p-3.5 flex justify-between items-center transition-all ${
                  isLatest
                    ? 'bg-[#28283c]/80 border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                    : 'bg-[#1e1e31]/40 hover:bg-[#1e1e31]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{g.signal?.emoji || '🌌'}</span>
                  <div className="flex flex-col">
                    <span className="font-semantic-word text-base text-[#e2e0fb] font-medium capitalize">
                      {g.word}
                    </span>
                    <span className="font-label-mono text-[10px] text-[#b9cacb]">
                      {g.signal?.label || 'Deep Space'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-label-mono text-xs font-semibold ${
                      g.rank <= 10
                        ? 'text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                        : g.rank <= 100
                        ? 'text-[#ffb59a] font-bold'
                        : 'text-[#849495]'
                    }`}
                  >
                    Rank #{g.rank ? g.rank.toLocaleString() : '-'}
                  </span>

                  <div className="h-1.5 w-16 bg-[#0c0c1f] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        g.rank <= 10
                          ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'
                          : g.rank <= 100
                          ? 'bg-[#ff5e07] shadow-[0_0_8px_#ff5e07]'
                          : 'bg-[#849495]'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};