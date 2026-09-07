import { useState, useEffect, useRef, type FC } from 'react';
import { Share2, Trophy, Clock, CheckCircle2, AlertTriangle, X, Terminal } from 'lucide-react';
import { ApiClient } from '../api/client';
import { ShareFlightCard } from './ShareFlightCard';
import { generateShareText } from '../utils/shareTelemetry';
import { type Guess } from '../types/game';

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
  guesses?: Guess[];
  puzzleDate?: string | null;
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
  guesses = [],
  puzzleDate = null,
}) => {
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);
  const [streamedRoast, setStreamedRoast] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingRoast, setIsLoadingRoast] = useState(false);
  const requestedSessionIdRef = useRef<string | null>(null);

  // Callsign claiming state
  const [claimInput, setClaimInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedCallsign, setClaimedCallsign] = useState<string | null>(null);

  const effectiveCallsign = claimedCallsign || userCallsign;
  const isActuallyGuest = isGuest && !claimedCallsign;

  // Efficiency Tier
  const efficiencyRating = guessesCount === 1 ? 'LEGENDARY' : guessesCount <= 5 ? 'SURGICAL' : guessesCount <= 12 ? 'TACTICAL' : 'RESOLUTE';

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

  // Stream AI roast text with typewriter effect (clean single-stream lifecycle)
  useEffect(() => {
    if (!isOpen) {
      setStreamedRoast('');
      setIsStreaming(false);
      setIsLoadingRoast(false);
      return;
    }

    const displayCallsign = effectiveCallsign && !effectiveCallsign.toLowerCase().startsWith('pilot_00') && !effectiveCallsign.toLowerCase().startsWith('guest_') ? effectiveCallsign : 'Pilot';

    const getFallbackText = () => {
      if (isForfeited) {
        return `Telemetry blackbox sealed. Sector orbit aborted after ${guessesCount} probes with 0 credits logged. True center coordinate unsealed as [${targetWord}]. Sector navigation requires resilience, pilot.`;
      }
      if (guessesCount === 1) {
        return `Phenomenal precision, ${displayCallsign}! You unlocked the center orbit in exactly 1 single probe. Flawless trajectory alignment achieved!`;
      }
      if (guessesCount <= 5) {
        return `Exceptional navigation, ${displayCallsign}. You locked onto [${targetWord}] in ${guessesCount} probes with ${finalScore} credits. Outstanding orbital calculation!`;
      }
      if (guessesCount <= 12) {
        return `Target [${targetWord}] deciphered in ${guessesCount} probes. Reliable telemetry logging, pilot.`;
      }
      return `Target [${targetWord}] acquired after ${guessesCount} orbital attempts. Fuel heavy, but mission accomplished!`;
    };

    // If roast is already loaded or cached, stream it directly once
    const existingRoast = savedRoast || aiRoast;
    if (existingRoast && typeof existingRoast === 'string' && existingRoast.trim().length > 0) {
      setIsLoadingRoast(false);
      let fullText = existingRoast.trim()
        .replace(/Pilot_0000[0-9a-zA-Z]*/gi, displayCallsign)
        .replace(/pilot_[a-z0-9]{8,}/gi, displayCallsign)
        .replace(/guest_[a-z0-9]{8,}/gi, displayCallsign);

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
    }

    // Otherwise, fetch AI roast from backend (guarded strictly once per session)
    if (sessionId && requestedSessionIdRef.current !== sessionId && onRoastLoaded) {
      requestedSessionIdRef.current = sessionId;
      setIsLoadingRoast(true);
      setStreamedRoast('');

      ApiClient.generateRoast(sessionId, isForfeited ? 'savage' : 'hype')
        .then((res) => {
          if (res?.roastText) {
            onRoastLoaded(res.roastText);
          } else {
            onRoastLoaded(getFallbackText());
          }
        })
        .catch((err) => {
          console.warn('Roast fetch fallback:', err);
          onRoastLoaded(getFallbackText());
        })
        .finally(() => {
          setIsLoadingRoast(false);
        });
      return;
    }

    // Fallback if no session ID available
    if (!sessionId) {
      const fullText = getFallbackText();
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
    }
  }, [isOpen, aiRoast, savedRoast, sessionId, effectiveCallsign, onRoastLoaded, isForfeited, targetWord, guessesCount, finalScore]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = generateShareText({
      puzzleDate,
      guesses,
      guessesCount,
      finalScore,
      isForfeited,
      userCallsign: effectiveCallsign || 'Pilot',
      efficiencyRating,
    });

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
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

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-5 overflow-y-auto min-h-screen py-6 sm:py-8">
      {isForfeited ? (
        /* State-of-the-Art Orbit Forfeited Blackbox Console */
        <div className="w-full max-w-2xl border border-[#EF4444]/60 bg-[#07090b] shadow-[0_0_80px_rgba(239,68,68,0.25)] relative text-left font-telemetry-md transition-all my-auto overflow-hidden">
          {/* Top Status Telemetry Strip */}
          <div className="bg-black/90 border-b border-[#EF4444]/30 px-4 py-2.5 flex items-center justify-between font-mono text-[10px] text-[#EF4444]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse shadow-[0_0_8px_#EF4444]"></span>
              <span className="tracking-widest font-bold">MISSION FORFEITED</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-white/50 text-[9px] tracking-wider font-mono">
              <span>MANUAL OVERRIDE: 0xDEAD</span>
              <span>BLACKBOX: ARCHIVED</span>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Centered Target Acquired / Unsealed Section */}
            <div className="text-center pt-1 pb-1 flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#EF4444]/50 text-[#EF4444] bg-[#EF4444]/10 font-label-caps text-xs uppercase tracking-widest mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>CLASSIFIED COORDINATE UNSEALED</span>
              </div>

              <h2 className="font-display-hero text-2xl sm:text-4xl text-white uppercase tracking-tight font-black">
                MISSION FORFEITED
              </h2>
              <span className="font-mono text-[10px] text-[#EF4444] tracking-widest uppercase font-bold mt-0.5">
                TRUE SEMANTIC VECTOR CENTER
              </span>

              {/* Centered Target Word Cyber Plaque */}
              <div className="my-3 py-2 px-8 sm:px-12 font-display-hero text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-widest inline-block bg-black/90 text-[#EF4444] border-2 border-[#EF4444]/80 shadow-[0_0_35px_rgba(239,68,68,0.3)] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] select-all">
                {targetWord}
              </div>
            </div>

            {/* Telemetry Metrics 3-Card Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 font-mono">
              <div className="p-2.5 sm:p-3 bg-black/70 border border-[#EF4444]/30 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  FINAL CREDITS
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#EF4444] block leading-none drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                  0 CR
                </span>
                <span className="text-[7px] sm:text-[8px] text-[#EF4444]/70 uppercase block mt-1">
                  FORFEITED
                </span>
              </div>

              <div className="p-2.5 sm:p-3 bg-black/70 border border-white/10 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  PROBES LAUNCHED
                </span>
                <span className="text-lg sm:text-2xl font-black text-white block leading-none">
                  {guessesCount}
                </span>
                <span className="text-[8px] text-white/50 uppercase block mt-1">
                  VECTOR TRACE
                </span>
              </div>

              <div className="p-2.5 sm:p-3 bg-black/70 border border-white/10 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  ORBIT STATUS
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#EF4444] block leading-none">
                  MIA
                </span>
                <span className="text-[8px] text-[#EF4444]/70 uppercase block mt-1">
                  SIGNAL LOST
                </span>
              </div>
            </div>

            {/* AI Blackbox Debrief Terminal */}
            <div className="text-left border border-[#EF4444]/40 bg-black/90 p-3.5 font-mono shadow-inner">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                <span className="font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-2 font-bold text-[#EF4444]">
                  <Terminal className="w-3.5 h-3.5" />
                  AI FLIGHT RECORDER
                </span>
                <div className="flex items-center gap-1 text-[#EF4444]">
                  <span className="w-1 h-2.5 bg-[#EF4444] animate-pulse"></span>
                  <span className="w-1 h-3.5 bg-[#EF4444] animate-pulse delay-75"></span>
                  <span className="w-1 h-2 bg-[#EF4444] animate-pulse delay-150"></span>
                  <span className="font-mono text-[9px] ml-1">BLACKBOX: LOGGED</span>
                </div>
              </div>

              <p className="font-telemetry-sm text-xs text-white/95 font-mono leading-relaxed min-h-[40px]">
                {isLoadingRoast ? (
                  <span className="text-[#EF4444]/80 animate-pulse flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
                    EXTRACTING FLIGHT BLACKBOX LOGS...
                  </span>
                ) : (
                  <>
                    &gt; {streamedRoast}
                    {isStreaming && <span className="inline-block w-2 h-3.5 ml-1 animate-pulse bg-[#EF4444]" />}
                  </>
                )}
              </p>
            </div>

            {/* Countdown to Next Orbit */}
            <div className="flex items-center justify-center gap-2 p-2 bg-white/5 border border-white/10 font-label-caps text-xs text-white/70">
              <Clock className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>NEXT COORDINATE ORBIT IN:</span>
              <span className="font-bold text-[#EF4444] font-mono tracking-wider">{countdown}</span>
            </div>

            {/* Share Badge Card with 3 Theme Switcher */}
            <div>
              <ShareFlightCard
                puzzleDate={puzzleDate}
                guesses={guesses}
                guessesCount={guessesCount}
                finalScore={0}
                isForfeited={true}
                userCallsign={effectiveCallsign || 'Pilot'}
                efficiencyRating={efficiencyRating}
              />
            </div>

            {/* Space Standings Action Button */}
            <div className="pt-1">
              <button
                onClick={onOpenStandings}
                className="w-full py-3.5 px-4 bg-[#991B1B] hover:bg-[#B91C1C] text-white font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(185,28,28,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.7)] font-mono text-xs"
              >
                <Trophy className="w-4 h-4 text-white shrink-0" />
                <span>VIEW SPACE STANDINGS</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* State-of-the-Art Orbit Solved (Victory) Console */
        <div className="w-full max-w-2xl border border-primary/60 bg-[#070b08] shadow-[0_0_80px_rgba(72,255,72,0.3)] relative text-left font-telemetry-md transition-all my-auto overflow-hidden">
          {/* Top Status Telemetry Strip */}
          <div className="bg-black/90 border-b border-primary/30 px-4 py-2.5 flex items-center justify-between font-mono text-[10px] text-primary/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#48ff48]"></span>
              <span className="tracking-widest font-bold">MISSION ACCOMPLISHED</span>
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

          <div className="p-4 sm:p-6 space-y-4">
            {/* Centered Target Acquired Section */}
            <div className="text-center pt-1 pb-1 flex flex-col items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/50 text-primary bg-primary/10 font-label-caps text-xs uppercase tracking-widest mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>CENTER ORBIT DECIPHERED</span>
              </div>

              <h2 className="font-display-hero text-2xl sm:text-4xl text-white uppercase tracking-tight font-black">
                TARGET ACQUIRED
              </h2>
              <span className="font-mono text-[10px] text-primary tracking-widest uppercase font-bold mt-0.5">
                RANK #1 • CENTER
              </span>

              {/* Centered Target Word Cyber Plaque */}
              <div className="my-3 py-2 px-8 sm:px-12 font-display-hero text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-widest inline-block bg-black/90 text-primary border-2 border-primary/80 shadow-[0_0_35px_rgba(72,255,72,0.3)] drop-shadow-[0_0_15px_rgba(72,255,72,0.8)] select-all">
                {targetWord}
              </div>
            </div>

            {/* Telemetry Metrics 3-Card Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 font-mono">
              <div className="p-2.5 sm:p-3 bg-black/70 border border-primary/30 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  FINAL CREDITS
                </span>
                <span className="text-lg sm:text-2xl font-black text-primary block leading-none drop-shadow-[0_0_8px_rgba(72,255,72,0.4)]">
                  {finalScore} CR
                </span>
                <span className="text-[7px] sm:text-[8px] text-primary/70 uppercase block mt-1">
                  {finalScore >= 80 ? 'EXEMPLARY' : finalScore > 0 ? 'LOGGED' : 'COMPLETED'}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 bg-black/70 border border-white/10 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  PROBES LAUNCHED
                </span>
                <span className="text-lg sm:text-2xl font-black text-white block leading-none">
                  {guessesCount}
                </span>
                <span className="text-[8px] text-white/50 uppercase block mt-1">
                  {efficiencyRating}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 bg-black/70 border border-white/10 text-center">
                <span className="font-label-caps text-[8px] sm:text-[9px] text-white/60 uppercase block mb-0.5">
                  VECTOR DIST
                </span>
                <span className="text-lg sm:text-2xl font-black text-primary block leading-none">
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
                  MISSION DEBRIEF
                </span>
                <div className="flex items-center gap-1 text-primary">
                  <span className="w-1 h-2.5 bg-primary animate-pulse"></span>
                  <span className="w-1 h-3.5 bg-primary animate-pulse delay-75"></span>
                  <span className="w-1 h-2 bg-primary animate-pulse delay-150"></span>
                  <span className="font-mono text-[9px] ml-1">UPLINK: ACTIVE</span>
                </div>
              </div>

              <p className="font-telemetry-sm text-xs text-white/95 font-mono leading-relaxed min-h-[40px]">
                {isLoadingRoast ? (
                  <span className="text-primary/80 animate-pulse flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    SYNTHESIZING MISSION TELEMETRY BLACKBOX...
                  </span>
                ) : (
                  <>
                    &gt; {streamedRoast}
                    {isStreaming && <span className="inline-block w-2 h-3.5 ml-1 animate-pulse bg-primary" />}
                  </>
                )}
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
                    REGISTER CALLSIGN
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
                      className="flex-1 bg-black border border-primary/60 px-3 py-2 text-base sm:text-xs font-mono text-primary font-bold uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-[0_0_10px_rgba(72,255,72,0.15)] placeholder:text-white/30"
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

            {/* Official Mission Flight Badge with Visual PNG Preview */}
            <div className="pt-1">
              <ShareFlightCard
                puzzleDate={puzzleDate}
                guesses={guesses}
                guessesCount={guessesCount}
                finalScore={finalScore}
                isForfeited={false}
                userCallsign={effectiveCallsign || 'Pilot'}
                efficiencyRating={efficiencyRating}
              />
            </div>

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
      )}
    </div>
  );
};