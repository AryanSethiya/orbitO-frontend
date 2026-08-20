import { useState, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Sparkles, Trophy, Check, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface SolveModalProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype' | 'balanced') => Promise<void>;
  loadingRoast: boolean;
  onOpenLeaderboard: () => void;
}

export const SolveModal: FC<SolveModalProps> = ({
  guessesCount,
  scoreBreakdown,
  roast,
  onGenerateRoast,
  loadingRoast,
  onOpenLeaderboard,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card supernova-glow rounded-2xl w-full max-w-lg p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-[#00f0ff]" />
        </div>

        <h2 className="font-display-lg-mobile md:font-display-lg text-3xl md:text-4xl text-[#ff8c00] drop-shadow-[0_0_12px_rgba(255,140,0,0.5)] font-bold mb-1">
          ORBIT SOLVED!
        </h2>
        <p className="font-headline-md text-lg text-[#e2e0fb] mb-6">
          You reached the Center in <span className="text-[#00f0ff] font-bold">{guessesCount}</span> guesses
        </p>

        {/* Score Stats Pods */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          <div className="glass-panel p-3 rounded-xl flex flex-col items-center">
            <span className="font-label-mono text-[10px] text-[#849495] uppercase">Final Score</span>
            <span className="font-semantic-word text-xl font-bold text-[#00f0ff]">{finalScore}</span>
          </div>
          <div className="glass-panel p-3 rounded-xl flex flex-col items-center">
            <span className="font-label-mono text-[10px] text-[#849495] uppercase">Guesses</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffb59a]">{guessesCount}</span>
          </div>
          <div className="glass-panel p-3 rounded-xl flex flex-col items-center">
            <span className="font-label-mono text-[10px] text-[#849495] uppercase">Hints Used</span>
            <span className="font-semantic-word text-xl font-bold text-[#ffdcc3]">{scoreBreakdown?.hintsUsed ?? 0}</span>
          </div>
        </div>

        {/* AI Roast Terminal */}
        <div className="terminal-window w-full rounded-xl p-5 mb-6 text-left shadow-lg">
          <div className="flex items-center justify-between border-b border-[#3b494b] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              <span className="font-label-mono text-xs text-[#00f0ff] uppercase tracking-widest">
                Gemini 3.5 Flash // Roast
              </span>
            </div>
            <div className="flex gap-1">
              {(['friendly', 'savage', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedStyle(style);
                    onGenerateRoast(style);
                  }}
                  disabled={loadingRoast}
                  className={`px-2 py-0.5 text-[9px] font-label-mono rounded capitalize transition-all ${
                    selectedStyle === style
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]'
                      : 'text-[#849495] hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[70px] flex items-center">
            {loadingRoast ? (
              <p className="font-label-mono text-xs text-[#b9cacb] animate-pulse">
                &gt; Analyzing cognitive leaps & word association trajectories...
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

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-full border border-[#00f0ff] text-[#00f0ff] font-label-mono text-xs uppercase tracking-wider hover:bg-[#00f0ff]/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Share Orbit'}
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-5 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Standings
          </button>
        </div>
      </motion.div>
    </div>
  );
};