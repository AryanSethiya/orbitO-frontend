import { useState, useRef, useEffect, type FC } from 'react';
import type { Guess, UserProfile } from '../types/game';
import { 
  LayoutDashboard, 
  Database, 
  LineChart, 
  Lock, 
  Power, 
  Wifi, 
  Target, 
  Terminal,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  User,
  Flame,
  AlertOctagon
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

interface DailyOrbitDesktopProps {
  guesses: Guess[];
  currentScore: number;
  unlockedHints: string[];
  solved: boolean;
  isForfeited?: boolean;
  loadingGuess: boolean;
  onSubmitGuess: (word: string) => Promise<void>;
  onRequestHint: () => Promise<void>;
  onShowRoast: () => void;
  onOpenStandings?: () => void;
  onOpenCommunity?: () => void;
  onTerminateSession?: () => void;
  onForfeitSession?: () => void;
  user?: UserProfile | null;
  targetWord?: string;
}

export const DailyOrbitDesktop: FC<DailyOrbitDesktopProps> = ({
  guesses,
  currentScore,
  unlockedHints,
  solved,
  isForfeited = false,
  loadingGuess,
  onSubmitGuess,
  onRequestHint,
  onShowRoast,
  onOpenStandings,
  onTerminateSession,
  onForfeitSession,
  user,
  targetWord,
}) => {
  const [inputVector, setInputVector] = useState('');
  const [pendingVector, setPendingVector] = useState<string | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'dashboard' | 'logs' | 'telemetry' | 'encryption'>('dashboard');
  const [hintLoading, setHintLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevGuessesLengthRef = useRef(guesses.length);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Hotkey: Press '/' anywhere on screen to immediately focus coordinate input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      if (e.key === '/' && !isInputActive && !solved) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isInputActive) {
        (activeElement as HTMLElement)?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [solved]);

  // Audio feedback: Play acoustic proximity lock chime whenever a new vector lands
  useEffect(() => {
    if (guesses.length > prevGuessesLengthRef.current) {
      const latest = guesses[guesses.length - 1];
      if (latest) {
        const tier = latest.rank === 1 ? 'CENTER' : latest.rank <= 100 ? 'HOT' : latest.rank <= 500 ? 'WARM' : 'COLD';
        audioSynth.playProximityLock(tier);
      }
    }
    prevGuessesLengthRef.current = guesses.length;
  }, [guesses]);

  // Auto-scroll transmission log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [guesses]);

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVector.trim().toUpperCase();
    if (!trimmed || loadingGuess || solved) return;
    setPendingVector(trimmed);
    setInputVector('');
    setStatusMessage(`TRANSMITTING VECTOR: [${trimmed}]...`);
    audioSynth.playTransmitBeep();
    try {
      await onSubmitGuess(trimmed);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage(`TRANSMISSION ERROR: ${err?.message || 'FAILED'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setPendingVector(null);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleHintClick = async () => {
    if (hintLoading || unlockedHints.length >= 3 || solved) return;
    try {
      setHintLoading(true);
      await onRequestHint();
      audioSynth.playHintChime();
      setShowHintsModal(true);
    } finally {
      setHintLoading(false);
    }
  };

  // Best guess rank
  const bestGuess = guesses.reduce<Guess | null>((best, curr) => {
    if (!best) return curr;
    return curr.rank < best.rank ? curr : best;
  }, null);

  // Dynamic radar radius calculation for flawless probe scaling on all devices
  const dynamicRadarRadius = windowWidth < 380 ? 105 : windowWidth < 640 ? 125 : windowWidth < 768 ? 150 : 180;

  // Radar position calculation: map rank to concentric orbital distances
  const getProbeCoordinates = (rank: number, index: number, total: number) => {
    const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 4;
    const maxRadius = dynamicRadarRadius;
    const minRadius = Math.max(22, Math.round(dynamicRadarRadius * 0.18));
    const clampedRank = Math.min(1000, Math.max(1, rank));
    const normalizedDist = Math.log10(clampedRank) / 3;
    const radius = minRadius + normalizedDist * (maxRadius - minRadius);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, radius };
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#e2e2e2] font-telemetry-md relative flex flex-col overflow-x-hidden select-none">
      <div className="scanline"></div>

      {/* Main Container with Adaptive Layout */}
      <div className="flex-1 flex pt-20 sm:pt-24 pb-28 sm:pb-24 md:pb-10 w-full min-h-[calc(100vh-4rem)]">
        {/* 1. Left Sidebar Navigation (Desktop >= xl) */}
        <aside className="hidden xl:flex w-64 bg-[#131313] border-r border-white/10 flex-col p-4 z-30 shrink-0 min-h-[calc(100vh-8rem)]">
          {/* Sector User Card */}
          <div className="mb-6 border-b border-white/10 pb-4">
            <div className="w-12 h-12 bg-white/5 border border-white/20 mb-3 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white/80" />
              )}
            </div>
            <div className="font-label-caps text-xs text-white font-bold tracking-wider uppercase truncate">
              {user?.username || user?.name || 'SECTOR-7'}
            </div>
            <div className="font-telemetry-sm text-[11px] text-on-surface-variant/70 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>STATUS: {solved ? 'ORBIT_SOLVED' : 'STABLE'}</span>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="flex-1 flex flex-col gap-1.5">
            <button
              onClick={() => setActiveSideTab('dashboard')}
              className={`font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase transition-all cursor-pointer ${
                activeSideTab === 'dashboard'
                  ? 'bg-white/10 text-white font-bold border-r-2 border-white'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-white" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('logs');
                setShowLogsModal(true);
              }}
              className={`font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase transition-all cursor-pointer ${
                activeSideTab === 'logs'
                  ? 'bg-white/10 text-white font-bold border-r-2 border-white'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4 text-white" />
              <span>LOGS</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('telemetry');
                setShowTelemetryModal(true);
              }}
              className={`font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase transition-all cursor-pointer ${
                activeSideTab === 'telemetry'
                  ? 'bg-white/10 text-white font-bold border-r-2 border-white'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <LineChart className="w-4 h-4 text-white" />
              <span>TELEMETRY</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('encryption');
                setShowHintsModal(true);
              }}
              className={`font-label-caps text-xs flex items-center justify-between p-3 text-left tracking-wider uppercase transition-all cursor-pointer ${
                activeSideTab === 'encryption'
                  ? 'bg-white/10 text-white font-bold border-r-2 border-white'
                  : 'text-on-surface-variant hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-white" />
                <span>ENCRYPTION</span>
              </div>
              {unlockedHints.length > 0 && (
                <span className="text-[10px] text-primary font-bold">
                  {unlockedHints.length}/3
                </span>
              )}
            </button>

            {solved && (
              <button
                onClick={onShowRoast}
                className="font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase text-primary border border-primary/40 bg-primary/10 transition-all cursor-pointer animate-pulse"
              >
                <Flame className="w-4 h-4 text-primary" />
                <span>AI DEBRIEF</span>
              </button>
            )}

            {!solved && (
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase text-[#B91C1C] hover:text-white hover:bg-[#B91C1C]/20 border border-[#B91C1C]/40 transition-all cursor-pointer mt-auto"
              >
                <AlertOctagon className="w-4 h-4 text-[#B91C1C]" />
                <span>ABORT / REVEAL</span>
              </button>
            )}

            {solved && (
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="font-label-caps text-xs flex items-center gap-3 p-3 text-left tracking-wider uppercase text-on-surface-variant hover:text-white hover:bg-white/10 transition-all cursor-pointer mt-auto"
              >
                <Power className="w-4 h-4" />
                <span>DISCONNECT</span>
              </button>
            )}
          </nav>
        </aside>

        {/* 2. Center Workspace (Full-Canvas Tactical Radar & Input Bar) */}
        <main className="flex-1 px-3 sm:px-6 md:px-8 flex flex-col gap-3 sm:gap-4 max-w-5xl w-full mx-auto">
          {/* Mobile Tactical Quick-Station Bar (< xl screens) */}
          <div className="xl:hidden grid grid-cols-5 gap-1 w-full text-xs font-label-caps uppercase border-b border-white/10 pb-1.5 pt-1">
            <button
              onClick={() => setActiveSideTab('dashboard')}
              className={`py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 border transition-all cursor-pointer min-w-0 ${
                activeSideTab === 'dashboard'
                  ? 'bg-primary text-black font-bold border-primary shadow-[0_0_10px_rgba(72,255,72,0.3)]'
                  : 'bg-white/5 text-on-surface-variant border-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[9px] xs:text-[11px]">RADAR</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('logs');
                setShowLogsModal(true);
              }}
              className="py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 bg-white/5 border border-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer min-w-0"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[9px] xs:text-[11px]">LOGS{guesses.length > 0 ? ` (${guesses.length})` : ''}</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('encryption');
                setShowHintsModal(true);
              }}
              className="py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 bg-white/5 border border-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer min-w-0"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[9px] xs:text-[11px]">HINTS{unlockedHints.length > 0 ? ` (${unlockedHints.length})` : ''}</span>
            </button>

            <button
              onClick={() => {
                setActiveSideTab('telemetry');
                setShowTelemetryModal(true);
              }}
              className="py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 bg-white/5 border border-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer min-w-0"
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[9px] xs:text-[11px]">STATS</span>
            </button>

            {solved ? (
              <button
                onClick={onShowRoast}
                className="py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 bg-primary/15 border border-primary/50 text-primary uppercase font-bold cursor-pointer animate-pulse min-w-0"
              >
                <Flame className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate text-[9px] xs:text-[11px]">DEBRIEF</span>
              </button>
            ) : (
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="py-1.5 px-1 flex flex-col xs:flex-row items-center justify-center gap-1 bg-[#B91C1C]/15 border border-[#B91C1C]/60 text-[#EF4444] hover:bg-[#B91C1C]/25 uppercase font-bold cursor-pointer min-w-0"
              >
                <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-[#EF4444]" />
                <span className="truncate text-[9px] xs:text-[11px]">ABORT</span>
              </button>
            )}
          </div>

          {/* Header Title HUD */}
          <div className="flex flex-wrap justify-between items-center gap-2 pt-1 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <h1 className="font-display-hero text-xl xs:text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-none">
                  MISSION CONTROL
                </h1>
              </div>
              <p className="font-telemetry-sm text-[10px] sm:text-[11px] text-on-surface-variant/70 mt-1">
                TACTICAL ORBIT SCANNER • PROBE RANGE: 1000 AU
              </p>
            </div>

            {/* Signal Strength & Score HUD */}
            <div className="flex items-center gap-2">
              <div className="bg-white/[0.03] border border-white/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3">
                <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse" />
                <div>
                  <div className="font-label-caps text-[8px] sm:text-[9px] text-on-surface-variant/60 uppercase">SIGNAL</div>
                  <div className="font-telemetry-md text-xs font-bold text-white">
                    {bestGuess ? `${Math.max(10, Math.round((1000 - Math.min(1000, bestGuess.rank)) / 10))}.4%` : '98.4%'}
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-2">
                <div>
                  <div className="font-label-caps text-[8px] sm:text-[9px] text-on-surface-variant/60 uppercase">CREDITS</div>
                  <div className="font-telemetry-md text-xs font-bold text-primary">
                    {currentScore} CR
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Tactical Radar Station (Covers the Screen) */}
          <div className="bg-[#0c0c0c] border border-white/10 relative p-3 sm:p-5 min-h-[380px] xs:min-h-[420px] sm:min-h-[500px] flex-1 flex flex-col justify-between items-center overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]">
            {/* Top Telemetry Strip (Responsive flexbox - never overlaps) */}
            <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono px-2 pt-0.5 pb-2 border-b border-white/5 z-20">
              <div className="flex items-center gap-1.5 text-primary/80 font-bold truncate">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping shrink-0"></span>
                <span className="truncate">RADAR_SWEEP: ACTIVE</span>
              </div>
              <div className="text-on-surface-variant/60 shrink-0 text-right font-mono text-[9px] sm:text-[10px]">
                <span className="hidden xs:inline">FREQ: </span>1420.4 MHz • GRID: AU
              </div>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 border-t-2 border-l-2 border-primary/40 w-3 sm:w-4 h-3 sm:h-4 pointer-events-none z-10"></div>
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 border-t-2 border-r-2 border-primary/40 w-3 sm:w-4 h-3 sm:h-4 pointer-events-none z-10"></div>
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 border-b-2 border-l-2 border-primary/40 w-3 sm:w-4 h-3 sm:h-4 pointer-events-none z-10"></div>
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 border-b-2 border-r-2 border-primary/40 w-3 sm:w-4 h-3 sm:h-4 pointer-events-none z-10"></div>

            {/* Central Radar Circle Container */}
            <div className="w-full flex-1 flex items-center justify-center relative my-2 min-h-[290px] xs:min-h-[330px] sm:min-h-[390px]">
              {/* Radar Outer Bounds Container (Responsive scale across mobile, tablet, desktop) */}
              <div className="relative w-[280px] h-[280px] xs:w-[320px] xs:h-[320px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] max-w-[85vw] max-h-[85vw] flex items-center justify-center">
                {/* 360 Scanner Beam & Sweeping Line */}
                <div className="radar-scanner-beam"></div>
                <div className="radar-sweep-line"></div>

                {/* Concentric Radar Distance Rings */}
                {/* Ring 1: Outer (Rank 1000) */}
                <div className="absolute inset-0 border border-primary/25 rounded-full">
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-[7px] sm:text-[8px] text-primary/50 bg-black/60 px-1">
                    RANGE: 1000 AU
                  </span>
                </div>

                {/* Ring 2: Mid Outer (Rank 500) */}
                <div className="absolute w-[75%] h-[75%] border border-primary/20 rounded-full">
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-mono text-[7px] sm:text-[8px] text-primary/40 bg-black/60 px-1">
                    RANGE: 500 AU
                  </span>
                </div>

                {/* Ring 3: Mid Inner (Rank 100) */}
                <div className="absolute w-[50%] h-[50%] border border-primary/35 rounded-full shadow-[0_0_15px_rgba(72,255,72,0.08)]">
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-mono text-[7px] sm:text-[8px] text-primary/60 bg-black/60 px-1">
                    RANGE: 100 AU
                  </span>
                </div>

                {/* Ring 4: Target Perimeter (Rank 25) */}
                <div className="absolute w-[25%] h-[25%] border border-primary/50 rounded-full animate-pulse shadow-[0_0_15px_rgba(72,255,72,0.15)]">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[7px] sm:text-[8px] text-primary font-bold bg-black/80 px-1">
                    ORBIT
                  </span>
                </div>

                {/* Crosshairs with Degree Markings */}
                <div className="w-full h-[1px] bg-primary/20 absolute"></div>
                <div className="w-[1px] h-full bg-primary/20 absolute"></div>
                <div className="w-full h-[1px] bg-primary/10 absolute rotate-45"></div>
                <div className="w-[1px] h-full bg-primary/10 absolute rotate-45"></div>

                {/* Cardinal Markings */}
                <span className="absolute top-1 right-2 font-mono text-[8px] text-primary/40">000°</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[8px] text-primary/40">090°</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-primary/40">180°</span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[8px] text-primary/40">270°</span>

                {/* Central Bullseye Target Node */}
                <div className="relative z-30 flex items-center justify-center">
                  <div className={`target-node ${isForfeited ? 'border-[#EF4444] shadow-[0_0_25px_#EF4444]' : 'shadow-[0_0_25px_#48ff48]'}`}></div>
                  {solved && (
                    <div className={`absolute -top-7 px-2.5 py-0.5 bg-black/90 font-mono font-black text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap animate-bounce flex items-center gap-1.5 ${
                      isForfeited
                        ? 'text-[#EF4444] border border-[#EF4444]/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                        : 'text-primary border border-primary/80 shadow-[0_0_15px_rgba(72,255,72,0.4)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isForfeited ? 'bg-[#EF4444]' : 'bg-primary animate-ping'}`}></span>
                      <span>{targetWord || (isForfeited ? 'ORBIT ABORTED' : 'TARGET ACQUIRED')}</span>
                    </div>
                  )}
                </div>

                {/* Plotted Probe Vectors on Radar */}
                {guesses.slice(-12).filter(g => !solved || (g.rank !== 1 && g.word.toUpperCase() !== (targetWord || '').toUpperCase())).map((g, idx, arr) => {
                  const { x, y } = getProbeCoordinates(g.rank, idx, arr.length);
                  const isHit = g.rank === 1;
                  const isHot = g.rank <= 100;
                  const isWarm = g.rank <= 500;

                  return (
                    <div
                      key={idx}
                      className="absolute transition-all duration-700 flex flex-col items-center group cursor-pointer z-20 hover:z-30 hover:scale-110"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      title={`${g.word} - Rank #${g.rank}`}
                    >
                      {/* Pulse Blip on Radar */}
                      <span className={`w-2 h-2 rounded-full absolute -top-1 animate-ping opacity-75 ${
                        isHit ? 'bg-primary' : isHot ? 'bg-emerald-400' : isWarm ? 'bg-yellow-400' : 'bg-white/50'
                      }`} />

                      <div className={`px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-label-caps font-bold border flex items-center gap-1 shadow-md whitespace-nowrap backdrop-blur-md ${
                        isHit
                          ? 'bg-[#48ff48] text-black border-[#48ff48] shadow-[0_0_12px_#48ff48]'
                          : isHot
                          ? 'bg-black/90 text-primary border-primary shadow-[0_0_8px_rgba(72,255,72,0.4)]'
                          : isWarm
                          ? 'bg-black/90 text-yellow-300 border-yellow-500/60'
                          : 'bg-black/90 text-on-surface-variant border-white/20'
                      }`}>
                        <span>{g.word}</span>
                        <span className="font-mono opacity-80">#{g.rank}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Optimistic Radar Probing: Instant Pulsing Trajectory Node */}
                {loadingGuess && (
                  (() => {
                    const pendingAngle = ((guesses.length * 137.5 + 45) % 360) * (Math.PI / 180);
                    const pendingRadius = Math.round(dynamicRadarRadius * 0.8);
                    const pendingX = Math.round(Math.cos(pendingAngle) * pendingRadius);
                    const pendingY = Math.round(Math.sin(pendingAngle) * pendingRadius);
                    const rotationDeg = Math.round((pendingAngle * 180) / Math.PI) + 180;

                    return (
                      <div
                        className="absolute z-30 flex flex-col items-center pointer-events-none transition-all duration-300"
                        style={{ transform: `translate(${pendingX}px, ${pendingY}px)` }}
                      >
                        {/* Dynamic Inward Trajectory Laser Trace pointing towards bullseye */}
                        <div
                          className="absolute w-[80px] h-[1px] bg-gradient-to-r from-primary via-primary/50 to-transparent pointer-events-none origin-left"
                          style={{
                            transform: `rotate(${rotationDeg}deg)`,
                            top: '50%',
                            left: '50%',
                          }}
                        />

                        {/* Pulsing Probe Beacon */}
                        <div className="relative flex items-center justify-center">
                          <span className="w-3.5 h-3.5 rounded-full bg-primary animate-ping absolute opacity-90"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-black relative z-10 shadow-[0_0_12px_#48ff48]"></span>
                        </div>

                        {/* Realtime Vector Telemetry Tag */}
                        <div className="mt-1.5 px-2 py-0.5 bg-black/95 border border-primary text-primary font-mono text-[9px] font-black tracking-widest uppercase shadow-[0_0_12px_rgba(72,255,72,0.6)] animate-pulse whitespace-nowrap flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary animate-ping"></span>
                          <span>ANALYZING: {pendingVector || 'PROBE'}...</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Bottom Form Control / Solved Message HUD */}
            {solved ? (
              <div className="w-full max-w-xl z-20 bg-black/90 border border-primary/40 p-3 sm:p-4 text-center mt-3 shadow-[0_0_30px_rgba(72,255,72,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left">
                  <div className="font-label-caps text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>{isForfeited ? 'MISSION BLACKBOX ARCHIVED' : 'ORBIT CALCULATED SUCCESSFULLY'}</span>
                  </div>
                  <div className="font-display-hero text-lg sm:text-xl text-white uppercase font-bold mt-0.5">
                    {targetWord ? `CENTER: [${targetWord}]` : 'TARGET UNLOCKED'}
                  </div>
                </div>

                <button
                  onClick={onShowRoast}
                  className={`w-full sm:w-auto font-label-caps text-xs font-bold py-2.5 sm:py-3 px-5 uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isForfeited
                      ? 'bg-[#991B1B] hover:bg-[#B91C1C] text-white shadow-[0_0_20px_rgba(185,28,28,0.5)]'
                      : 'bg-primary hover:bg-white text-black shadow-[0_0_20px_rgba(72,255,72,0.5)]'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${isForfeited ? 'text-white' : 'text-black'}`} />
                  <span>{isForfeited ? 'VIEW DEBRIEF CONSOLE' : 'VIEW MISSION DEBRIEF'}</span>
                </button>
              </div>
            ) : (
              <div className="w-full max-w-xl z-20 bg-black/85 border border-white/15 p-2.5 sm:p-3.5 backdrop-blur-md relative mt-3 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <form onSubmit={handleTransmit} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full">
                  <div className="relative flex-1 w-full">
                    <input
                      ref={inputRef}
                      type="text"
                      disabled={loadingGuess}
                      value={inputVector}
                      onChange={(e) => setInputVector(e.target.value)}
                      placeholder="ENTER COORDINATE (E.G. PLANET)"
                      className="w-full bg-black/80 border border-white/25 focus:border-primary text-center sm:text-left px-3.5 sm:px-4 py-2.5 font-display-hero text-base sm:text-lg text-white placeholder:text-white/40 placeholder:text-xs sm:placeholder:text-sm focus:ring-0 input-glow transition-all uppercase tracking-wider disabled:opacity-50 pr-4 sm:pr-24"
                      autoFocus
                    />
                    <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 font-mono text-[9px] text-white/40 border border-white/20 px-1.5 py-0.5 pointer-events-none bg-black/70">
                      <span>KEY</span>
                      <span className="text-primary font-bold">/</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingGuess || !inputVector.trim()}
                    className="w-full sm:w-auto bg-[#48ff48] hover:bg-white text-black font-label-caps text-xs font-bold py-2.5 sm:py-3 px-5 sm:px-6 uppercase tracking-wider glitch-hover transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)] disabled:opacity-50 shrink-0 min-h-[44px]"
                  >
                    <Target className="w-4 h-4 font-bold" />
                    <span>{loadingGuess ? 'TRANSMITTING...' : 'TRANSMIT VECTOR'}</span>
                  </button>
                </form>

                {statusMessage && (
                  <div className="mt-2 text-center text-xs font-mono text-primary animate-pulse">
                    {statusMessage}
                  </div>
                )}

                {/* Bottom Status Bar (Never overlaps with corner brackets) */}
                <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono pt-2 mt-2 text-on-surface-variant/70 border-t border-white/10">
                  <span className="font-bold text-white/80">PROBES: {guesses.length}</span>
                  <span className="text-primary font-bold truncate ml-2">
                    {bestGuess ? `CLOSEST: ${bestGuess.word} (#${bestGuess.rank})` : 'TARGET: CLASSIFIED'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 3. Right Sidebar: Transmission Log (Desktop >= xl) */}
        <aside className="hidden xl:flex w-72 bg-[#131313] border-l border-white/10 p-4 flex-col shrink-0 min-h-[calc(100vh-7rem)]">
          <div className="pb-3 border-b border-white/10 mb-3 flex justify-between items-center">
            <h2 className="font-label-caps text-xs text-on-surface-variant font-bold uppercase tracking-wider">
              TRANSMISSION LOG
            </h2>
            <span className="font-mono text-[10px] text-primary">
              ({guesses.length})
            </span>
          </div>

          <div ref={logContainerRef} className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 max-h-[500px]">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-2 font-telemetry-sm text-[10px] text-on-surface-variant/50 border-b border-white/5 pb-2">
              <div>SEQ</div>
              <div className="col-span-2">VECTOR</div>
              <div className="text-right">RES</div>
            </div>

            {/* Rows */}
            {guesses.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant/40 text-xs font-mono">
                NO VECTORS TRANSMITTED YET.<br/>ENTER FIRST COORDINATE.
              </div>
            ) : (
              guesses.map((g, idx) => {
                const seq = (idx + 1).toString().padStart(3, '0');
                const isHit = g.rank === 1;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-4 gap-2 font-mono text-xs items-center py-1.5 border-b border-white/5 ${
                      isHit ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant'
                    }`}
                  >
                    <div>{seq}</div>
                    <div className="col-span-2 truncate uppercase font-bold text-white">
                      {g.word}
                    </div>
                    <div className="text-right">
                      {isHit ? (
                        <span className="text-primary font-bold">HIT</span>
                      ) : (
                        <span className="text-on-surface-variant/80">#{g.rank}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Live Typing Status */}
            <div className="mt-4 font-mono text-xs text-on-surface-variant/50 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Awaiting next input_</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer with mobile bottom dock clearance */}
      <footer className="w-full bg-[#000000] border-t border-white/10 py-4 px-6 pb-20 md:pb-4 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-on-surface-variant/60 z-30">
        <div className="text-white/80">
          © 2144 ORBITO SYSTEM COMMAND. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 mt-2 md:mt-0 uppercase">
          <span>MISSION_STATUS: <span className="text-primary font-bold">ONLINE</span></span>
          <span>COORDINATES: <span className="text-white">0.0.0.1</span></span>
          <span>CREDITS: <span className="text-primary font-bold">{currentScore} CR</span></span>
        </div>
      </footer>

      {/* Telemetry Modal */}
      {showTelemetryModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
          <div className="w-full max-w-md bg-[#131313] border border-white/20 p-5 sm:p-6 font-mono text-xs my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <span className="text-primary font-bold uppercase">SECTOR-7 TELEMETRY</span>
              <button onClick={() => setShowTelemetryModal(false)} className="text-white hover:text-primary cursor-pointer p-1">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Active Target Orbit:</span>
                <span className="text-white font-bold">{solved ? 'DECODED' : 'LOCKED'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Probes Launched:</span>
                <span className="text-white font-bold">{guesses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Best Rank Acquired:</span>
                <span className="text-primary font-bold">#{bestGuess?.rank || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Current Mission Score:</span>
                <span className="text-primary font-bold">{currentScore} CR</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTelemetryModal(false);
                if (onOpenStandings) onOpenStandings();
              }}
              className="mt-6 w-full py-2.5 bg-primary text-black font-bold uppercase glitch-hover cursor-pointer"
            >
              VIEW GLOBAL STANDINGS &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Encryption / Hints Modal */}
      {showHintsModal && (() => {
        const nextHintNum = unlockedHints.length + 1;
        const hintCost = nextHintNum === 1 ? 100 : nextHintNum === 2 ? 200 : 350;

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
            <div className="w-full max-w-md bg-[#111111] border border-primary/50 p-5 sm:p-6 font-mono text-xs shadow-[0_0_40px_rgba(72,255,72,0.15)] relative my-auto max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <span className="text-primary font-bold uppercase flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  DECRYPTED TELEMETRY ({unlockedHints.length}/3)
                </span>
                <button onClick={() => setShowHintsModal(false)} className="text-white hover:text-primary cursor-pointer p-1">✕</button>
              </div>

              {/* Point Deduction Warning Notice */}
              {!solved && unlockedHints.length < 3 && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 font-mono text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <div className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <span>CREDIT PENALTY NOTICE</span>
                      <span className="text-[10px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40">-{hintCost} CR</span>
                    </div>
                    <div className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                      Decrypting Hint #{nextHintNum} will deduct <strong className="text-white font-bold">-{hintCost} CR</strong> from your mission credits.
                    </div>
                  </div>
                </div>
              )}

              {unlockedHints.length === 0 ? (
                <div className="text-center py-5 text-on-surface-variant/60">
                  NO TELEMETRY HINTS DECRYPTED YET.
                </div>
              ) : (
                <div className="space-y-2.5 mb-4">
                  {unlockedHints.map((hint, idx) => {
                    const deducted = idx === 0 ? 100 : idx === 1 ? 200 : 350;
                    return (
                      <div key={idx} className="p-3 bg-black/70 border border-primary/30 text-white flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-[10px] text-primary/80 mb-1 font-bold">
                            <span>HINT #{idx + 1} DECRYPTED</span>
                            <span className="text-amber-400">[-{deducted} CR]</span>
                          </div>
                          <span className="text-xs text-white leading-relaxed">{hint}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {unlockedHints.length < 3 && !solved ? (
                <button
                  onClick={handleHintClick}
                  disabled={hintLoading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-black font-bold uppercase glitch-hover flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(72,255,72,0.3)] transition-all"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>
                    {hintLoading ? 'DECRYPTING...' : `DECRYPT HINT #${nextHintNum} (-${hintCost} CR)`}
                  </span>
                </button>
              ) : (
                <div className="p-2.5 bg-white/5 border border-white/10 text-center font-label-caps text-[11px] text-on-surface-variant">
                  {solved ? 'MISSION RESOLVED' : 'MAXIMUM HINTS UNLOCKED (3/3)'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Full Transmission Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
          <div className="w-full max-w-lg bg-[#131313] border border-white/20 p-5 sm:p-6 font-mono text-xs max-h-[85vh] flex flex-col my-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <span className="text-white font-bold uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                TRANSMISSION LOG ARCHIVE ({guesses.length})
              </span>
              <button onClick={() => setShowLogsModal(false)} className="text-white hover:text-primary cursor-pointer p-1">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
              {guesses.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant/60">
                  NO TRANSMISSIONS LOGGED YET.
                </div>
              ) : (
                guesses.map((g, idx) => {
                  const seq = (idx + 1).toString().padStart(3, '0');
                  const isHit = g.rank === 1;
                  const isHot = g.rank <= 100;
                  const isWarm = g.rank <= 500;

                  return (
                    <div
                      key={idx}
                      className={`p-3 border flex justify-between items-center ${
                        isHit
                          ? 'bg-[#48ff48]/10 border-[#48ff48] text-[#48ff48]'
                          : isHot
                          ? 'bg-black border-primary/50 text-white'
                          : isWarm
                          ? 'bg-black border-white/20 text-white'
                          : 'bg-black border-white/10 text-on-surface-variant'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="opacity-50">#{seq}</span>
                        <span className="font-bold text-sm uppercase">{g.word}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isHit ? (
                          <span className="px-2 py-0.5 bg-[#48ff48] text-black font-bold text-[10px]">HIT (TARGET)</span>
                        ) : (
                          <span className={`px-2 py-0.5 border text-[10px] ${
                            isHot ? 'border-primary text-primary' : 'border-white/20 text-white/70'
                          }`}>
                            RANK #{g.rank}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowLogsModal(false)}
              className="mt-5 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase transition-colors cursor-pointer"
            >
              CLOSE ARCHIVE
            </button>
          </div>
        </div>
      )}

      {/* Emergency Abort & Terminate Confirm Modal */}
      {showTerminateConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto min-h-screen py-6 sm:py-8">
          <div className="w-full max-w-md bg-[#0d0a0a] border border-[#B91C1C] p-5 sm:p-8 font-telemetry-md text-xs shadow-[0_0_50px_rgba(185,28,28,0.45)] relative my-auto max-h-[85vh] overflow-y-auto">
            <div className="telemetry-corner corner-tl text-[#B91C1C] font-mono text-[10px]">EMERGENCY_OVERRIDE: 0xEE</div>
            <div className="telemetry-corner corner-tr">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="text-on-surface-variant hover:text-white transition-colors cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 mb-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B91C1C]/20 border border-[#B91C1C] text-[#B91C1C] font-label-caps text-xs uppercase tracking-widest mb-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>EMERGENCY PROTOCOL</span>
              </div>
              <h3 className="text-white font-display-hero text-xl sm:text-2xl font-bold uppercase">
                {solved ? 'DISCONNECT MISSION' : 'ABORT & REVEAL TARGET?'}
              </h3>
            </div>

            <p className="text-on-surface-variant text-center leading-relaxed mb-6 text-xs sm:text-sm">
              {solved
                ? 'Disconnect from Mission Control and return to the main landing terminal.'
                : 'Activating manual override will unseal today\'s classified center target coordinate, finalize your flight dossier, and forfeit all mission credits (0 CR).'}
            </p>

            <div className="space-y-3 font-label-caps">
              {!solved && onForfeitSession && (
                <button
                  onClick={() => {
                    setShowTerminateConfirm(false);
                    onForfeitSession();
                  }}
                  className="w-full py-3.5 px-4 bg-[#991B1B] hover:bg-[#B91C1C] text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(185,28,28,0.6)] glitch-hover"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>FORFEIT & REVEAL TARGET</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowTerminateConfirm(false);
                  if (onTerminateSession) onTerminateSession();
                }}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <Power className="w-4 h-4" />
                <span>DISCONNECT / RETURN TO LANDING</span>
              </button>

              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="w-full py-2.5 px-4 bg-transparent text-on-surface-variant hover:text-white font-bold uppercase tracking-wider text-center cursor-pointer"
              >
                RESUME MISSION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};