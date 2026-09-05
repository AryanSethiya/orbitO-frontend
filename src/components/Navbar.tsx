import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { Settings } from 'lucide-react';

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
          <div className="flex gap-3 items-center">
            {/* Settings Icon */}
            <button 
              onClick={() => onOpenSettings ? onOpenSettings() : setCurrentView('briefing')}
              className="text-white/80 hover:text-primary transition-colors p-1 flex items-center justify-center cursor-pointer"
              title="Directives & Settings"
            >
              <Settings className="w-4 h-4 text-white hover:text-primary transition-colors" />
            </button>

            {/* Account / Callsign Entry */}
            {user ? (
              <button 
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1 rounded-sm bg-white/5 border border-white/20 hover:border-primary text-white text-xs font-mono transition-all cursor-pointer"
                title={`Pilot Profile: ${user.username || user.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-bold tracking-wider uppercase text-white/90">{user.username || user.name}</span>
              </button>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(72,255,72,0.3)]"
                title="Claim your permanent pilot callsign"
              >
                <span>CLAIM CALLSIGN</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};