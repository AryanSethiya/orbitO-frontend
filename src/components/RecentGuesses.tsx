import type { FC } from 'react';
import type { GuessResult } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

interface RecentGuessesProps {
  guesses: GuessResult[];
}

export const RecentGuesses: FC<RecentGuessesProps> = ({ guesses }) => {
  if (!guesses || guesses.length === 0) {
    return (
      <div className="w-full max-w-md my-6 text-center cyber-glass p-6 rounded-2xl border border-white/5">
        <Sparkles className="w-6 h-6 text-[#00f0ff] mx-auto mb-2 opacity-60 animate-pulse" />
        <p className="font-label-mono text-xs text-[#b9cacb] mb-1 font-medium">Starfield Telemetry Ready</p>
        <p className="font-body-md text-xs text-[#849495]">
          Type words to probe semantic meaning distance to the center.
        </p>
      </div>
    );
  }

  const reversed = [...guesses].reverse();

  return (
    <div className="w-full max-w-md flex flex-col gap-2 mt-4">
      <div className="flex justify-between items-center px-3 mb-1">
        <h2 className="font-label-mono text-xs text-[#b9cacb] uppercase tracking-wider font-semibold flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#ff5e07]" />
          <span>Trajectory History ({guesses.length})</span>
        </h2>
        <span className="font-label-mono text-[10px] text-[#849495]">
          Proximity Heat
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {reversed.map((g, idx) => {
            const isLatest = idx === 0;
            const isCenter = g.rank === 1;
            const isBurning = g.rank <= 10;
            const isHot = g.rank <= 100;
            const percent = Math.max(5, Math.min(100, Math.round(100 - Math.log10(g.rank || 1) * 23)));

            return (
              <motion.div
                key={`${g.word}-${idx}`}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-xl p-3.5 flex justify-between items-center transition-all duration-200 ${
                  isCenter
                    ? 'cyber-glass-glow bg-[#00f0ff]/15 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.3)]'
                    : isLatest
                    ? 'cyber-glass bg-[#28283c]/80 border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'cyber-glass hover:bg-[#1e1e31]/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{g.signal?.emoji || '🌌'}</span>
                  <div className="flex flex-col">
                    <span className={`font-semantic-word text-base font-semibold capitalize ${
                      isCenter ? 'text-[#00f0ff] glow-cyan' : isBurning ? 'text-[#ff5e07]' : 'text-[#e2e0fb]'
                    }`}>
                      {g.word}
                    </span>
                    <span className="font-label-mono text-[10px] text-[#849495]">
                      {g.signal?.label || 'Deep Space'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-label-mono text-xs font-bold ${
                      isCenter
                        ? 'text-[#00f0ff] glow-cyan'
                        : isBurning
                        ? 'text-[#ff5e07] glow-orange'
                        : isHot
                        ? 'text-[#ffb59a]'
                        : 'text-[#849495]'
                    }`}
                  >
                    Rank #{g.rank ? g.rank.toLocaleString() : '-'}
                  </span>

                  <div className="h-2 w-16 bg-[#080816] rounded-full overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCenter
                          ? 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]'
                          : isBurning
                          ? 'bg-gradient-to-r from-[#ff5e07] to-[#ff8c00] shadow-[0_0_10px_#ff5e07]'
                          : isHot
                          ? 'bg-[#ffb59a]'
                          : 'bg-[#849495]/60'
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