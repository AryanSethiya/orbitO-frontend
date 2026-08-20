import type { FC } from 'react';
import { Trophy, Play, Archive, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'play' | 'standings' | 'archive' | 'profile';
  onSelectTab: (tab: 'play' | 'standings' | 'archive' | 'profile') => void;
  onGoHome: () => void;
}

export const Navbar: FC<NavbarProps> = ({ activeTab, onSelectTab, onGoHome }) => {
  return (
    <header className="w-full fixed top-0 left-0 z-50 px-4 md:px-10 py-4 flex justify-between items-center bg-[#05050c]/80 backdrop-blur-xl border-b border-white/5">
      {/* Brand */}
      <button onClick={onGoHome} className="flex items-center gap-2.5 text-left group">
        <div className="w-8 h-8 rounded-full border border-[#00f0ff]/40 bg-[#00f0ff]/10 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></div>
        </div>
        <span className="font-mono text-lg font-bold tracking-widest text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
          ORBITO
        </span>
      </button>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-8">
        {[
          { id: 'play', label: 'Play', icon: Play },
          { id: 'standings', label: 'Standings', icon: Trophy },
          { id: 'archive', label: 'Archive', icon: Archive },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as any)}
              className={`relative py-1 font-mono text-xs tracking-widest uppercase transition-colors ${
                isActive ? 'text-[#00f0ff] font-bold' : 'text-[#8080a0] hover:text-[#eef2ff]'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('standings')}
          className="md:hidden p-2 rounded-lg text-[#8080a0] hover:text-[#00f0ff]"
        >
          <Trophy className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full border border-white/10 bg-[#121224] flex items-center justify-center text-xs font-mono text-[#00f0ff]">
          AP
        </div>
      </div>
    </header>
  );
};