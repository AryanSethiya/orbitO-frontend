import { useState, useEffect, type FC } from 'react';
import { Share2, Trophy, Clock, CheckCircle2, AlertTriangle, X, Terminal } from 'lucide-react';
import { ApiClient } from '../api/client';

interface OrbitSolvedModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWord: string;
  guessesCount: number;
  finalScore: number;
  isForfeited?: boolean;
  aiRoast?: string | null;
  savedRoast?: string | null;
  onRoastLoaded?: (roast: string) => void;
  sessionId?: string;
  userCallsign?: string;
  onOpenStandings: () => void;
  isGuest?: boolean;
  onOpenAuth?: () => void;
  onClaimCallsign?: (user: any) => void;
}

export const OrbitSolvedModal: FC<OrbitSolvedModalProps> = ({
  isOpen,
  onClose,
  targetWord,
  guessesCount,
  finalScore,
  isForfeited = false,
  aiRoast,
  savedRoast,
  onRoastLoaded,
  sessionId,
  userCallsign,
  onOpenStandings,
  isGuest = false,
  onOpenAuth,
  onClaimCallsign,
}) => {
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);
  const [streamedRoast, setStreamedRoast] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Callsign claiming state
  const [claimInput, setClaimInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedCallsign, setClaimedCallsign] = useState<string | null>(null);

  const effectiveCallsign = claimedCallsign || userCallsign;
  const isActuallyGuest = isGuest && !claimedCallsign;

  // Time to next UTC midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diff = Math.max(0, nextMidnight.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stream AI roast text with typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setStreamedRoast('');
      setIsStreaming(false);
      return;
    }

    let fullText = '';
    const displayCallsign = effectiveCallsign && !effectiveCallsign.toLowerCase().startsWith('pilot_00') && !effectiveCallsign.toLowerCase().startsWith('guest_') ? effectiveCallsign : 'Pilot';

    if (isForfeited) {
      // Mission was forfeited: display blackbox abort debrief (ignore any old victory solve roast)
      if (savedRoast && (savedRoast.includes('aborted') || savedRoast.includes('surrendered') || savedRoast.includes('forfeited') || savedRoast.includes('chaos'))) {
        fullText = savedRoast.trim();
      } else {
        fullText = `Telemetry blackbox sealed. Sector orbit aborted after ${guessesCount} probes with 0 credits logged. True center coordinate unsealed as [${targetWord}]. Sector navigation requires resilience, pilot.`;
      }
    } else {
      // Mission was solved: display victory roast
      if (savedRoast && typeof savedRoast === 'string' && savedRoast.trim().length > 0 && !savedRoast.includes('aborted')) {
        fullText = savedRoast.trim();
      } else if (aiRoast && typeof aiRoast === 'string' && aiRoast.trim().length > 0) {
        fullText = aiRoast.trim();
      } else {
        if (guessesCount === 1) {
          fullText = `Phenomenal precision, ${displayCallsign}! You unlocked the center orbit in exactly 1 single probe. Perfect trajectory alignment achieved!`;
        } else if (guessesCount <= 5) {
          fullText = `Exceptional navigation, ${displayCallsign}. You locked onto [${targetWord}] in ${guessesCount} probes with ${finalScore} credits. Outstanding orbital calculation!`;
        } else if (guessesCount <= 12) {
          fullText = `Target [${targetWord}] deciphered in ${guessesCount} probes. Reliable telemetry logging, pilot.`;
        } else {
          fullText = `Target [${targetWord}] acquired after ${guessesCount} orbital attempts. You burned through fuel, but mission accomplished!`;
        }
      }
    }

    fullText = fullText
      .replace(/Pilot_0000[0-9a-zA-Z]*/gi, displayCallsign)
      .replace(/pilot_[a-z0-9]{8,}/gi, displayCallsign)
      .replace(/guest_[a-z0-9]{8,}/gi, displayCallsign);

    if (sessionId && !savedRoast && !aiRoast && onRoastLoaded) {
      ApiClient.generateRoast(sessionId, isForfeited ? 'savage' : 'hype')
        .then((res) => {
          if (res?.roastText) {
            onRoastLoaded(res.roastText);
          }
        })
        .catch(() => {});
    }

    let currentIndex = 0;
    setStreamedRoast('');
    setIsStreaming(true);

    const timer = setInterval(() => {
      if (currentIndex < fullText.length) {
        setStreamedRoast(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsStreaming(false);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [isOpen, aiRoast, savedRoast, sessionId, effectiveCallsign, onRoastLoaded, isForfeited, targetWord, guessesCount, finalScore]);

  if (!isOpen) return null;

  const handleShare = () => {
    const text = isForfeited
      ? `🛰️ OrbitO Sector Debrief (Forfeit)\nTarget: ${targetWord}\nProbes: ${guessesCount}\nFinal Score: 0 CR\nhttps://orbito.site`
      : `🛰️ OrbitO Sector Solved!\nTarget: ${targetWord}\nProbes: ${guessesCount}\nFinal Score: ${finalScore} CR\nhttps://orbito.site`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCallsign = claimInput.trim().toUpperCase();
    if (!cleanCallsign) {
      setClaimError('Enter a valid Callsign (e.g. CMDR_ORBIT).');
      return;
    }

    try {
      setIsClaiming(true);
      setClaimError(null);

      // Register or authenticate callsign with backend
      const res = await ApiClient.devLogin(cleanCallsign);
      localStorage.setItem('orbito_auth_token', res.token);
      localStorage.setItem('orbito_user', JSON.stringify(res.user));
      localStorage.setItem('orbito_player_id', res.user.id);
      setClaimedCallsign(res.user.username || cleanCallsign);

      // Claim session on backend for the authenticated user
      if (sessionId) {
        try {
          await ApiClient.claimSession(sessionId, res.user.id);
        } catch (claimErr: any) {
          console.warn('Backend claim note:', claimErr);
          if (claimErr?.message?.includes('already completed') || claimErr?.message?.includes('locked')) {
            setClaimError(claimErr.message || 'Daily orbit already completed on this account. First-attempt telemetry is permanently locked.');
            return;
          }
        }
      }

      if (onClaimCallsign) {
        onClaimCallsign(res.user);
      }
    } catch (err: any) {
      setClaimError(err.message || 'Callsign registration failed. If bound to Google, please sign in with Google.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Efficiency Tier
  const efficiencyRating = guessesCount === 1 ? 'LEGENDARY' : guessesCount <= 5 ? 'SURGICAL' : guessesCount <= 12 ? 'TACTICAL' : 'RESOLUTE';

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {isForfeited ? (
        /* Sleek, Compact Sci-Fi Brutalist HUD Debrief Console */
        <div className="w-full max-w-lg bg-[#0a0c10] border border-[#B91C1C] shadow-[0_0_60px_rgba(185,28,28,0.35)] relative text-left font-telemetry-md p-6 sm:p-7 my-auto">
          {/* HUD Corner Accents */}
          <div className="telemetry-corner corner-tl font-mono text-[9px] text-[#EF4444] tracking-widest">
            DEBRIEF // BLACKBOX: 0xDEAD
          </div>
          <div className="telemetry-corner corner-tr">
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Header Banner */}
          <div className="pt-2 mb-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B91C1C]/15 border border-[#B91C1C]/60 text-[#EF4444] font-label-caps text-[11px] uppercase tracking-widest mb-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>MISSION FORFEITED // TARGET UNSEALED</span>
            </div>
            <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight">
              SECTOR DEBRIEF CONSOLE
            </h2>
            <p className="font-mono text-[10px] text-white/50 tracking-wider uppercase mt-1">
              MANUAL OVERRIDE DEPLOYED • ORBIT TERMINATED
            </p>
          </div>

          {/* Unsealed Classified Target Coordinate */}
          <div className="relative my-4 p-4 bg-black/80 border border-[#B91C1C]/50 text-center overflow-hidden selection:bg-[#EF4444] selection:text-white">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#EF4444] to-transparent"></div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#EF4444]/90 mb-1">
              CLASSIFIED CENTER COORDINATE
            </div>
            <div className="font-display-hero text-2xl sm:text-3xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] select-all">
              {targetWord}
            </div>
            <div className="text-[9px] font-mono text-white/40 tracking-wider mt-1">
              TRUE SEMANTIC VECTOR CENTER
            </div>
          </div>

          {/* Brutalist Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-4 font-mono">
            <div className="p-2.5 bg-black/60 border border-white/10 text-center">
              <span className="text-[9px] text-white/50 uppercase block font-label-caps mb-0.5">
                PROBES
              </span>
              <span className="text-lg font-bold text-white">
                {guessesCount}
              </span>
            </div>
            <div className="p-2.5 bg-black/60 border border-[#B91C1C]/40 text-center">
              <span className="text-[9px] text-[#EF4444]/80 uppercase block font-label-caps mb-0.5">
                CREDITS
              </span>
              <span className="text-lg font-bold text-[#EF4444]">
                0 CR
              </span>
            </div>
            <div className="p-2.5 bg-black/60 border border-white/10 text-center">
              <span className="text-[9px] text-white/50 uppercase block font-label-caps mb-0.5">
                STATUS
              </span>
              <span className="text-lg font-bold text-white/90">
                ABORTED
              </span>
            </div>
          </div>

          {/* AI Blackbox Debrief Terminal */}
          <div className="bg-[#0e0909] border border-[#B91C1C]/40 p-3.5 mb-4 text-left font-mono">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
              <span className="text-[10px] text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Terminal className="w-3 h-3" />
                AI BLACKBOX LOG // FLIGHT RECORDER
              </span>
              <span className="text-[9px] px-1.5 py-0.5 border border-[#B91C1C]/40 text-[#EF4444]">
                UPLINK: LOGGED
              </span>
            </div>
            <p className="text-xs text-white/90 font-mono leading-relaxed min-h-[44px]">
              &gt; {streamedRoast}
              {isStreaming && <span className="inline-block w-2 h-3.5 ml-1 bg-[#EF4444] animate-pulse" />}
            </p>
          </div>

          {/* Countdown to Next Orbit */}
          <div className="flex items-center justify-center gap-2 p-2 bg-black/60 border border-white/10 font-label-caps text-xs text-white/60 mb-4">
            <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>NEXT ORBIT COORDINATE IN:</span>
            <span className="font-bold text-[#EF4444] font-mono">{countdown}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 font-label-caps text-xs">
            <button
              onClick={handleShare}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="truncate">{copied ? 'COPIED!' : 'SHARE DEBRIEF'}</span>
            </button>

            <button
              onClick={onOpenStandings}
              className="py-3 px-3 bg-[#991B1B] hover:bg-[#B91C1C] text-white font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(185,28,28,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
            >
              <Trophy className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">STANDINGS</span>
            </button>
          </div>
        </div>
      ) : (
        /* State-of-the-Art Orbit Solved (Victory) Console */
        <div className="w-full max-w-4xl border border-primary/60 bg-[#070b08] shadow-[0_0_80px_rgba(72,255,72,0.3)] relative text-left font-telemetry-md transition-all my-auto overflow-hidden">
          {/* Top Status Telemetry Strip */}
          <div className="bg-black/90 border-b border-primary/30 px-4 py-2 flex items-center justify-between font-mono text-[10px] text-primary/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#48ff48]"></span>
              <span className="tracking-widest font-bold">ORBIT.SYS // MISSION_ACCOMPLISHED</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-white/50 text-[9px] tracking-wider">
              <span>ORBITAL SYNC: 100%</span>
              <span>UPLINK: ACTIVE</span>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Left Column: 3D CMDR Doge Holographic Pod */}
            <div className="md:col-span-5 relative border-b md:border-b-0 md:border-r border-primary/20 flex flex-col items-center justify-between p-5 sm:p-6 bg-gradient-to-b from-[#0a140d] via-black to-[#050805]">
              {/* Pod Header */}
              <div className="w-full flex items-center justify-between font-mono text-[9px] text-primary/80 border-b border-white/10 pb-2 mb-3">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                  HOLOGRAPHIC TELEMETRY
                </span>
                <span className="text-white/40">POD #01</span>
              </div>

              {/* Central Framed Hologram Unit */}
              <div className="relative w-full max-w-[270px] aspect-square my-auto border-2 border-primary/60 shadow-[0_0_35px_rgba(72,255,72,0.3)] bg-black overflow-hidden group">
                <img 
                  src="/doge_holding_victory_box.jpg"
                  alt="3D Commander Doge Holding The Victory Cube"
                  className="w-full h-full object-cover filter transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none"></div>

                {/* Cyber Corner Crosshairs on Image */}
                <div className="absolute top-1.5 left-1.5 text-primary text-[8px] font-mono pointer-events-none font-bold">┌</div>
                <div className="absolute top-1.5 right-1.5 text-primary text-[8px] font-mono pointer-events-none font-bold">┐</div>
                <div className="absolute bottom-8 left-1.5 text-primary text-[8px] font-mono pointer-events-none font-bold">└</div>
                <div className="absolute bottom-8 right-1.5 text-primary text-[8px] font-mono pointer-events-none font-bold">┘</div>

                {/* Bottom Hologram Badge */}
                <div className="absolute bottom-2 inset-x-2 text-center pointer-events-none">
                  <span className="font-mono text-[9px] px-3 py-1 border border-primary text-primary bg-black/90 uppercase font-black tracking-widest inline-block shadow-[0_0_12px_rgba(72,255,72,0.6)]">
                    CMDR DOGE // VICTORY CUBE
                  </span>
                </div>
              </div>

              {/* Bottom Holographic Diagnostic Telemetry */}
              <div className="w-full mt-4 pt-3 border-t border-white/10 text-center font-mono space-y-1">
                <div className="flex items-center justify-between text-[9px] text-white/50 uppercase px-1">
                  <span>ORBIT BEARING: 142.8°</span>
                  <span className="text-primary font-bold">LOCK 100%</span>
                </div>
                <div className="text-[10px] text-primary/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ORBITAL ALIGNMENT VERIFIED
                </div>
              </div>
            </div>

            {/* Right Column: Mission Debrief HUD & Callsign Registration */}
            <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
              {/* Target Banner */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/50 text-primary bg-primary/10 font-label-caps text-xs uppercase tracking-widest mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>CENTER ORBIT DECIPHERED // SECTOR CLEARED</span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight font-black">
                    TARGET ACQUIRED
                  </h2>
                  <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold">
                    RANK #1 • CENTER
                  </span>
                </div>

                {/* Target Word Cyber Plaque */}
                <div className="mt-2.5 py-2.5 px-6 font-display-hero text-2xl sm:text-3xl font-black uppercase tracking-widest inline-block bg-black/85 text-primary border-2 border-primary/80 shadow-[0_0_25px_rgba(72,255,72,0.25)] drop-shadow-[0_0_12px_rgba(72,255,72,0.8)]">
                  {targetWord}
                </div>
              </div>

              {/* Telemetry Metrics 3-Card Grid */}
              <div className="grid grid-cols-3 gap-2.5 font-mono">
                <div className="p-3 bg-black/70 border border-primary/30 text-left">
                  <span className="font-label-caps text-[9px] text-white/60 uppercase block mb-0.5">
                    FINAL CREDITS
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-primary block leading-none drop-shadow-[0_0_8px_rgba(72,255,72,0.4)]">
                    {finalScore} CR
                  </span>
                  <span className="text-[8px] text-primary/70 uppercase block mt-1">
                    {finalScore >= 80 ? 'EXEMPLARY' : finalScore > 0 ? 'LOGGED' : 'COMPLETED'}
                  </span>
                </div>

                <div className="p-3 bg-black/70 border border-white/10 text-left">
                  <span className="font-label-caps text-[9px] text-white/60 uppercase block mb-0.5">
                    PROBES LAUNCHED
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-white block leading-none">
                    {guessesCount}
                  </span>
                  <span className="text-[8px] text-white/50 uppercase block mt-1">
                    {efficiencyRating}
                  </span>
                </div>

                <div className="p-3 bg-black/70 border border-white/10 text-left">
                  <span className="font-label-caps text-[9px] text-white/60 uppercase block mb-0.5">
                    VECTOR DIST
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-primary block leading-none">
                    0.00
                  </span>
                  <span className="text-[8px] text-primary/70 uppercase block mt-1">
                    EXACT MATCH
                  </span>
                </div>
              </div>

              {/* AI Debrief Protocol Terminal */}
              <div className="text-left border border-primary/40 bg-black/90 p-3.5 font-mono shadow-inner">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-2 font-bold text-primary">
                    <Terminal className="w-3.5 h-3.5" />
                    AI DEBRIEF PROTOCOL // AUDIO FLIGHT LOG
                  </span>
                  <div className="flex items-center gap-1 text-primary">
                    <span className="w-1 h-2.5 bg-primary animate-pulse"></span>
                    <span className="w-1 h-3.5 bg-primary animate-pulse delay-75"></span>
                    <span className="w-1 h-2 bg-primary animate-pulse delay-150"></span>
                    <span className="font-mono text-[9px] ml-1">UPLINK: ACTIVE</span>
                  </div>
                </div>

                <p className="font-telemetry-sm text-xs text-white/95 font-mono leading-relaxed min-h-[44px]">
                  &gt; {streamedRoast}
                  {isStreaming && <span className="inline-block w-2 h-3.5 ml-1 animate-pulse bg-primary" />}
                </p>
              </div>

              {/* Countdown to Next Orbit */}
              <div className="flex items-center justify-center gap-2 p-2 bg-white/5 border border-white/10 font-label-caps text-xs text-white/70">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>NEXT COORDINATE ORBIT IN:</span>
                <span className="font-bold text-primary font-mono tracking-wider">{countdown}</span>
              </div>

              {/* Callsign Claiming Section */}
              {isActuallyGuest ? (
                /* Interactive In-Modal Callsign Claim Terminal */
                <div className="p-3.5 bg-[#0e1610] border border-primary/50 shadow-[0_0_20px_rgba(72,255,72,0.15)] text-left font-mono">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-caps text-[11px] text-primary font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                      UNCLAIMED FLIGHT DOSSIER // REGISTER CALLSIGN
                    </span>
                    <span className="text-[9px] text-white/40 uppercase">GUEST RECORD</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-tight mb-2.5">
                    Claim your official Callsign to save this victory ({finalScore} CR) and register your rank on the Global Space Standings:
                  </p>

                  <form onSubmit={handleClaimSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={claimInput}
                        onChange={(e) => setClaimInput(e.target.value)}
                        placeholder="e.g. CMDR_VALKYRIE"
                        maxLength={24}
                        className="flex-1 bg-black border border-primary/60 px-3 py-2 text-xs font-mono text-primary font-bold uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_10px_rgba(72,255,72,0.15)] placeholder:text-white/30"
                      />
                      <button
                        type="submit"
                        disabled={isClaiming || !claimInput.trim()}
                        className="py-2 px-4 bg-primary hover:bg-primary/90 text-black font-mono text-xs font-black uppercase tracking-wider transition-all glitch-hover shrink-0 cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(72,255,72,0.4)]"
                      >
                        {isClaiming ? 'SAVING...' : '⚡ CLAIM CALLSIGN'}
                      </button>
                    </div>

                    {claimError && (
                      <div className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{claimError}</span>
                      </div>
                    )}

                    {onOpenAuth && (
                      <div className="text-right pt-0.5">
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="text-[10px] text-primary/80 hover:text-primary underline cursor-pointer transition-colors uppercase tracking-wider"
                        >
                          Or authorize with Google Clearance →
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                /* Callsign Verified Status Badge */
                <div className="p-3 bg-primary/10 border border-primary/40 flex items-center justify-between text-left font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold">
                      ✓
                    </div>
                    <div>
                      <span className="text-[9px] text-primary/80 uppercase block tracking-wider font-bold">
                        PILOT CALLSIGN VERIFIED
                      </span>
                      <span className="text-sm font-black text-white uppercase tracking-wider">
                        {effectiveCallsign || 'VERIFIED PILOT'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-1 bg-primary text-black font-bold uppercase tracking-wider">
                    LOGGED TO STANDINGS
                  </span>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="grid grid-cols-2 gap-3 font-label-caps text-xs pt-1">
                <button
                  onClick={handleShare}
                  className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/20 glitch-hover cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="truncate">{copied ? 'DEBRIEF COPIED!' : 'SHARE DEBRIEF'}</span>
                </button>

                <button
                  onClick={onOpenStandings}
                  className="py-3 px-3 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 glitch-hover cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)]"
                >
                  <Trophy className="w-4 h-4 text-black shrink-0" />
                  <span className="truncate">SPACE STANDINGS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};