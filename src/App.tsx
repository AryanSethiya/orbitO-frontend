import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OrbitRadar } from './components/OrbitRadar';
import { GuessInput } from './components/GuessInput';
import { RecentGuesses } from './components/RecentGuesses';
import { HintDrawer } from './components/HintDrawer';
import { SolveModal } from './components/SolveModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { HelpModal } from './components/HelpModal';
import { LandingView } from './components/LandingView';
import { AuthModal } from './components/AuthModal';
import { ApiClient } from './api/client';
import type { SessionSummary, GuessResult, AIRoast } from './types/game';
import { RefreshCw, RotateCcw } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'landing' | 'gameplay'>(() => {
    return localStorage.getItem('orbito_session_started') ? 'gameplay' : 'landing';
  });
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [roast, setRoast] = useState<AIRoast | null>(null);
  const [loadingRoast, setLoadingRoast] = useState(false);

  // Generate or retrieve persistent player ID
  const getPlayerId = () => {
    let id = localStorage.getItem('orbito_player_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('orbito_player_id', id);
    }
    return id;
  };

  const initGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const playerId = getPlayerId();
      const sess = await ApiClient.startSession(playerId);
      setSession(sess);

      if (sess.status === 'solved') {
        setShowSolveModal(true);
        loadRoast(sess.sessionId, 'savage');
      }
    } catch (err: any) {
      console.error('Failed to init game session:', err);
      setError(err?.message || 'Could not connect to Orbito backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'gameplay') {
      initGame();
    }
  }, [view]);

  const handleStartFromLanding = (_username: string) => {
    localStorage.setItem('orbito_session_started', 'true');
    setView('gameplay');
  };

  const handleNewSession = () => {
    // Generate fresh player ID to start with 0 guesses
    localStorage.setItem('orbito_player_id', 'user_' + Math.random().toString(36).substring(2, 11));
    setShowSolveModal(false);
    initGame();
  };

  const handleGuess = async (guess: string) => {
    if (!session) return;
    try {
      const result: GuessResult = await ApiClient.submitGuess(session.sessionId, guess);
      
      setSession((prev) => {
        if (!prev) return prev;
        const updatedGuesses = [...(prev.guesses || []), result];
        const isSolved = result.isSolved || prev.status === 'solved';
        return {
          ...prev,
          guesses: updatedGuesses,
          guessesCount: updatedGuesses.length,
          status: isSolved ? 'solved' : prev.status,
          score: result.scoreBreakdown?.finalScore ?? prev.score,
        };
      });

      if (result.isSolved) {
        setShowSolveModal(true);
        loadRoast(session.sessionId, 'savage');
      }
    } catch (err: any) {
      alert(err.message || 'Guess failed');
    }
  };

  const handleRequestHint = async () => {
    if (!session) return;
    try {
      const hintRes = await ApiClient.requestHint(session.sessionId);
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hintsUsed: hintRes.hintsUsed,
          unlockedHints: [...(prev.unlockedHints || []), hintRes.hintText],
        };
      });
    } catch (err: any) {
      alert(err.message || 'Hint request failed');
    }
  };

  const loadRoast = async (sessionId: string, style: 'friendly' | 'savage' | 'hype' | 'balanced') => {
    try {
      setLoadingRoast(true);
      const res = await ApiClient.generateRoast(sessionId, style);
      setRoast(res);
    } catch (err) {
      console.error('Failed to load roast:', err);
    } finally {
      setLoadingRoast(false);
    }
  };

  // If in landing view, render the Entry / Landing screen
  if (view === 'landing') {
    return (
      <>
        <LandingView
          onStartGame={handleStartFromLanding}
          onOpenAuth={() => setShowAuth(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHelp={() => setShowHelp(true)}
        />
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={(email) => handleStartFromLanding(email.split('@')[0])}
          />
        )}
        {showLeaderboard && (
          <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
        )}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="starfield"></div>
        <div className="orbital-plane orbit-1"></div>
        <div className="w-12 h-12 rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin"></div>
        <p className="font-label-mono text-xs uppercase tracking-widest text-[#00f0ff] animate-pulse">
          Calibrating Semantic Proximity Sensors...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="starfield"></div>
        <h2 className="font-headline-md text-xl text-[#ff5e07]">Orbital Uplink Offline</h2>
        <p className="font-body-md text-sm text-[#b9cacb] max-w-sm">
          {error || 'Unable to load today session.'}
        </p>
        <button
          onClick={initGame}
          className="mt-4 px-6 py-2.5 rounded-full border border-[#00f0ff] text-[#00f0ff] font-label-mono text-xs uppercase flex items-center gap-2 hover:bg-[#00f0ff]/10"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const isSolved = session.status === 'solved';

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden">
      {/* Background Starfield & Concentric Rings */}
      <div className="starfield"></div>
      <div className="orbital-plane orbit-1"></div>
      <div className="orbital-plane orbit-2"></div>
      <div className="orbital-plane orbit-3"></div>

      <Header
        date={session.date}
        difficulty={session.difficulty}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      <main className="flex-grow pt-24 pb-20 px-4 w-full max-w-lg mx-auto flex flex-col items-center relative z-10">
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-lg text-[#e2e0fb]">Daily Orbit</span>
            <span className="px-2.5 py-0.5 rounded-full border border-[#ffb59a]/30 bg-[#ffb59a]/10 text-[#ffb59a] font-label-mono text-[10px] uppercase tracking-widest">
              {session.difficulty}
            </span>
          </div>

          <button
            onClick={handleNewSession}
            className="text-[11px] font-label-mono text-[#849495] hover:text-[#00f0ff] flex items-center gap-1 transition-colors"
            title="Start fresh session with 0 guesses"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Board</span>
          </button>
        </div>

        <OrbitRadar guesses={session.guesses || []} isSolved={isSolved} />

        <GuessInput onSubmit={handleGuess} disabled={isSolved} />

        <HintDrawer
          unlockedHints={session.unlockedHints || []}
          onRequestHint={handleRequestHint}
          loading={false}
          isSolved={isSolved}
        />

        <RecentGuesses guesses={session.guesses || []} />
      </main>

      {isSolved && showSolveModal && (
        <SolveModal
          guessesCount={session.guessesCount}
          scoreBreakdown={session.guesses[session.guesses.length - 1]?.scoreBreakdown}
          roast={roast}
          onGenerateRoast={(style) => loadRoast(session.sessionId, style)}
          loadingRoast={loadingRoast}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          userScore={session.score}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;