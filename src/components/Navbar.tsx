import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { Settings, Target, BookOpen, Trophy } from 'lucide-react';

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
      <nav className="fixed top-0 left-0 right-0 w-full bg-black/85 backdrop-blur-xl border-b border-white/10 z-50 transition-all">
        <div className="flex justify-between items-center px-3 sm:px-4 md:px-margin-desktop py-3 sm:py-4 w-full mx-auto max-w-container-max">
          {/* Brand Logo (Bright White) */}
          <div 
            onClick={() => setCurrentView('landing')}
            className="cursor-pointer font-display-hero text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black text-white hover:text-white transition-all tracking-wider select-none drop-shadow-[0_0_25px_rgba(255,255,255,0.95)] hover:drop-shadow-[0_0_35px_rgba(255,255,255,1)] flex items-center gap-1.5"
          >
            <span>orbitO</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          </div>

          {/* Desktop Navigation Links (Order: STATIONS, CORE, RANKING) */}
          <div className="hidden md:flex gap-8 lg:gap-10 items-center font-telemetry-md text-sm">
            <button
              onClick={() => setCurrentView('briefing')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer py-1 ${
                currentView === 'briefing'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              STATIONS
            </button>

            <button
              onClick={() => setCurrentView('game')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer py-1 ${
                currentView === 'game'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              CORE
            </button>

            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`transition-all duration-200 uppercase tracking-wider cursor-pointer py-1 ${
                currentView === 'leaderboard'
                  ? 'text-white font-bold border-b-2 border-white'
                  : 'text-on-surface-variant/70 hover:text-primary'
              }`}
            >
              RANKING
            </button>
          </div>

          {/* Actions & Profile Icons */}
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Settings Icon */}
            <button 
              onClick={() => onOpenSettings ? onOpenSettings() : setCurrentView('briefing')}
              className="text-white/80 hover:text-primary transition-colors p-1.5 flex items-center justify-center cursor-pointer"
              title="Directives & Settings"
            >
              <Settings className="w-4 h-4 text-white hover:text-primary transition-colors" />
            </button>

            {/* Account / Callsign Entry */}
            {user ? (
              <button 
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-sm bg-white/5 border border-white/20 hover:border-primary text-white text-[11px] sm:text-xs font-mono transition-all cursor-pointer max-w-[140px] sm:max-w-[200px]"
                title={`Pilot Profile: ${user.username || user.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                <span className="font-bold tracking-wider uppercase text-white/90 truncate">{user.username || user.name}</span>
              </button>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-black font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(72,255,72,0.3)] shrink-0"
                title="Claim your permanent pilot callsign"
              >
                <span>CLAIM CALLSIGN</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Dock (Fixed bottom on small viewports) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-4 h-14 items-center px-1">
          <button
            onClick={() => setCurrentView('briefing')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer ${
              currentView === 'briefing' ? 'text-primary' : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider">STATIONS</span>
          </button>

          <button
            onClick={() => setCurrentView('game')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer relative ${
              currentView === 'game' ? 'text-primary' : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider font-bold">CORE</span>
            {currentView === 'game' && (
              <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('leaderboard')}
            className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors cursor-pointer ${
              currentView === 'leaderboard' ? 'text-primary' : 'text-on-surface-variant/70 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider">RANKING</span>
          </button>

          <button
            onClick={() => onOpenSettings ? onOpenSettings() : setCurrentView('briefing')}
            className="flex flex-col items-center justify-center gap-0.5 h-full text-on-surface-variant/70 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span className="font-label-caps text-[9px] uppercase tracking-wider">SETTINGS</span>
          </button>
        </div>
      </div>
    </>
  );
};