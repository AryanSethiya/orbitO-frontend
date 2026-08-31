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
}) => {
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);
  const [streamedRoast, setStreamedRoast] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

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
    if (savedRoast && typeof savedRoast === 'string' && savedRoast.trim().length > 0) {
      fullText = savedRoast.trim();
    } else if (aiRoast && typeof aiRoast === 'string' && aiRoast.trim().length > 0) {
      fullText = aiRoast.trim();
    } else {
      if (isForfeited) {
        fullText = `Telemetry blackbox sealed. Target word was [${targetWord}]. You surrendered after ${guessesCount} probes with 0 credits logged. Sector navigation requires resilience, pilot.`;
      } else if (guessesCount === 1) {
        fullText = `Phenomenal precision, ${userCallsign || 'Pilot'}! You unlocked the center orbit in exactly 1 single probe. Perfect trajectory alignment achieved!`;
      } else if (guessesCount <= 5) {
        fullText = `Exceptional navigation, ${userCallsign || 'Pilot'}. You locked onto [${targetWord}] in ${guessesCount} probes with ${finalScore} credits. Outstanding orbital calculation!`;
      } else if (guessesCount <= 12) {
        fullText = `Target [${targetWord}] deciphered in ${guessesCount} probes. Reliable telemetry logging, pilot.`;
      } else {
        fullText = `Target [${targetWord}] acquired after ${guessesCount} orbital attempts. You burned through fuel, but mission accomplished!`;
      }
    }

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
  }, [isOpen, aiRoast, savedRoast, sessionId, userCallsign, onRoastLoaded, isForfeited, targetWord, guessesCount, finalScore]);

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

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`w-full max-w-3xl border relative text-left font-telemetry-md transition-all my-auto ${
        isForfeited
          ? 'bg-[#0d0a0a] border-[#B91C1C] shadow-[0_0_60px_rgba(185,28,28,0.5)]'
          : 'bg-[#0a0f0d] border-primary/60 shadow-[0_0_60px_rgba(72,255,72,0.25)]'
      }`}>
        {/* HUD Corners */}
        <div className={`telemetry-corner corner-tl font-mono text-[10px] ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>
          STATUS: {isForfeited ? 'MISSION_ABORTED_FORFEITED' : 'MISSION_ACCOMPLISHED'}
        </div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 pt-6">
          {/* Left Column: 3D Character Holding The Mission Box */}
          <div className="md:col-span-5 relative border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center p-4 sm:p-6 bg-black/60 overflow-hidden">
            <div className="relative w-full aspect-square max-w-[260px] md:max-w-none group">
              <img 
                src={isForfeited ? "/pepe_holding_forfeit_box.jpg" : "/doge_holding_victory_box.jpg"}
                alt={isForfeited ? "3D Pepe Forfeit" : "3D Doge Victory"}
                className={`w-full h-full object-cover border filter transition-transform duration-500 group-hover:scale-105 ${
                  isForfeited 
                    ? 'border-[#B91C1C]/60 shadow-[0_0_20px_rgba(185,28,28,0.5)]' 
                    : 'border-primary/60 shadow-[0_0_20px_rgba(72,255,72,0.4)]'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              
              <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
                <span className={`font-mono text-[9px] px-2 py-0.5 border uppercase font-bold tracking-wider inline-block ${
                  isForfeited 
                    ? 'border-[#B91C1C] text-[#B91C1C] bg-black/80' 
                    : 'border-primary text-primary bg-black/80'
                }`}>
                  {isForfeited ? '3D ADVISOR PEPE // ABORT LOG' : '3D CMDR DOGE // VICTORY CUBE'}
                </span>
              </div>
            </div>

            <div className="mt-3 text-center font-mono text-[10px] text-on-surface-variant/70">
              {isForfeited ? 'MISSION DISCIPLINE DEBRIEF' : 'ORBITAL ALIGNMENT VERIFIED'}
            </div>
          </div>

          {/* Right Column: Dynamic Terminal & Telemetry Details */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between">
            {/* Title & Status */}
            <div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 border font-label-caps text-xs uppercase tracking-widest mb-3 ${
                isForfeited
                  ? 'bg-[#B91C1C]/20 border-[#B91C1C] text-[#B91C1C]'
                  : 'bg-primary/10 border-primary text-primary'
              }`}>
                {isForfeited ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C]" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{isForfeited ? 'CLASSIFIED TARGET UNSEALED' : 'CENTER ORBIT DECIPHERED'}</span>
              </div>

              <h2 className="font-display-hero text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                {isForfeited ? 'Mission Forfeited' : 'Target Acquired'}
              </h2>

              <div className={`py-2 px-5 font-display-hero text-xl sm:text-2xl font-black uppercase tracking-widest inline-block ${
                isForfeited
                  ? 'bg-[#991B1B] text-white shadow-[0_0_25px_rgba(185,28,28,0.5)] border border-[#B91C1C]'
                  : 'bg-primary text-black shadow-[0_0_20px_rgba(72,255,72,0.6)]'
              }`}>
                {targetWord}
              </div>
            </div>

            {/* Telemetry Stats Grid */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-black/60 border border-white/10 text-left">
                <span className="font-label-caps text-[10px] text-on-surface-variant/70 uppercase block">
                  FINAL CREDITS
                </span>
                <span className={`font-telemetry-md text-xl sm:text-2xl font-bold ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>
                  {finalScore} CR {isForfeited && <span className="text-xs text-[#B91C1C]/80 block font-normal">(FORFEIT)</span>}
                </span>
              </div>

              <div className="p-3 bg-black/60 border border-white/10 text-left">
                <span className="font-label-caps text-[10px] text-on-surface-variant/70 uppercase block">
                  PROBES LAUNCHED
                </span>
                <span className="font-telemetry-md text-xl sm:text-2xl font-bold text-white">
                  {guessesCount}
                </span>
              </div>
            </div>

            {/* AI Debrief Terminal Protocol */}
            <div className={`text-left border p-3.5 mb-4 ${
              isForfeited ? 'bg-[#120808] border-[#B91C1C]/50' : 'bg-black/90 border-primary/40'
            }`}>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                <span className={`font-label-caps text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold ${
                  isForfeited ? 'text-[#B91C1C]' : 'text-primary'
                }`}>
                  <Terminal className="w-3.5 h-3.5" />
                  AI DEBRIEF PROTOCOL
                </span>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 border ${
                  isForfeited ? 'border-[#B91C1C]/40 text-[#B91C1C]' : 'border-primary/40 text-primary'
                }`}>
                  UPLINK: ACTIVE
                </span>
              </div>

              <p className="font-telemetry-sm text-xs text-white font-mono leading-relaxed min-h-[48px]">
                &gt; {streamedRoast}
                {isStreaming && <span className={`inline-block w-2 h-3.5 ml-1 animate-pulse ${
                  isForfeited ? 'bg-[#B91C1C]' : 'bg-primary'
                }`} />}
              </p>
            </div>

            {/* Countdown to Next Orbit */}
            <div className="flex items-center justify-center gap-2 p-2 bg-white/5 border border-white/10 font-label-caps text-xs text-on-surface-variant mb-4">
              <Clock className={`w-3.5 h-3.5 ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`} />
              <span>NEXT COORDINATE ORBIT IN:</span>
              <span className={`font-bold ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>{countdown}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 font-label-caps text-xs">
              <button
                onClick={handleShare}
                className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/20 glitch-hover cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="truncate">{copied ? 'COPIED!' : 'SHARE DEBRIEF'}</span>
              </button>

              <button
                onClick={onOpenStandings}
                className="py-3 px-3 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 glitch-hover cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)]"
              >
                <Trophy className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="truncate">STANDINGS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};