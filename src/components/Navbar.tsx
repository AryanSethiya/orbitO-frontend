import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { Users, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  currentView: 'mission' | 'game' | 'leaderboard';
  setCurrentView: (view: 'mission' | 'game' | 'leaderboard') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenCommunity: () => void;
  onLogout: () => void;
  activeRoomCode?: string | null;
}

export const Navbar: FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onOpenCommunity,
  onLogout,
  activeRoomCode,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#05050c]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div 
        onClick={() => setCurrentView('mission')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <img 
          src="/logo.png" 
          alt="oRBITO Logo" 
          className="h-9 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(0,240,255,0.6)] group-hover:scale-105 transition-all duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col">
          <span className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest font-bold">Orbito</span>
          <span className="font-mono text-[9px] text-[#8080a0] tracking-wider">Semantic Orbit</span>
        </div>
      </div>

      {/* Navigation Center Tabs */}
      <nav className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setCurrentView('game')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
            currentView === 'game'
              ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'text-[#8080a0] hover:text-[#eef2ff]'
          }`}
        >
          Daily Orbit
        </button>

        <button
          onClick={() => setCurrentView('leaderboard')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
            currentView === 'leaderboard'
              ? 'bg-[#00f0ff] text-[#05050c] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'text-[#8080a0] hover:text-[#eef2ff]'
          }`}
        >
          Standings
        </button>
      </nav>

      {/* User Actions / Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="fleet-rooms-btn"
          onClick={onOpenCommunity}
          className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-xs hover:bg-[#00f0ff]/20 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">
            {activeRoomCode ? `Room ${activeRoomCode}` : user?.community || 'Rooms'}
          </span>
          <span className="sm:hidden font-bold">
            {activeRoomCode || 'Fleet'}
          </span>
        </button>

        {user ? (
          <div className="flex items-center gap-2.5 bg-[#0c0c1f] px-3 py-1.5 rounded-2xl border border-white/15">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || user.email || 'pilot')}`}
              alt="Pilot Avatar"
              className="w-6 h-6 rounded-full border border-[#00f0ff]/50 bg-black/40 object-cover"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="font-mono text-xs font-bold text-[#eef2ff] leading-none">{user.name || 'Pilot'}</span>
              <span className="font-mono text-[9px] text-[#00f0ff] leading-none mt-0.5">{user.community || 'Fleet'}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="text-[#8080a0] hover:text-[#ff5e07] transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="sign-in-nav-btn"
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all flex items-center gap-1.5 active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};