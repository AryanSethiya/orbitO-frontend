import type { FC } from 'react';
import type { GuessResult } from '../types/game';
import { motion } from 'framer-motion';

interface OrbitRadarProps {
  guesses: GuessResult[];
  isSolved: boolean;
}

export const OrbitRadar: FC<OrbitRadarProps> = ({ guesses, isSolved }) => {
  const bestGuess = guesses.length > 0 ? [...guesses].sort((a, b) => a.rank - b.rank)[0] : null;

  const getNodePosition = (rank: number, index: number) => {
    let radiusFraction = Math.min(1, Math.max(0.18, Math.log10(rank) / 4.5));
    if (rank === 1) radiusFraction = 0;

    const angle = (index * 137.5 * Math.PI) / 180;
    const x = 50 + radiusFraction * 40 * Math.cos(angle);
    const y = 50 + radiusFraction * 40 * Math.sin(angle);
    return { x, y };
  };

  const getHeatColor = (tier: string) => {
    switch (tier) {
      case 'CENTER':
        return '#00f0ff';
      case 'BURNING':
        return '#ff5e07';
      case 'VERY_HOT':
        return '#ff8c00';
      case 'HOT':
        return '#ffb59a';
      case 'WARM':
        return '#ffdcc3';
      case 'COLD':
        return '#849495';
      default:
        return '#3b494b';
    }
  };

  return (
    <div className="relative w-full max-w-[340px] md:max-w-[380px] aspect-square flex items-center justify-center my-6 radar-gradient rounded-full">
      {/* Concentric Orbital Rings */}
      <div className="orbital-ring w-[100%] h-[100%] border-white/5"></div>
      <div className="orbital-ring w-[75%] h-[75%] border-white/10"></div>
      <div className="orbital-ring w-[50%] h-[50%] border-white/15"></div>
      <div className="orbital-ring w-[25%] h-[25%] border-primary/30"></div>

      {/* Central Sun / Target Center */}
      <motion.div
        animate={
          isSolved
            ? { scale: [1, 1.3, 1], boxShadow: ['0 0 20px #00f0ff', '0 0 60px #00f0ff', '0 0 20px #00f0ff'] }
            : { scale: [1, 1.08, 1] }
        }
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="w-14 h-14 rounded-full bg-primary/10 border border-[#00f0ff]/60 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center relative z-10"
      >
        <div className="w-6 h-6 rounded-full bg-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.9)]"></div>
      </motion.div>

      {/* Render recent guess points */}
      {guesses.slice(-8).map((g, idx) => {
        const { x, y } = getNodePosition(g.rank, idx);
        const color = getHeatColor(g?.signal?.tier || 'COLD');

        return (
          <motion.div
            key={`${g.word}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
              className="w-2.5 h-2.5 rounded-full"
            />
            <span
              style={{ color }}
              className="font-label-mono text-[10px] whitespace-nowrap mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {g.word}
            </span>
          </motion.div>
        );
      })}

      {/* Status Badge */}
      <div className="absolute -bottom-3 px-4 py-1 rounded-full glass-panel border border-white/10 text-xs font-label-mono text-[#b9cacb] flex items-center gap-2">
        <span>Closest Orbit:</span>
        <span className="text-[#ffb59a] font-bold">
          {bestGuess ? `#${bestGuess.rank} (${bestGuess.word})` : 'No orbits yet'}
        </span>
      </div>
    </div>
  );
};