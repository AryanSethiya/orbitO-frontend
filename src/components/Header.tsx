import type { FC } from 'react';
import { HelpCircle, Trophy, Orbit } from 'lucide-react';

interface HeaderProps {
  date: string;
  difficulty: string;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export const Header: FC<HeaderProps> = ({
  difficulty,
  onOpenLeaderboard,
  onOpenHelp,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-40 px-4 md:px-8 py-3.5">
      <div className="max-w-4xl mx-auto cyber-glass rounded-2xl px-5 py-2.5 flex justify-between items-center shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f0ff]/20 to-[#7213ff]/30 border border-[#00f0ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Orbit className="w-5 h-5 text-[#00f0ff] animate-spin" style={{ animationDuration: '25s' }} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display-lg text-lg md:text-xl font-bold tracking-tight text-[#dbfcff] glow-cyan">
                ORBITO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-label-mono font-bold uppercase tracking-wider bg-[#ff5e07]/15 border border-[#ff5e07]/40 text-[#ffb59a]">
                {difficulty || 'DAILY'}
              </span>
            </div>
            <span className="text-[10px] font-label-mono text-[#849495] tracking-wider uppercase hidden sm:block">
              Semantic Distance Radar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-[#b9cacb] hover:text-[#00f0ff] hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-label-mono"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-[#00f0ff]" />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-label-mono font-semibold"
            title="Space Standings"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Standings</span>
          </button>
        </div>
      </div>
    </header>
  );
};