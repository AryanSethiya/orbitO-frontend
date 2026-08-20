import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MissionControlLanding } from './components/MissionControlLanding';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { ApiClient } from './api/client';
import type { SessionSummary, AIRoast } from './types/game';

export function App() {
  const [currentView, setCurrentView] = useState<'mission_control' | 'gameplay' | 'solved' | 'standings'>('mission_control');
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [roast, setRoast] = useState<AIRoast | null>(null);
  const [loadingRoast, setLoadingRoast] = useState(false);

  const getPlayerId = () => {
    let id = localStorage.getItem('orbito_player_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('orbito_player_id', id);
    }
    return id;
  };

  const startSession = async () => {
    try {
      setLoading(true);
      const id = getPlayerId();
      const sess = await ApiClient.startSession(id);
      setSession(sess);

      if (sess.status === 'solved') {
        setCurrentView('solved');
        loadRoast(sess.sessionId, 'savage');
      } else {
        setCurrentView('gameplay');
      }
    } catch (err) {
      console.error('Session start error:', err);
      setCurrentView('gameplay');
    } finally {
      setLoading(false);
    }
  };

  const handleResetBoard = () => {
    localStorage.setItem('orbito_player_id', 'user_' + Math.random().toString(36).substring(2, 11));
    startSession();
  };

  const handleGuess = async (guess: string) => {
    if (!session) return;
    try {
      const result = await ApiClient.submitGuess(session.sessionId, guess);
      const updatedGuesses = [...(session.guesses || []), result];
      const isSolved = result.isSolved;

      setSession({
        ...session,
        guesses: updatedGuesses,
        guessesCount: updatedGuesses.length,
        status: isSolved ? 'solved' : session.status,
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
    if (!session) return;
    try {
      const res = await ApiClient.requestHint(session.sessionId);
      setSession({
        ...session,
        hintsUsed: res.hintsUsed,
        unlockedHints: [...(session.unlockedHints || []), res.hintText],
      });
    } catch (err: any) {
      alert(err.message || 'Hint error');
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

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-[#05050c] text-[#eef2ff] overflow-x-hidden">
      {/* Background Starfield & Subtle Nebulas */}
      <div className="starfield-bg"></div>
      <div className="nebula-glow"></div>

      {/* Top Navbar */}
      <Navbar
        activeTab={currentView === 'standings' ? 'standings' : 'play'}
        onSelectTab={(tab) => {
          if (tab === 'standings') setCurrentView('standings');
          if (tab === 'play') {
            if (session) setCurrentView(session.status === 'solved' ? 'solved' : 'gameplay');
            else startSession();
          }
        }}
        onGoHome={() => setCurrentView('mission_control')}
      />

      {/* View Switcher matching Stitch Canvas */}
      {currentView === 'mission_control' && (
        <MissionControlLanding
          onLaunch={() => startSession()}
          onOpenComms={() => startSession()}
        />
      )}

      {currentView === 'gameplay' && session && (
        <DailyOrbitDesktop
          session={session}
          onGuess={handleGuess}
          onRequestHint={handleRequestHint}
          onReset={handleResetBoard}
          loading={loading}
        />
      )}

      {currentView === 'solved' && session && (
        <OrbitSolvedModal
          guessesCount={session.guessesCount}
          scoreBreakdown={session.guesses && session.guesses[session.guesses.length - 1]?.scoreBreakdown}
          roast={roast}
          onGenerateRoast={(style) => loadRoast(session.sessionId, style)}
          loadingRoast={loadingRoast}
          onReset={handleResetBoard}
          onViewStandings={() => setCurrentView('standings')}
        />
      )}

      {currentView === 'standings' && <SpaceStandingsView />}
    </div>
  );
}

export default App;