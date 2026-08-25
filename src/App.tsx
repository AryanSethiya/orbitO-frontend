import { useState, useEffect } from 'react';
import { ApiClient } from './api/client';
import type { Guess, UserProfile } from './types/game';
import { Navbar } from './components/Navbar';
import { LandingAuthView } from './components/LandingAuthView';
import { DailyOrbitDesktop } from './components/DailyOrbitDesktop';
import { OrbitSolvedModal } from './components/OrbitSolvedModal';
import { SpaceStandingsView } from './components/SpaceStandingsView';
import { AuthModal } from './components/AuthModal';
import { CommunityModal } from './components/CommunityModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  const [currentView, setCurrentView] = useState<'mission' | 'game' | 'leaderboard'>('game');
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

  useEffect(() => {
    // Restore User Profile if previously logged in
    const cachedUser = localStorage.getItem('orbito_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        setUser(u);
        initSession(u.id);
      } catch {
        // Unauthenticated -> Landing View
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
      console.error('Session init error:', err);
    }
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    initSession(newUser.id);
    setCurrentView('game');
  };

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('orbito_auth_token');
    localStorage.removeItem('orbito_user');
    localStorage.removeItem('orbito_player_id');
    setUser(null);
    setActiveRoomCode(null);
    setGuesses([]);
    setSolved(false);
    setUnlockedHints([]);
    setIsProfileOpen(false);
  };

  const handleSubmitGuess = async (word: string) => {
    if (!sessionId) return;
    try {
      setLoadingGuess(true);
      const res: any = await ApiClient.submitGuess(sessionId, word);
      
      const newGuess: Guess = {
        word: res.word || word,
        rank: res.rank || 500,
        similarityScore: res.semanticScore !== undefined ? res.semanticScore : (res.similarityScore || 0.5),
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };

      setGuesses((prev) => [...prev, newGuess]);
      if (res.scoreBreakdown?.finalScore !== undefined) {
        setCurrentScore(res.scoreBreakdown.finalScore);
      } else {
        setCurrentScore((prev) => Math.max(0, prev - 5));
      }

      if (res.isSolved || res.rank === 1) {
        setSolved(true);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err.message);
    } finally {
      setLoadingGuess(false);
    }
  };

  const handleRequestHint = async () => {
    if (!sessionId) return;
    try {
      const res: any = await ApiClient.requestHint(sessionId);
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
      console.warn('Hint request note:', err?.message || err);
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

  // If user is not authenticated, show Landing Sign-In Page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#05050c] text-[#eef2ff] font-sans relative overflow-x-hidden selection:bg-[#00f0ff] selection:text-[#05050c]">
        {/* Dynamic Starfield Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#ff5e07]/5 rounded-full blur-3xl" />
        </div>

        <LandingAuthView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050c] text-[#eef2ff] font-sans relative overflow-x-hidden selection:bg-[#00f0ff] selection:text-[#05050c]">
      {/* Dynamic Starfield Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#ff5e07]/5 rounded-full blur-3xl" />
      </div>

      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onLogout={handleLogout}
        activeRoomCode={activeRoomCode}
      />

      <main className="relative z-10">
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
            user={user}
            loadingGuess={loadingGuess}
          />
        )}

        {currentView === 'leaderboard' && (
          <SpaceStandingsView
            user={user}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            activeRoomCode={activeRoomCode}
          />
        )}
      </main>

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
        />
      )}

      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        user={user}
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
        targetWord={guesses.find((g) => g.rank === 1)?.word || 'GALAXY'}
      />
    </div>
  );
}