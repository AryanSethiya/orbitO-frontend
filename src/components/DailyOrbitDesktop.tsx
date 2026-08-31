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

interface DailyOrbitDesktopProps {
  guesses: Guess[];
  currentScore: number;
  unlockedHints: string[];
  solved: boolean;
  loadingGuess: boolean;
  onSubmitGuess: (word: string) => Promise<void>;
  onRequestHint: () => Promise<void>;
  onShowRoast: () => void;
  onOpenStandings?: () => void;
  onOpenCommunity?: () => void;
  onTerminateSession?: () => void;
  onForfeitSession?: () => void;
  user?: UserProfile | null;
}

export const DailyOrbitDesktop: FC<DailyOrbitDesktopProps> = ({
  guesses,
  currentScore,
  unlockedHints,
  solved,
  loadingGuess,
  onSubmitGuess,
  onRequestHint,
  onShowRoast,
  onOpenStandings,
  onTerminateSession,
  onForfeitSession,
  user,
}) => {
  const [inputVector, setInputVector] = useState('');
  const [activeSideTab, setActiveSideTab] = useState<'dashboard' | 'logs' | 'telemetry' | 'encryption'>('dashboard');
  const [hintLoading, setHintLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setInputVector('');
    setStatusMessage(`TRANSMITTING VECTOR: [${trimmed}]...`);
    try {
      await onSubmitGuess(trimmed);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage(`TRANSMISSION ERROR: ${err?.message || 'FAILED'}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleHintClick = async () => {
    if (hintLoading || unlockedHints.length >= 3 || solved) return;
    try {
      setHintLoading(true);
      await onRequestHint();
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

  // Radar position calculation: map rank to concentric orbital distances
  const getProbeCoordinates = (rank: number, index: number, total: number) => {
    const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 4;
    const maxRadius = 185;
    const minRadius = 35;
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

      {/* Main Container with 3-Column Layout */}
      <div className="flex-1 flex pt-24 pb-8 w-full min-h-[calc(100vh-4rem)]">
        {/* 1. Left Sidebar Navigation */}
        <aside className="w-64 bg-[#131313] border-r border-white/10 flex flex-col p-4 z-30 shrink-0 min-h-[calc(100vh-8rem)]">
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
        <main className="flex-1 px-4 md:px-8 flex flex-col gap-4 max-w-5xl">
          {/* Header Title HUD */}
          <div className="flex justify-between items-center pt-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <h1 className="font-display-hero text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-none">
                  MISSION CONTROL
                </h1>
              </div>
              <p className="font-telemetry-sm text-[11px] text-on-surface-variant/70 mt-1">
                TACTICAL ORBIT SCANNER • PROBE RANGE: 1000 AU
              </p>
            </div>

            {/* Signal Strength & Status Box */}
            <div className="bg-white/[0.03] border border-white/10 px-3.5 py-2 flex items-center gap-3">
              <Wifi className="w-4 h-4 text-primary animate-pulse" />
              <div>
                <div className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase">SIGNAL ACCURACY</div>
                <div className="font-telemetry-md text-xs font-bold text-white">
                  {bestGuess ? `${Math.max(10, Math.round((1000 - Math.min(1000, bestGuess.rank)) / 10))}.4%` : '98.4%'}
                </div>
              </div>
            </div>
          </div>

          {/* Hero Tactical Radar Station (Covers the Screen) */}
          <div className="bg-[#0c0c0c] border border-white/10 relative p-4 md:p-6 min-h-[460px] md:min-h-[520px] flex-1 flex flex-col justify-between items-center overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]">
            {/* HUD Corner Data */}
            <div className="telemetry-corner corner-tl text-[10px] text-primary/80 font-mono flex items-center gap-1.5 z-20">
              <span className="w-1.5 h-1.5 bg-primary animate-ping"></span>
              <span>RADAR_SWEEP: ACTIVE [360°]</span>
            </div>
            <div className="telemetry-corner corner-tr text-[10px] text-on-surface-variant/60 font-mono z-20">
              FREQ: 1420.4 MHz • GRID: AU
            </div>
            <div className="telemetry-corner corner-bl text-[10px] text-on-surface-variant/60 font-mono z-20">
              PROBES IN SECTOR: {guesses.length}
            </div>
            <div className="telemetry-corner corner-br text-[10px] text-primary/70 font-mono z-20">
              {bestGuess ? `CLOSEST: ${bestGuess.word} (#${bestGuess.rank})` : 'TARGET: CLASSIFIED'}
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-3 left-3 border-t-2 border-l-2 border-primary/40 w-4 h-4 pointer-events-none z-20"></div>
            <div className="absolute top-3 right-3 border-t-2 border-r-2 border-primary/40 w-4 h-4 pointer-events-none z-20"></div>
            <div className="absolute bottom-3 left-3 border-b-2 border-l-2 border-primary/40 w-4 h-4 pointer-events-none z-20"></div>
            <div className="absolute bottom-3 right-3 border-b-2 border-r-2 border-primary/40 w-4 h-4 pointer-events-none z-20"></div>

            {/* Central Radar Circle Container */}
            <div className="w-full flex-1 flex items-center justify-center relative my-2 min-h-[360px] md:min-h-[400px]">
              {/* Radar Outer Bounds Container */}
              <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] flex items-center justify-center">
                {/* 360 Scanner Beam & Sweeping Line */}
                <div className="radar-scanner-beam"></div>
                <div className="radar-sweep-line"></div>

                {/* Concentric Radar Distance Rings */}
                {/* Ring 1: Outer (Rank 1000) */}
                <div className="absolute inset-0 border border-primary/25 rounded-full">
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-primary/50 bg-black/60 px-1">
                    RANGE: 1000 AU
                  </span>
                </div>

                {/* Ring 2: Mid Outer (Rank 500) */}
                <div className="absolute w-[75%] h-[75%] border border-primary/20 rounded-full">
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-primary/40 bg-black/60 px-1">
                    RANGE: 500 AU
                  </span>
                </div>

                {/* Ring 3: Mid Inner (Rank 100) */}
                <div className="absolute w-[50%] h-[50%] border border-primary/35 rounded-full shadow-[0_0_15px_rgba(72,255,72,0.08)]">
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-primary/60 bg-black/60 px-1">
                    RANGE: 100 AU
                  </span>
                </div>

                {/* Ring 4: Target Perimeter (Rank 25) */}
                <div className="absolute w-[25%] h-[25%] border border-primary/50 rounded-full animate-pulse shadow-[0_0_15px_rgba(72,255,72,0.15)]">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[8px] text-primary font-bold bg-black/80 px-1">
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
                <div className="target-node z-30 shadow-[0_0_20px_#48ff48]"></div>

                {/* Plotted Probe Vectors on Radar */}
                {guesses.slice(-12).map((g, idx, arr) => {
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

                      <div className={`px-1.5 py-0.5 text-[9px] font-label-caps font-bold border flex items-center gap-1 shadow-md whitespace-nowrap backdrop-blur-md ${
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
              </div>
            </div>

            {/* Seamless Bottom Input Console */}
            <div className="w-full max-w-xl z-20 bg-black/85 border border-white/15 p-3.5 backdrop-blur-md relative mt-3 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <form onSubmit={handleTransmit} className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                <div className="relative flex-1 w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    disabled={loadingGuess || solved}
                    value={inputVector}
                    onChange={(e) => setInputVector(e.target.value)}
                    placeholder="ENTER COORDINATE (E.G. PLANET)"
                    className="w-full bg-black/80 border border-white/25 focus:border-primary text-center sm:text-left px-4 py-2.5 font-display-hero text-base sm:text-lg text-white placeholder:text-white/40 placeholder:text-xs sm:placeholder:text-sm focus:ring-0 input-glow transition-all uppercase tracking-wider disabled:opacity-50"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingGuess || solved || !inputVector.trim()}
                  className="w-full sm:w-auto bg-[#48ff48] hover:bg-white text-black font-label-caps text-xs font-bold py-3 px-6 uppercase tracking-wider glitch-hover transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)] disabled:opacity-50 shrink-0"
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
            </div>
          </div>
        </main>

        {/* 3. Right Sidebar: Transmission Log */}
        <aside className="w-72 bg-[#131313] border-l border-white/10 p-4 flex flex-col shrink-0 min-h-[calc(100vh-7rem)]">
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

      {/* Footer */}
      <footer className="w-full bg-[#000000] border-t border-white/10 py-4 px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-on-surface-variant/60 z-30">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131313] border border-white/20 p-6 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <span className="text-primary font-bold uppercase">SECTOR-7 TELEMETRY</span>
              <button onClick={() => setShowTelemetryModal(false)} className="text-white hover:text-primary">✕</button>
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
              className="mt-6 w-full py-2.5 bg-primary text-black font-bold uppercase glitch-hover"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111111] border border-primary/50 p-6 font-mono text-xs shadow-[0_0_40px_rgba(72,255,72,0.15)] relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <span className="text-primary font-bold uppercase flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  DECRYPTED TELEMETRY ({unlockedHints.length}/3)
                </span>
                <button onClick={() => setShowHintsModal(false)} className="text-white hover:text-primary cursor-pointer">✕</button>
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
                  {solved ? 'MISSION RESOLVED // HINTS ARCHIVED' : 'MAXIMUM HINTS UNLOCKED (3/3)'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Full Transmission Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#131313] border border-white/20 p-6 font-mono text-xs max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <span className="text-white font-bold uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                TRANSMISSION LOG ARCHIVE ({guesses.length})
              </span>
              <button onClick={() => setShowLogsModal(false)} className="text-white hover:text-primary cursor-pointer">✕</button>
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0a0a] border border-[#B91C1C] p-6 sm:p-8 font-telemetry-md text-xs shadow-[0_0_50px_rgba(185,28,28,0.45)] relative">
            <div className="telemetry-corner corner-tl text-[#B91C1C] font-mono text-[10px]">EMERGENCY_OVERRIDE: 0xEE</div>
            <div className="telemetry-corner corner-tr">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 mb-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B91C1C]/20 border border-[#B91C1C] text-[#B91C1C] font-label-caps text-xs uppercase tracking-widest mb-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>EMERGENCY PROTOCOL</span>
              </div>
              <h3 className="text-white font-display-hero text-2xl font-bold uppercase">
                {solved ? 'DISCONNECT MISSION' : 'ABORT & REVEAL TARGET?'}
              </h3>
            </div>

            <p className="text-on-surface-variant text-center leading-relaxed mb-6">
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