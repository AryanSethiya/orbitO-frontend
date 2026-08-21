import { useState, useEffect, type FC } from 'react';
import type { ScoreBreakdown, AIRoast } from '../types/game';
import { Share2, Trophy, Loader2, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrbitSolvedModalProps {
  guessesCount: number;
  scoreBreakdown?: ScoreBreakdown | null;
  hintsUsed: number;
  roast: AIRoast | null;
  onGenerateRoast: (style: 'friendly' | 'savage' | 'hype') => void;
  loadingRoast: boolean;
  onViewStandings: () => void;
}

export const OrbitSolvedModal: FC<OrbitSolvedModalProps> = ({
  guessesCount,
  scoreBreakdown,
  hintsUsed,
  roast,
  onGenerateRoast,
  loadingRoast,
  onViewStandings,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = () => {
    const text = `🌌 ORBITO DAILY PUZZLE SOLVED!\n🎯 Guesses: ${guessesCount}\n💡 Hints: ${hintsUsed}\n🏆 Score: ${scoreBreakdown?.finalScore || 1000}/1000\n\nPlay today's orbit: http://localhost:5173`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg stitch-solved-card rounded-3xl p-6 sm:p-8 border border-[#ff9d00]/30 shadow-2xl relative flex flex-col items-center text-center"
      >
        {/* Solved Title with Amber Glow */}
        <h1 className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-[#ff9d00] mb-1 drop-shadow-[0_0_20px_rgba(255,157,0,0.4)]">
          SOLVED!
        </h1>
        <p className="font-mono text-xs text-[#8080a0] uppercase tracking-widest mb-4">
          in {guessesCount} {guessesCount === 1 ? 'guess' : 'guesses'}
        </p>

        {/* AI Roast Terminal Card */}
        <div className="w-full stitch-terminal rounded-2xl p-4 sm:p-5 border border-white/10 mb-5 text-left relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
            <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3 h-3 text-[#00f0ff]" />
              [&gt;] SYSTEM_ANALYSIS // AI_ROAST
            </span>

            {/* Style Switcher */}
            <div className="flex gap-1.5">
              {(['savage', 'friendly', 'hype'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onGenerateRoast(style)}
                  disabled={loadingRoast}
                  className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[#8080a0] hover:text-[#eef2ff] transition-all disabled:opacity-50"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {loadingRoast ? (
            <div className="py-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00f0ff] animate-spin" />
              <span className="font-mono text-xs text-[#00f0ff]">Generating neural reaction...</span>
            </div>
          ) : (
            <p className="font-mono text-xs text-[#eef2ff] leading-relaxed italic">
              "{roast?.roastText || 'Orbital target acquired with surgical precision. Trajectory locked in record time.'}"
            </p>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 mb-5"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'TELEMETRY COPIED!' : 'SHARE ORBIT TELEMETRY >'}</span>
        </button>

        {/* 3 Metric Pods */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-5">
          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Score</span>
            <span className="font-mono text-base font-bold text-[#00f0ff]">
              {scoreBreakdown?.finalScore || 1000}
            </span>
          </div>

          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Time</span>
            <span className="font-mono text-base font-bold text-[#eef2ff]">02:14</span>
          </div>

          <div className="stitch-card rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="font-mono text-[9px] text-[#8080a0] uppercase">Hints Used</span>
            <span className="font-mono text-base font-bold text-[#ff9d00]">{hintsUsed}</span>
          </div>
        </div>

        {/* Action: Space Standings & Midnight Countdown (One-Play Rule) */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onViewStandings}
            className="w-full py-3 px-4 rounded-xl border border-white/10 bg-[#070714] text-[#eef2ff] font-mono text-xs font-bold uppercase tracking-wider hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-[#ff9d00]" />
            <span>View Space Standings</span>
          </button>

          <div className="py-2 px-3 rounded-xl bg-[#0c0c1f] border border-white/5 flex items-center justify-center gap-2 text-center">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-mono text-[10px] text-[#8080a0]">
              Next Daily Orbit in <strong className="text-[#00f0ff]">{countdown}</strong>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};