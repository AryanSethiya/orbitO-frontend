import { useState, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Sparkles, Trophy, Check, Terminal, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SolveModalProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype' | 'balanced') => Promise<void>;
  loadingRoast: boolean;
  onOpenLeaderboard: () => void;
  onResetGame: () => void;
}

export const SolveModal: FC<SolveModalProps> = ({
  guessesCount,
  scoreBreakdown,
  roast,
  onGenerateRoast,
  loadingRoast,
  onOpenLeaderboard,
  onResetGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'friendly' | 'savage' | 'hype' | 'balanced'>('savage');

  const finalScore = scoreBreakdown?.finalScore ?? 890;

  const handleShare = () => {
    const text = `🌌 ORBITO #${new Date().toLocaleDateString()} 🎯\n` +
      `Solved in ${guessesCount} guesses!\n` +
      `Score: ${finalScore} pts\n` +
      `https://orbito.game`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="cyber-glass box-glow-supernova rounded-3xl w-full max-w-lg p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-[#ff5e07]/40 my-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff5e07]/30 to-[#00f0ff]/20 border-2 border-[#00f0ff] shadow-[0_0_35px_rgba(0,240,255,0.8)] flex items-center justify-center mb-3">
          <Sparkles className="w-8 h-8 text-[#00f0ff]" />
        </div>

        <h2 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-[#dbfcff] glow-cyan tracking-tight mb-1">
          ORBIT SOLVED!
        </h2>
        <p className="font-headline-md text-sm sm:text-base text-[#b9cacb] mb-6">
          You reached the Center in <span className="text-[#00f0ff] font-bold">{guessesCount}</span> guesses
        </p>

        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Final Score</span>
            <span className="font-semantic-word text-xl font-bold text-[#00f0ff]">{finalScore}</span>
          </div>
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Guesses</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffb59a]">{guessesCount}</span>
          </div>
          <div className="cyber-glass p-3 rounded-2xl flex flex-col items-center">
            <span className="font-label-mono text-[9px] text-[#849495] uppercase tracking-wider">Clues Used</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffdcc3]">{scoreBreakdown?.hintsUsed ?? 0}</span>
          </div>
        </div>

        <div className="terminal-screen w-full rounded-2xl p-4 sm:p-5 mb-6 text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#3b494b] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              <span className="font-label-mono text-[11px] text-[#00f0ff] font-bold uppercase tracking-wider">
                Gemini 3.5 Flash // Neural Roast
              </span>
            </div>
            <div className="flex gap-1">
              {(['savage', 'friendly', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedStyle(style);
                    onGenerateRoast(style);
                  }}
                  disabled={loadingRoast}
                  className={`px-2.5 py-0.5 text-[9px] font-label-mono font-bold rounded-md capitalize transition-all ${
                    selectedStyle === style
                      ? 'bg-[#00f0ff] text-[#00363a] shadow-[0_0_10px_#00f0ff]'
                      : 'text-[#849495] hover:text-white bg-white/5'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[75px] flex items-center">
            {loadingRoast ? (
              <p className="font-label-mono text-xs text-[#00f0ff] animate-pulse">
                &gt; Synthesizing cognitive association trajectory and roasting player...
              </p>
            ) : roast ? (
              <p className="font-label-mono text-xs text-[#e2e0fb] leading-relaxed">
                "{roast.roastText}"
              </p>
            ) : (
              <p className="font-label-mono text-xs text-[#849495]">
                &gt; Click a roast style to trigger AI commentary.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-full border border-[#00f0ff] text-[#00f0ff] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/15 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied Results!' : 'Share Orbit'}</span>
          </button>
          
          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-6 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Standings</span>
          </button>
        </div>

        <button
          onClick={onResetGame}
          className="mt-4 text-[11px] font-label-mono text-[#849495] hover:text-[#00f0ff] flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Play again with a fresh board</span>
        </button>
      </motion.div>
    </div>
  );
};