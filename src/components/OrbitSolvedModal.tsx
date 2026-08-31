import { useState, useEffect, type FC } from 'react';
import { ApiClient } from '../api/client';
import { 
  Share2, 
  Trophy, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Terminal 
} from 'lucide-react';

interface OrbitSolvedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStandings: () => void;
  sessionId: string;
  finalScore: number;
  guessesCount: number;
  targetWord?: string;
  userCallsign?: string;
  savedRoast?: string | null;
  onRoastLoaded?: (roastText: string) => void;
  isForfeited?: boolean;
}

export const OrbitSolvedModal: FC<OrbitSolvedModalProps> = ({
  isOpen,
  onClose,
  onOpenStandings,
  sessionId,
  finalScore,
  guessesCount,
  targetWord = 'CENTER TARGET',
  userCallsign = 'Pilot',
  savedRoast: _savedRoast,
  onRoastLoaded,
  isForfeited = false,
}) => {
  const [streamedRoast, setStreamedRoast] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setCountdown(`${hours}:${mins}:${secs}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRoast();
    }
  }, [isOpen, sessionId, isForfeited, guessesCount, targetWord, userCallsign]);

  const fetchRoast = async () => {
    try {
      setIsStreaming(true);
      setStreamedRoast('');
      let text = '';
      try {
        if (sessionId) {
          const res = await ApiClient.generateRoast(sessionId, 'savage');
          if (res.roastText) {
            text = res.roastText;
          }
        }
      } catch (err) {
        console.warn('Backend roast fetch failed, using smart telemetry generator:', err);
      }

      if (!text) {
        if (isForfeited) {
          text = `${userCallsign}, emergency abort after ${guessesCount} probe${guessesCount === 1 ? '' : 's'}? Giving up on "${targetWord}" like a rookie pilot who dropped out of Starfleet Academy on day one.`;
        } else if (guessesCount === 1) {
          text = `${userCallsign}, target coordinate "${targetWord}" acquired on the very first probe! 100% sniper calibration, Commander. Starfleet Command acknowledges elite orbital mastery.`;
        } else if (guessesCount <= 5) {
          text = `${userCallsign}, pinpoint trajectory to "${targetWord}" in only ${guessesCount} probes. Fast lock-on and clean telemetry.`;
        } else {
          text = `${userCallsign}, taking ${guessesCount} chaotic probes to finally uncover "${targetWord}"? An offline navigational beacon calculates faster trajectories.`;
        }
      }

      if (onRoastLoaded) {
        onRoastLoaded(text);
      }
      streamText(text);
    } catch {
      const fallback = isForfeited
        ? `${userCallsign}, mission aborted after ${guessesCount} probes. Target "${targetWord}" unsealed.`
        : `${userCallsign}, target "${targetWord}" successfully acquired in ${guessesCount} probes.`;
      streamText(fallback);
    }
  };

  const streamText = (fullText: string) => {
    setIsStreaming(true);
    setStreamedRoast('');
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < fullText.length) {
        setStreamedRoast(fullText.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(timer);
        setIsStreaming(false);
      }
    }, 18);
  };

  if (!isOpen) return null;

  const handleShare = () => {
    const text = isForfeited
      ? `ORBITO SYSTEM // MISSION FORFEITED\nCallsign: ${userCallsign}\nTarget Unsealed: ${targetWord}\nProbes: ${guessesCount}\nCredits: 0 CR\nPlay: https://orbito.space`
      : `ORBITO SYSTEM // TARGET ACQUIRED\nCallsign: ${userCallsign}\nTarget: ${targetWord}\nProbes: ${guessesCount}\nCredits: ${finalScore} CR\nPlay: https://orbito.space`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg border relative p-6 sm:p-8 text-center font-telemetry-md transition-all ${
        isForfeited
          ? 'bg-[#0d0a0a] border-[#B91C1C] shadow-[0_0_50px_rgba(185,28,28,0.45)]'
          : 'bg-[#0a0f0d] border-primary/60 shadow-[0_0_50px_rgba(72,255,72,0.2)]'
      }`}>
        {/* HUD Corners */}
        <div className={`telemetry-corner corner-tl font-mono text-[10px] ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>
          STATUS: {isForfeited ? 'MISSION_ABORTED_FORFEITED' : 'MISSION_ACCOMPLISHED'}
        </div>
        <div className="telemetry-corner corner-tr">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-4 mb-4">
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

          <h2 className="font-display-hero text-3xl sm:text-4xl text-white uppercase tracking-tight">
            {isForfeited ? 'Mission Forfeited' : 'Target Acquired'}
          </h2>

          <div className={`mt-3 py-2.5 px-6 font-display-hero text-2xl sm:text-3xl font-black uppercase tracking-widest inline-block ${
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
            <span className={`font-telemetry-md text-2xl font-bold ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>
              {finalScore} CR {isForfeited && <span className="text-xs text-[#B91C1C]/80 block font-normal">(FORFEIT)</span>}
            </span>
          </div>

          <div className="p-3 bg-black/60 border border-white/10 text-left">
            <span className="font-label-caps text-[10px] text-on-surface-variant/70 uppercase block">
              PROBES LAUNCHED
            </span>
            <span className="font-telemetry-md text-2xl font-bold text-white">
              {guessesCount}
            </span>
          </div>
        </div>

        {/* AI Debrief Protocol */}
        <div className={`text-left border p-4 mb-4 ${
          isForfeited ? 'bg-[#120808] border-[#B91C1C]/50' : 'bg-black/90 border-primary/40'
        }`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <span className={`font-label-caps text-xs uppercase tracking-wider flex items-center gap-1.5 font-bold ${
              isForfeited ? 'text-[#B91C1C]' : 'text-primary'
            }`}>
              <Terminal className="w-3.5 h-3.5" />
              AI DEBRIEF PROTOCOL
            </span>
          </div>

          <p className="font-telemetry-sm text-xs text-white font-mono leading-relaxed min-h-[50px]">
            &gt; {streamedRoast}
            {isStreaming && <span className={`inline-block w-2 h-3.5 ml-1 animate-pulse ${
              isForfeited ? 'bg-[#B91C1C]' : 'bg-primary'
            }`} />}
          </p>
        </div>

        {/* Countdown to Next Orbit */}
        <div className="flex items-center justify-center gap-2 p-2 bg-white/5 border border-white/10 font-label-caps text-xs text-on-surface-variant mb-5">
          <Clock className={`w-3.5 h-3.5 ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`} />
          <span>NEXT COORDINATE ORBIT IN:</span>
          <span className={`font-bold ${isForfeited ? 'text-[#B91C1C]' : 'text-primary'}`}>{countdown}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 font-label-caps text-xs">
          <button
            onClick={handleShare}
            className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/20 glitch-hover cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'SHARE DEBRIEF'}</span>
          </button>

          <button
            onClick={onOpenStandings}
            className="py-3 px-4 bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 glitch-hover cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)]"
          >
            <Trophy className="w-3.5 h-3.5 text-black" />
            <span>SPACE STANDINGS</span>
          </button>
        </div>
      </div>
    </div>
  );
};