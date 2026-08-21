import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { LogOut, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'play' | 'standings' | 'archive' | 'profile';
  onSelectTab: (tab: 'play' | 'standings' | 'archive' | 'profile') => void;
  onGoHome: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onGoHome,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 h-16 border-b border-white/5 bg-[#05050c]/80 backdrop-blur-md z-50 flex items-center justify-between px-4 md:px-8">
      {/* Brand Logo */}
      <div
        onClick={onGoHome}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center relative shadow-[0_0_12px_#00f0ff]">
          <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></div>
        </div>
        <span className="font-mono text-base font-bold tracking-widest text-[#eef2ff] group-hover:text-[#00f0ff] transition-colors">
          ORBITO
        </span>
      </div>

      {/* Center Nav Tabs */}
      <nav className="flex items-center gap-6 sm:gap-8">
        <button
          onClick={() => onSelectTab('play')}
          className={`relative font-mono text-xs uppercase tracking-wider py-1 transition-colors ${
            activeTab === 'play' ? 'text-[#00f0ff]' : 'text-[#8080a0] hover:text-[#eef2ff]'
          }`}
        >
          <span>Play</span>
          {activeTab === 'play' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('standings')}
          className={`relative font-mono text-xs uppercase tracking-wider py-1 transition-colors ${
            activeTab === 'standings' ? 'text-[#00f0ff]' : 'text-[#8080a0] hover:text-[#eef2ff]'
          }`}
        >
          <span>Standings</span>
          {activeTab === 'standings' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></span>
          )}
        </button>
      </nav>

      {/* User Profile / Google Auth Chip */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 bg-[#0c0c1f] border border-white/10 rounded-full py-1 px-3">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-6 h-6 rounded-full border border-[#00f0ff]"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-mono text-[11px] font-bold text-[#eef2ff] leading-none">
                {user.name}
              </span>
              <span className="font-mono text-[9px] text-[#00f0ff] leading-none mt-0.5">
                {user.community}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-[#8080a0] hover:text-[#ff5e07] ml-1 p-1 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-[#0c0c1f] border border-[#00f0ff]/40 text-[#00f0ff] font-mono text-xs font-bold hover:bg-[#00f0ff] hover:text-[#05050c] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};