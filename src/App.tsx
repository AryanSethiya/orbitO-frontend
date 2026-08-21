import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MissionControlLanding } from './components/MissionControlLanding';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { AuthModal } from './components/AuthModal';
import { ApiClient } from './api/client';
import type { SessionSummary, AIRoast, UserProfile } from './types/game';

export function App() {
  const [currentView, setCurrentView] = useState<'mission_control' | 'gameplay' | 'solved' | 'standings'>('mission_control');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roast, setRoast] = useState<AIRoast | null>(null);
  const [loadingRoast, setLoadingRoast] = useState(false);

  // Restore user session
  useEffect(() => {
    const savedUser = localStorage.getItem('orbito_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
  }, []);

  const getPlayerId = () => {
    if (user?.id) return user.id;
    let id = localStorage.getItem('orbito_player_id');
    if (!id || id.length !== 36) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : '11111111-2222-3333-4444-555555555555';
      localStorage.setItem('orbito_player_id', id);
    }
    return id;
  };

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = getPlayerId();
      const sess = await ApiClient.startSession(id);
      setSession(sess);

      if (sess.solved || sess.status === 'solved') {
        setCurrentView('solved');
        loadRoast(sess.sessionId, 'savage');
      } else {
        setCurrentView('gameplay');
      }
    } catch (err: any) {
      console.error('Session start error:', err);
      setError(err?.message || 'Could not connect to backend.');
      setCurrentView('gameplay');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (guess: string) => {
    if (!session) return;
    try {
      const result = await ApiClient.submitGuess(session.sessionId, guess);
      const updatedGuesses = [...(session.guesses || []), result];
      const isSolved = result.isSolved || result.rank === 1;

      setSession({
        ...session,
        guesses: updatedGuesses,
        guessesCount: updatedGuesses.length,
        solved: isSolved,
        score: result.scoreBreakdown?.finalScore ?? session.score,
      });

      if (isSolved) {
        setCurrentView('solved');
        loadRoast(session.sessionId, 'savage');
      }
    } catch (err: any) {
      alert(err.message || 'Guess failed');
    }
  };

  const handleRequestHint = async () => {
    if (!session || loadingHint) return;
    try {
      setLoadingHint(true);
      const res = await ApiClient.requestHint(session.sessionId);
      const currentHints = session.revealedHints || session.unlockedHints || [];
      const updatedHints = [...currentHints, res.hintText];

      setSession({
        ...session,
        hintsUsed: res.hintsUsed,
        revealedHints: updatedHints,
        unlockedHints: updatedHints,
      });
    } catch (err: any) {
      alert(err.message || 'Could not unlock hint');
    } finally {
      setLoadingHint(false);
    }
  };

  const loadRoast = async (sessionId: string, style: 'friendly' | 'savage' | 'hype') => {
    try {
      setLoadingRoast(true);
      const res = await ApiClient.generateRoast(sessionId, style);
      setRoast(res);
    } catch (err) {
      console.error('Roast error:', err);
    } finally {
      setLoadingRoast(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    setUser(null);
    setCurrentView('mission_control');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-[#05050c] text-[#eef2ff] overflow-x-hidden">
      <div className="starfield-bg"></div>
      <div className="nebula-glow"></div>

      <Navbar
        activeTab={currentView === 'standings' ? 'standings' : 'play'}
        onSelectTab={(tab) => {
          if (tab === 'standings') setCurrentView('standings');
          if (tab === 'play') {
            if (session) setCurrentView(session.solved ? 'solved' : 'gameplay');
            else startSession();
          }
        }}
        onGoHome={() => setCurrentView('mission_control')}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {currentView === 'mission_control' && (
        <MissionControlLanding
          onLaunch={() => startSession()}
          onOpenComms={() => startSession()}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {currentView === 'gameplay' && (
        loading ? (
          <div className="min-h-screen flex flex-col items-center justify-center gap-3 relative z-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin"></div>
            <p className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase animate-pulse">
              INITIALIZING RADAR SENSORS...
            </p>
          </div>
        ) : session ? (
          <DailyOrbitDesktop
            session={session}
            onGuess={handleGuess}
            onRequestHint={handleRequestHint}
            onReset={() => {
              if (session.solved) {
                alert('Daily orbit completed! Board cannot be reset.');
              } else {
                startSession();
              }
            }}
            loadingHint={loadingHint}
          />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative z-20">
            <p className="font-mono text-sm text-[#ff5e07]">Orbital Uplink Offline</p>
            <p className="font-mono text-xs text-[#8080a0]">{error}</p>
            <button
              onClick={startSession}
              className="py-2 px-6 rounded-full border border-[#00f0ff] text-[#00f0ff] font-mono text-xs uppercase"
            >
              Retry
            </button>
          </div>
        )
      )}

      {currentView === 'solved' && session && (
        <OrbitSolvedModal
          guessesCount={session.guessesCount}
          scoreBreakdown={session.guesses && session.guesses[session.guesses.length - 1]?.scoreBreakdown}
          hintsUsed={session.hintsUsed}
          roast={roast}
          onGenerateRoast={(style) => loadRoast(session.sessionId, style)}
          loadingRoast={loadingRoast}
          onViewStandings={() => setCurrentView('standings')}
        />
      )}

      {currentView === 'standings' && <SpaceStandingsView />}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          startSession();
        }}
      />
    </div>
  );
}

export default App;