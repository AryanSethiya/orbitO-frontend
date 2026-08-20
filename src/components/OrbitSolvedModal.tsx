import { useState, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Check, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrbitSolvedProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype') => Promise<void>;
  loadingRoast: boolean;
  onReset: () => void;
  onViewStandings: () => void;
}

export const OrbitSolvedModal: FC<OrbitSolvedProps> = ({
  guessesCount,
  scoreBreakdown,
  roast,
  onGenerateRoast,
  loadingRoast,
  onReset,
  onViewStandings,
}) => {
  const [copied, setCopied] = useState(false);
  const finalScore = scoreBreakdown?.finalScore ?? 8420;

  const handleShare = () => {
    const text = `🌌 ORBITO #${new Date().toLocaleDateString()} 🎯\n` +
      `SOLVED in ${guessesCount} guesses!\n` +
      `Score: ${finalScore}\n` +
      `https://orbito.game`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 pt-20 pb-12 relative z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="stitch-solved-card w-full max-w-2xl rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center relative"
      >
        {/* Title */}
        <h2 className="font-sans text-4xl sm:text-5xl font-extrabold text-[#ff9d00] tracking-tight drop-shadow-[0_0_20px_rgba(255,157,0,0.6)] mb-1">
          SOLVED!
        </h2>
        <p className="font-mono text-sm sm:text-base text-[#eef2ff] mb-8">
          in <span className="font-bold text-[#ff9d00]">{guessesCount}</span> guesses
        </p>

        {/* AI Roast Terminal (Exact Stitch Box) */}
        <div className="w-full bg-[#070714] border border-[#00f0ff]/30 rounded-2xl p-5 sm:p-6 text-left mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <span className="font-mono text-xs font-bold text-[#00f0ff] tracking-wider">
              [&gt;] SYSTEM_ANALYSIS // AI_ROAST
            </span>
            <div className="flex gap-1.5">
              {(['savage', 'friendly', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onGenerateRoast(style)}
                  disabled={loadingRoast}
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 hover:bg-[#00f0ff]/20 text-[#8080a0] hover:text-[#00f0ff] transition-colors"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[70px] flex items-center font-mono text-xs sm:text-sm text-[#eef2ff] leading-relaxed">
            {loadingRoast ? (
              <span className="text-[#00f0ff] animate-pulse">&gt; Analyzing cognitive association jumps...</span>
            ) : (
              <p>
                {roast?.roastText || '"Look at Mr. Jetsetter over here, navigating the semantic starfield with precision!"'}
              </p>
            )}
          </div>

          <button
            onClick={handleShare}
            className="mt-4 text-[#00f0ff] hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'SHARE ORBIT TELEMETRY >'}</span>
          </button>
        </div>

        {/* Bottom 3 Stat Pods */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8">
          <div className="stitch-card p-4 rounded-2xl flex flex-col items-center">
            <span className="font-mono text-[10px] text-[#8080a0] uppercase tracking-wider">Score</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#00f0ff]">{finalScore.toLocaleString()}</span>
          </div>
          <div className="stitch-card p-4 rounded-2xl flex flex-col items-center">
            <span className="font-mono text-[10px] text-[#8080a0] uppercase tracking-wider">Time</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#ff9d00]">02:14</span>
          </div>
          <div className="stitch-card p-4 rounded-2xl flex flex-col items-center">
            <span className="font-mono text-[10px] text-[#8080a0] uppercase tracking-wider">Hints Used</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-[#eef2ff]">{scoreBreakdown?.hintsUsed ?? 0}</span>
          </div>
        </div>

        {/* Play Again Button */}
        <div className="flex gap-4">
          <button
            onClick={onReset}
            className="py-3 px-6 rounded-full border border-white/20 bg-white/5 text-[#eef2ff] font-mono text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            onClick={onViewStandings}
            className="py-3 px-6 rounded-full bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all"
          >
            Space Standings
          </button>
        </div>
      </motion.div>
    </div>
  );
};