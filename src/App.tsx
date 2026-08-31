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

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'briefing' | 'game' | 'leaderboard'>('landing');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(1000);
  const [solved, setSolved] = useState<boolean>(false);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [loadingGuess, setLoadingGuess] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [isSolvedOpen, setIsSolvedOpen] = useState<boolean>(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [savedRoast, setSavedRoast] = useState<string | null>(null);

  useEffect(() => {
    // Restore cached user profile if exists
    const cachedUser = localStorage.getItem('orbito_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setUser(u);
        initSession(u.id);
      } catch {
        // If unauthenticated, stay on landing page
      }
    }
  }, []);

  const initSession = async (userId?: string) => {
    try {
      const res = await ApiClient.startSession(userId);
      setSessionId(res.sessionId);
      if (res.solved) {
        setSolved(true);
      }
      if (res.score !== undefined) {
        setCurrentScore(res.score);
      }
      if (res.roastText) {
        setSavedRoast(res.roastText);
      }
      if (res.guesses) {
        setGuesses(res.guesses.map((g: any) => ({
          id: g.id,
          word: g.word?.word || g.word,
          rank: g.rank || 500,
          similarityScore: g.semanticScore !== undefined ? g.semanticScore : (g.similarityScore !== undefined ? g.similarityScore : (g.rank === 1 ? 1.0 : 0.5)),
          scoreDelta: g.scoreDelta || -5,
          createdAt: g.createdAt,
        })));
      }
      if (res.revealedHints) {
        setUnlockedHints(res.revealedHints);
      }
    } catch (err) {
      console.warn('Session init notice:', err);
    }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    setSavedRoast(null);
    initSession(newUser.id);
    setCurrentView('game');
  };

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const [isForfeited, setIsForfeited] = useState(false);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);

  const handleForfeitMission = () => {
    setIsForfeited(true);
    setSavedRoast(null);
    setCurrentScore(0);
    setSolved(true);
    const rank1Guess = guesses.find((g) => g.rank === 1)?.word;
    const solution = rank1Guess || revealedWord || 'OCEAN';
    setRevealedWord(solution);
    setIsSolvedOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    localStorage.removeItem('orbito_player_id');
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
    try {
      setLoadingGuess(true);
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const newSession = await ApiClient.startSession(user?.id);
        targetSessionId = newSession.sessionId;
        setSessionId(targetSessionId);
      }

      const res: any = await ApiClient.submitGuess(targetSessionId, word);
      
      const actualWord = res.word || res.guess?.word || word;
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

      setGuesses((prev) => [...prev, newGuess]);
      if (res.scoreBreakdown?.finalScore !== undefined) {
        setCurrentScore(res.scoreBreakdown.finalScore);
      } else {
        setCurrentScore((prev) => Math.max(0, prev - 5));
      }

      if (res.isSolved || actualRank === 1) {
        setSolved(true);
        setIsForfeited(false);
        setRevealedWord(actualWord);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err?.message || err);
      // Even if offline/network hiccup, allow local interactive simulation
      const fallbackRank = word.toUpperCase() === 'ORBIT' ? 1 : Math.floor(Math.random() * 800) + 10;
      const fallbackGuess: Guess = {
        word: word.toUpperCase(),
        rank: fallbackRank,
        similarityScore: fallbackRank === 1 ? 1.0 : (1000 - fallbackRank) / 1000,
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };
      setGuesses((prev) => [...prev, fallbackGuess]);
      setCurrentScore((prev) => Math.max(0, prev - 5));
      if (fallbackRank === 1) {
        setSolved(true);
        setIsForfeited(false);
        setRevealedWord(word.toUpperCase());
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
      }

      const res: any = await ApiClient.requestHint(targetSessionId);
      if (res.revealedHints && Array.isArray(res.revealedHints)) {
        setUnlockedHints(res.revealedHints);
      } else if (res.hintText) {
        setUnlockedHints((prev) => (prev.includes(res.hintText) ? prev : [...prev, res.hintText]));
      } else if (res.session?.revealedHints) {
        setUnlockedHints(res.session.revealedHints);
      }

      if (res.session?.score !== undefined) {
        setCurrentScore(res.session.score);
      } else if (res.penaltyCost) {
        setCurrentScore((prev) => Math.max(0, prev - res.penaltyCost));
      }
    } catch (err: any) {
      console.warn('Hint error:', err?.message || err);
      // Fallback local hint generation if backend error
      const fallbackHints = [
        "Primary category classification: Natural celestial body / Cosmic phenomenon",
        "Semantic vector points within upper atmospheric quadrant",
        "Target is gravitationally bounded within planetary orbit"
      ];
      setUnlockedHints((prev) => {
        const nextHint = fallbackHints[prev.length] || "Orbit vector proximity aligned";
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
    if (user) {
      setCurrentView('game');
    } else {
      setIsAuthOpen(true);
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
        onOpenSettings={() => setCurrentView('briefing')}
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
          />
        )}

        {currentView === 'leaderboard' && (
          <SpaceStandingsView
            user={user}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            activeRoomCode={activeRoomCode}
            currentGuessesCount={guesses.length}
            currentScore={currentScore}
            solved={solved}
            isForfeited={isForfeited}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

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
        targetWord={guesses.find((g) => g.rank === 1)?.word || revealedWord || 'CENTER TARGET'}
        userCallsign={user?.username || user?.name || 'Pilot'}
        savedRoast={savedRoast}
        onRoastLoaded={(roast) => setSavedRoast(roast)}
        isForfeited={isForfeited}
      />
    </div>
  );
}