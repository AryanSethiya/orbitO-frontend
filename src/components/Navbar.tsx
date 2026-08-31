import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { Settings, User } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'briefing' | 'game' | 'leaderboard';
  setCurrentView: (view: 'landing' | 'briefing' | 'game' | 'leaderboard') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenCommunity: () => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
  onLogout: () => void;
  activeRoomCode?: string | null;
}

export const Navbar: FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenSettings,
}) => {
  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50 transition-all">
        <div className="flex justify-between items-center px-4 md:px-margin-desktop py-4 w-full mx-auto max-w-container-max">
          {/* Brand Logo (Bright White) */}
          <div 
            onClick={() => setCurrentView('landing')}
            className="cursor-pointer font-display-hero text-2xl md:text-3xl lg:text-4xl font-black text-white hover:text-white transition-all tracking-wider uppercase select-none drop-shadow-[0_0_25px_rgba(255,255,255,0.95)] hover:drop-shadow-[0_0_35px_rgba(255,255,255,1)]"
          >
            ORBITO
          </div>

          {/* Desktop Navigation Links (Order: STATIONS, CORE, RANKING) */}
          <div className="hidden md:flex gap-10 items-center font-telemetry-md text-sm">
            <button
              onClick={() => setCurrentView('briefing')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                currentView === 'briefing'
                  ? 'text-white font-bold border-b-2 border-white pb-1'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              STATIONS
            </button>

            <button
              onClick={() => setCurrentView('game')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                currentView === 'game'
                  ? 'text-white font-bold border-b-2 border-white pb-1'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              CORE
            </button>

            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'text-white font-bold border-b-2 border-white pb-1'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              RANKING
            </button>
          </div>

          {/* Actions & Profile Icons */}
          <div className="flex gap-4 items-center">
            {/* Settings Icon */}
            <button 
              onClick={() => onOpenSettings ? onOpenSettings() : setCurrentView('briefing')}
              className="text-white/80 hover:text-primary transition-colors p-1 flex items-center justify-center cursor-pointer"
              title="Directives & Settings"
            >
              <Settings className="w-5 h-5 text-white hover:text-primary transition-colors" />
            </button>

            {/* Account Icon (Pure White) */}
            <button 
              onClick={user ? onOpenProfile : onOpenAuth}
              className="text-white hover:text-white/80 transition-colors p-1 flex items-center justify-center cursor-pointer"
              title={user ? `Pilot: ${user.username || user.name}` : 'Sign In with Google'}
            >
              <div className="w-7 h-7 rounded-full border border-white/70 hover:border-white bg-white/5 flex items-center justify-center transition-all">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};