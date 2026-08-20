import type { FC } from 'react';
import { HelpCircle, Trophy } from 'lucide-react';

interface HeaderProps {
  date: string;
  difficulty: string;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export const Header: FC<HeaderProps> = ({
  onOpenLeaderboard,
  onOpenHelp,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full bg-[#111125]/70 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex justify-between items-center px-6 py-4 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenHelp}
          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-white/5 active:scale-95"
          title="How to play"
        >
          <HelpCircle className="w-5 h-5 text-[#b9cacb] hover:text-[#00f0ff]" />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="font-headline-md text-2xl md:text-3xl font-bold tracking-tighter text-[#00f0ff] drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
          ORBITO
        </h1>
        <span className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-widest">
          Semantic Word Radar
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLeaderboard}
          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-white/5 active:scale-95 flex items-center gap-1"
          title="Leaderboard"
        >
          <Trophy className="w-5 h-5 text-[#b9cacb] hover:text-[#00f0ff]" />
        </button>
      </div>
    </header>
  );
};