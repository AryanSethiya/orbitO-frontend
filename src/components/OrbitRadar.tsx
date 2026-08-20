import type { FC } from 'react';
import type { GuessResult } from '../types/game';
import { motion } from 'framer-motion';

interface OrbitRadarProps {
  guesses: GuessResult[];
  isSolved: boolean;
}

export const OrbitRadar: FC<OrbitRadarProps> = ({ guesses, isSolved }) => {
  const bestGuess = guesses && guesses.length > 0
    ? [...guesses].sort((a, b) => (a.rank || 9999) - (b.rank || 9999))[0]
    : null;

  const getNodePosition = (rank: number, index: number) => {
    let radiusFraction = Math.min(0.9, Math.max(0.22, Math.log10(Math.max(1, rank)) / 3.8));
    if (rank === 1) radiusFraction = 0;

    const angle = (index * 137.5 * Math.PI) / 180;
    const x = 50 + radiusFraction * 44 * Math.cos(angle);
    const y = 50 + radiusFraction * 44 * Math.sin(angle);
    return { x, y };
  };

  const getHeatDetails = (tier: string) => {
    switch (tier) {
      case 'CENTER':
        return { color: '#00f0ff', glow: 'rgba(0,240,255,1)', ringColor: '#00f0ff' };
      case 'BURNING':
        return { color: '#ff3b00', glow: 'rgba(255,59,0,1)', ringColor: '#ff3b00' };
      case 'VERY_HOT':
        return { color: '#ff8c00', glow: 'rgba(255,140,0,1)', ringColor: '#ff8c00' };
      case 'HOT':
        return { color: '#ffb59a', glow: 'rgba(255,181,154,0.8)', ringColor: '#ffb59a' };
      case 'WARM':
        return { color: '#ffdcc3', glow: 'rgba(255,220,195,0.6)', ringColor: '#ffdcc3' };
      default:
        return { color: '#687787', glow: 'rgba(104,119,135,0.4)', ringColor: '#3b494b' };
    }
  };

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center my-4 select-none">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-radial from-[#00f0ff]/10 via-[#7213ff]/5 to-transparent pointer-events-none"></div>

      {/* Radar Sweep Animation */}
      <div className="radar-sweep"></div>

      {/* Concentric Orbital Rings */}
      <div className="absolute w-[92%] h-[92%] rounded-full border border-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"></div>
      <div className="absolute w-[70%] h-[70%] rounded-full border border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.03)]"></div>
      <div className="absolute w-[46%] h-[46%] rounded-full border border-white/15 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]"></div>
      <div className="absolute w-[24%] h-[24%] rounded-full border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]"></div>

      {/* Crosshairs Coordinates (0°, 90°, 180°, 270°) */}
      <div className="absolute top-2 font-label-mono text-[8px] text-[#849495]/60 tracking-widest">N 000°</div>
      <div className="absolute bottom-2 font-label-mono text-[8px] text-[#849495]/60 tracking-widest">S 180°</div>
      <div className="absolute left-2 font-label-mono text-[8px] text-[#849495]/60 tracking-widest">W 270°</div>
      <div className="absolute right-2 font-label-mono text-[8px] text-[#849495]/60 tracking-widest">E 090°</div>

      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none"></div>

      {/* Central Target Sun / Epicenter */}
      <motion.div
        animate={
          isSolved
            ? { scale: [1, 1.4, 1], boxShadow: ['0 0 25px #00f0ff', '0 0 80px #00f0ff', '0 0 25px #00f0ff'] }
            : { scale: [1, 1.1, 1] }
        }
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
        className="w-12 h-12 rounded-full bg-[#00f0ff]/15 border-2 border-[#00f0ff] shadow-[0_0_35px_rgba(0,240,255,0.6)] flex items-center justify-center relative z-20"
      >
        <div className="w-5 h-5 rounded-full bg-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,1)]"></div>
      </motion.div>

      {/* Trajectory Nodes on the Radar */}
      {(guesses || []).slice(-8).map((g, idx) => {
        const { x, y } = getNodePosition(g.rank || 9999, idx);
        const { color, glow } = getHeatDetails(g?.signal?.tier || 'COLD');

        return (
          <motion.div
            key={`node-${g.word}-${idx}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
          >
            {/* Glowing Orb */}
            <div
              style={{ backgroundColor: color, boxShadow: `0 0 14px ${glow}` }}
              className="w-3 h-3 rounded-full border border-white/40 animate-pulse"
            />
            {/* Word Badge */}
            <div
              style={{ borderColor: `${color}66` }}
              className="mt-1 px-2 py-0.5 rounded-md bg-[#080816]/90 border backdrop-blur-md flex items-center gap-1 shadow-lg"
            >
              <span style={{ color }} className="font-label-mono text-[9px] font-bold">
                {g.word}
              </span>
              <span className="text-[8px] font-label-mono text-[#849495]">
                #{g.rank}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Best Rank Telemetry Capsule */}
      <div className="absolute -bottom-3 px-4 py-1.5 rounded-full cyber-glass border border-white/10 text-xs font-label-mono text-[#b9cacb] flex items-center gap-2 shadow-xl z-20">
        <span className="text-[#849495] uppercase text-[10px]">Closest Orbit:</span>
        <span className="text-[#00f0ff] font-bold">
          {bestGuess ? `#${bestGuess.rank} (${bestGuess.word})` : 'Searching starfield...'}
        </span>
      </div>
    </div>
  );
};