import { useState, useEffect } from 'react';
import { ApiClient } from './api/client';
import type { Guess, UserProfile } from './types/game';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { MissionBriefingView } from './components/MissionBriefingView';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { AuthModal } from './components/AuthModal';
import { CommunityModal } from './components/CommunityModal';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { getDailyTargetWord, upgradeGenericHints, getSemanticHintsForTarget } from './utils/dailyOrbit';

const getActivePuzzleDateKey = (date?: string | null) => {
  return date || new Date().toISOString().split('T')[0];
};

const loadDailyState = (date?: string | null) => {
  try {
    const key = `orbito_daily_state_${getActivePuzzleDateKey(date)}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveDailyState = (date: string | null, state: Record<string, any>) => {
  try {
    const key = `orbito_daily_state_${getActivePuzzleDateKey(date)}`;
    const existing = loadDailyState(date) || {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...state }));
  } catch {}
};

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'briefing' | 'game' | 'leaderboard'>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);

  const initialDaily = loadDailyState(null);
  const [guesses, setGuesses] = useState<Guess[]>(initialDaily?.guesses || []);
  const [currentScore, setCurrentScore] = useState<number>(initialDaily?.currentScore ?? 1000);
  const [solved, setSolved] = useState<boolean>(initialDaily?.solved ?? false);
  const [unlockedHints, setUnlockedHints] = useState<string[]>(initialDaily?.unlockedHints || []);
  const [loadingGuess, setLoadingGuess] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [isSolvedOpen, setIsSolvedOpen] = useState<boolean>(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [savedRoast, setSavedRoast] = useState<string | null>(initialDaily?.savedRoast || null);
  const [isForfeited, setIsForfeited] = useState<boolean>(initialDaily?.isForfeited ?? false);
  const [revealedWord, setRevealedWord] = useState<string | null>(initialDaily?.revealedWord || null);

  useEffect(() => {
    // Restore cached user profile if exists
    const cachedUser = localStorage.getItem('orbito_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setUser(u);
        initSession(u.id);
      } catch {
        initSession();
      }
    } else {
      initSession();
    }
  }, []);

  const initSession = async (userId?: string) => {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        let guestId = localStorage.getItem('orbito_guest_id');
        if (!guestId) {
          guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('orbito_guest_id', guestId);
        }
        targetUserId = guestId;
      }

      const res = await ApiClient.startSession(targetUserId);
      setSessionId(res.sessionId);
      const activeDate = (res as any).puzzleDate || (res as any).date || null;
      if (activeDate) {
        setPuzzleDate(activeDate);
      }

      const cached = loadDailyState(activeDate);

      if (cached?.isForfeited) {
        setIsForfeited(true);
        setSolved(true);
      } else if (res.solved) {
        setSolved(true);
      } else if (cached?.solved) {
        setSolved(true);
      }

      if (res.score !== undefined && (!cached || res.score < cached.currentScore || res.solved)) {
        setCurrentScore(res.score);
      } else if (cached?.currentScore !== undefined) {
        setCurrentScore(cached.currentScore);
      }

      if (res.roastText) {
        setSavedRoast(res.roastText);
      } else if (cached?.savedRoast) {
        setSavedRoast(cached.savedRoast);
      }

      if (res.guesses && res.guesses.length > 0) {
        const mapped = res.guesses.map((g: any) => ({
          id: g.id,
          word: g.word?.word || g.word,
          rank: g.rank || 500,
          similarityScore: g.semanticScore !== undefined ? g.semanticScore : (g.similarityScore !== undefined ? g.similarityScore : (g.rank === 1 ? 1.0 : 0.5)),
          scoreDelta: g.scoreDelta || -5,
          createdAt: g.createdAt,
        }));
        setGuesses(mapped);
        saveDailyState(activeDate, { guesses: mapped });
      } else if (cached?.guesses && cached.guesses.length > 0) {
        // Retain user's local vectors if backend returns empty (e.g. freshly claimed callsign)
        setGuesses(cached.guesses);
      }

      if (res.revealedHints && res.revealedHints.length > 0) {
        setUnlockedHints(upgradeGenericHints(res.revealedHints, activeDate));
      } else if (cached?.unlockedHints) {
        setUnlockedHints(cached.unlockedHints);
      }
    } catch (err) {
      console.warn('Session init notice:', err);
    }
  };

  // Auto-recovery: If session is ended/solved, ensure all vectors and the target word are displayed on radar & log
  useEffect(() => {
    if (solved && guesses.length === 0) {
      const activeDate = puzzleDate || new Date().toISOString().split('T')[0];
      const target = revealedWord || getDailyTargetWord(activeDate);
      const recoveredGuesses: Guess[] = [];

      // If a blackbox debrief exists mentioning previous probes (e.g. "planet"), recover it
      if (savedRoast) {
        const match = savedRoast.match(/to ["']([a-zA-Z]+)["'] \(Rank #(\d+)\)/i);
        if (match) {
          recoveredGuesses.push({
            id: 'recovered-probe-1',
            word: match[1].toLowerCase(),
            rank: parseInt(match[2], 10),
            similarityScore: 0.15,
            scoreDelta: -5,
            createdAt: new Date(Date.now() - 60000).toISOString(),
          });
        }
      }

      // Add the final target decipher hit
      recoveredGuesses.push({
        id: 'target-vector-001',
        word: target.toLowerCase(),
        rank: 1,
        similarityScore: 1.0,
        scoreDelta: 0,
        createdAt: new Date().toISOString(),
      });

      setGuesses(recoveredGuesses);
      saveDailyState(activeDate, {
        guesses: recoveredGuesses,
        solved: true,
        revealedWord: target,
        currentScore,
      });
    }
  }, [solved, guesses.length, revealedWord, puzzleDate, savedRoast, currentScore]);

  const handleLoginSuccess = async (newUser: UserProfile) => {
    setUser(newUser);

    // Automatically claim current active session for the authenticated pilot
    if (sessionId) {
      try {
        await ApiClient.claimSession(sessionId, newUser.id);
      } catch (err) {
        console.warn('Session claim notice:', err);
      }
    }

    // Persist daily state with the claimed user
    saveDailyState(puzzleDate, {
      user: newUser,
      guesses,
      solved,
      currentScore,
      savedRoast,
      revealedWord,
    });

    // If user was on leaderboard, do NOT redirect to game! Keep them on leaderboard!
    if (currentView !== 'leaderboard' && !solved && !isSolvedOpen) {
      setSavedRoast(null);
      initSession(newUser.id);
      setCurrentView('game');
    }
  };

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleForfeitMission = () => {
    setIsForfeited(true);
    setSavedRoast(null);
    setCurrentScore(0);
    setSolved(true);
    const rank1Guess = guesses.find((g) => g.rank === 1)?.word;
    const solution = rank1Guess || revealedWord || getDailyTargetWord(puzzleDate);
    setRevealedWord(solution);
    setIsSolvedOpen(true);
    saveDailyState(puzzleDate, {
      isForfeited: true,
      solved: true,
      currentScore: 0,
      revealedWord: solution,
      guesses,
      savedRoast: null,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    localStorage.removeItem('orbito_player_id');
    const activeDate = puzzleDate || new Date().toISOString().split('T')[0];
    localStorage.removeItem(`orbito_daily_state_${activeDate}`);
    setUser(null);
    setActiveRoomCode(null);
    setGuesses([]);
    setSolved(false);
    setIsForfeited(false);
    setRevealedWord(null);
    setSavedRoast(null);
    setUnlockedHints([]);
    setIsProfileOpen(false);
    setCurrentView('landing');
  };

  const handleSubmitGuess = async (word: string) => {
    const cleanWord = word.trim().toUpperCase();
    if (!cleanWord || solved || isForfeited) return;

    // Avoid duplicate probe emissions
    if (guesses.some((g) => g.word.trim().toUpperCase() === cleanWord)) {
      return;
    }

    try {
      setLoadingGuess(true);
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const newSession = await ApiClient.startSession(user?.id);
        targetSessionId = newSession.sessionId;
        setSessionId(targetSessionId);
      }

      const res: any = await ApiClient.submitGuess(targetSessionId, cleanWord);
      
      const actualWord = res.word || res.guess?.word || cleanWord;
      const actualRank = typeof res.rank === 'number' ? res.rank : (res.guess?.rank || 500);
      const actualSimilarity = res.semanticScore !== undefined 
        ? res.semanticScore 
        : (res.similarityScore || res.guess?.similarityScore || (actualRank === 1 ? 1.0 : 0.5));

      const newGuess: Guess = {
        word: actualWord,
        rank: actualRank,
        similarityScore: actualSimilarity,
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };

      const newScore = res.scoreBreakdown?.finalScore !== undefined 
        ? res.scoreBreakdown.finalScore 
        : Math.max(0, currentScore - 5);
      const isWinner = res.isSolved || actualRank === 1;

      setGuesses((prev) => {
        const next = [...prev, newGuess];
        saveDailyState(puzzleDate, {
          guesses: next,
          currentScore: newScore,
          solved: isWinner,
          revealedWord: isWinner ? actualWord : revealedWord,
        });
        return next;
      });
      setCurrentScore(newScore);

      if (isWinner) {
        setSolved(true);
        setIsForfeited(false);
        setRevealedWord(actualWord);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err?.message || err);
      const msg = (err?.message || '').toLowerCase();
      const dailyTarget = (revealedWord || getDailyTargetWord(puzzleDate)).toUpperCase();

      // If session is already completed or solved on backend, sync client state
      if (msg.includes('already completed') || msg.includes('already solved') || msg.includes('session completed')) {
        setSolved(true);
        setRevealedWord(dailyTarget);
        setIsSolvedOpen(true);
        return;
      }

      // Offline / network fallback simulation: compare against today's target word
      const isFallbackWinner = cleanWord === dailyTarget;
      const fallbackRank = isFallbackWinner ? 1 : Math.floor(Math.random() * 800) + 10;
      const fallbackGuess: Guess = {
        word: cleanWord,
        rank: fallbackRank,
        similarityScore: isFallbackWinner ? 1.0 : (1000 - fallbackRank) / 1000,
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };
      const fallbackScore = Math.max(0, currentScore - 5);

      setGuesses((prev) => {
        const next = [...prev, fallbackGuess];
        saveDailyState(puzzleDate, {
          guesses: next,
          currentScore: fallbackScore,
          solved: isFallbackWinner,
          revealedWord: isFallbackWinner ? cleanWord : revealedWord,
        });
        return next;
      });
      setCurrentScore(fallbackScore);

      if (isFallbackWinner) {
        setSolved(true);
        setIsForfeited(false);
        setRevealedWord(cleanWord);
        setIsSolvedOpen(true);
      }
    } finally {
      setLoadingGuess(false);
    }
  };

  const handleRequestHint = async () => {
    try {
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const newSession = await ApiClient.startSession(user?.id);
        targetSessionId = newSession.sessionId;
        setSessionId(targetSessionId);
        const activeDate = (newSession as any).puzzleDate || (newSession as any).date || null;
        if (activeDate) setPuzzleDate(activeDate);
      }

      const res: any = await ApiClient.requestHint(targetSessionId);
      let rawHints: string[] = [];
      if (res.revealedHints && Array.isArray(res.revealedHints)) {
        rawHints = res.revealedHints;
      } else if (res.hintText) {
        rawHints = unlockedHints.includes(res.hintText) ? unlockedHints : [...unlockedHints, res.hintText];
      } else if (res.session?.revealedHints) {
        rawHints = res.session.revealedHints;
      }

      const upgraded = upgradeGenericHints(rawHints, puzzleDate, revealedWord);
      setUnlockedHints(upgraded);

      if (res.session?.score !== undefined) {
        setCurrentScore(res.session.score);
      } else if (res.penaltyCost) {
        setCurrentScore((prev) => Math.max(0, prev - res.penaltyCost));
      }
    } catch (err: any) {
      console.warn('Hint error:', err?.message || err);
      // Dynamic semantic hint clues guiding player toward target concept
      const semanticClues = getSemanticHintsForTarget(puzzleDate, revealedWord);
      setUnlockedHints((prev) => {
        const nextHint = semanticClues[prev.length] || semanticClues[semanticClues.length - 1];
        return [...prev, nextHint];
      });
      setCurrentScore((prev) => Math.max(0, prev - 100));
    }
  };

  const handleRoomJoined = (room: { id: string; code: string; name: string }) => {
    setActiveRoomCode(room.code);
    if (user) {
      const updatedUser = { ...user, community: room.name };
      setUser(updatedUser);
      localStorage.setItem('orbito_user', JSON.stringify(updatedUser));
    }
  };

  const handleRoomLeft = (newCommunityName: string = 'Global Explorers') => {
    setActiveRoomCode(null);
    if (user) {
      const updatedUser = { ...user, community: newCommunityName };
      setUser(updatedUser);
      localStorage.setItem('orbito_user', JSON.stringify(updatedUser));
    }
  };

  const handleNavigateCore = () => {
    setCurrentView('game');
    if (!sessionId) {
      initSession(user?.id);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] font-telemetry-md relative overflow-x-hidden selection:bg-[#48ff48] selection:text-black">
      {/* Universal Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'game') {
            handleNavigateCore();
          } else {
            setCurrentView(view);
          }
        }}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        activeRoomCode={activeRoomCode}
      />

      {/* Main View Router */}
      <main className="relative z-10">
        {currentView === 'landing' && (
          <LandingView
            onStartMission={handleNavigateCore}
            onOpenBriefing={() => setCurrentView('briefing')}
          />
        )}

        {currentView === 'briefing' && (
          <MissionBriefingView
            onInitiateSequence={handleNavigateCore}
          />
        )}

        {currentView === 'game' && (
          <DailyOrbitDesktop
            guesses={guesses}
            currentScore={currentScore}
            solved={solved}
            isForfeited={isForfeited}
            unlockedHints={unlockedHints}
            onSubmitGuess={handleSubmitGuess}
            onRequestHint={handleRequestHint}
            onShowRoast={() => setIsSolvedOpen(true)}
            onOpenStandings={() => setCurrentView('leaderboard')}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            onTerminateSession={handleLogout}
            onForfeitSession={handleForfeitMission}
            user={user}
            loadingGuess={loadingGuess}
            targetWord={guesses.find((g) => g.rank === 1)?.word || revealedWord || getDailyTargetWord(puzzleDate)}
          />
        )}

        {currentView === 'leaderboard' && (
          <SpaceStandingsView
            user={user}
            sessionId={sessionId}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            activeRoomCode={activeRoomCode}
            currentGuessesCount={guesses.length}
            currentScore={currentScore}
            solved={solved}
            isForfeited={isForfeited}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      {user && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onProfileUpdated={handleProfileUpdated}
          onLogout={handleLogout}
          onOpenCommunity={() => setIsCommunityOpen(true)}
          onRoomLeft={handleRoomLeft}
        />
      )}

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        user={user}
        activeRoomCode={activeRoomCode}
        onRoomJoined={handleRoomJoined}
        onRoomLeft={handleRoomLeft}
        onRequireAuth={() => {
          setIsCommunityOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <OrbitSolvedModal
        isOpen={isSolvedOpen}
        onClose={() => setIsSolvedOpen(false)}
        onOpenStandings={() => {
          setIsSolvedOpen(false);
          setCurrentView('leaderboard');
        }}
        sessionId={sessionId || ''}
        finalScore={currentScore}
        guessesCount={guesses.length}
        guesses={guesses}
        puzzleDate={puzzleDate}
        targetWord={guesses.find((g) => g.rank === 1)?.word || revealedWord || getDailyTargetWord(puzzleDate)}
        userCallsign={user?.username || user?.name || 'Pilot'}
        savedRoast={savedRoast}
        onRoastLoaded={(roast) => setSavedRoast(roast)}
        isForfeited={isForfeited}
        isGuest={!user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onClaimCallsign={(newUser) => {
          setUser(newUser);
          saveDailyState(puzzleDate, {
            user: newUser,
            guesses,
            solved,
            currentScore,
            savedRoast,
            revealedWord,
          });
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        activeRoomCode={activeRoomCode}
        onRoomJoined={handleRoomJoined}
        onRoomLeft={handleRoomLeft}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onOpenBriefing={() => {
          setIsSettingsOpen(false);
          setCurrentView('briefing');
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}