import { useState, type FC, type KeyboardEvent } from 'react';
import type { Guess, UserProfile } from '../types/game';
import { Target, Sparkles, Send, HelpCircle, Flame, Compass, RefreshCw, Trophy, Zap } from 'lucide-react';

interface DailyOrbitDesktopProps {
  guesses: Guess[];
  currentScore: number;
  solved: boolean;
  unlockedHints: string[];
  onSubmitGuess: (word: string) => Promise<void>;
  onRequestHint: () => Promise<void>;
  onShowRoast: () => void;
  onOpenStandings: () => void;
  user: UserProfile | null;
  loadingGuess: boolean;
}

export const DailyOrbitDesktop: FC<DailyOrbitDesktopProps> = ({
  guesses,
  currentScore,
  solved,
  unlockedHints,
  onSubmitGuess,
  onRequestHint,
  onShowRoast,
  loadingGuess,
}) => {
  const [inputWord, setInputWord] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  const handleSend = async () => {
    if (!inputWord.trim() || loadingGuess || solved) return;
    const word = inputWord.trim();
    setInputWord('');
    await onSubmitGuess(word);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleHintClick = async () => {
    if (hintLoading || solved || unlockedHints.length >= 3) return;
    try {
      setHintLoading(true);
      await onRequestHint();
    } finally {
      setHintLoading(false);
    }
  };

  const bestGuess = guesses.reduce((best, cur) => (cur.rank < best.rank ? cur : best), guesses[0] || null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 flex flex-col items-center">
      {/* 3D Holographic Semantic Radar Stage */}
      <div className="relative w-full max-w-3xl h-[340px] sm:h-[420px] flex items-center justify-center my-2 select-none overflow-visible">
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ perspective: '1200px' }}
        >
          <div 
            className="w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border border-[#00f0ff]/15 flex items-center justify-center transition-all duration-700"
            style={{ transform: 'rotateX(40deg)', transformStyle: 'preserve-3d' }}
          >
            <div className="absolute w-[80%] h-[80%] rounded-full border border-[#00f0ff]/20 border-dashed animate-[spin_60s_linear_infinite]" />
            <div className="absolute w-[60%] h-[60%] rounded-full border border-[#ffaa00]/25 shadow-[0_0_20px_rgba(255,170,0,0.1)]" />
            <div className="absolute w-[40%] h-[40%] rounded-full border border-[#ff5e07]/35 shadow-[0_0_25px_rgba(255,94,7,0.15)]" />
            <div className="absolute w-[20%] h-[20%] rounded-full border border-[#00ff88]/50 shadow-[0_0_30px_rgba(0,255,136,0.3)] animate-pulse" />

            {guesses.slice(-8).map((g, idx) => {
              const angle = (idx * 45 + g.rank * 13) % 360;
              const rad = (angle * Math.PI) / 180;
              const distance = Math.min(180, Math.max(30, Math.log10(g.rank + 1) * 48));
              const x = Math.cos(rad) * distance;
              const y = Math.sin(rad) * distance;

              return (
                <div
                  key={g.id || idx}
                  className="absolute pointer-events-auto group cursor-pointer transition-all duration-500"
                  style={{ transform: `translate3d(${x}px, ${y}px, 20px)` }}
                >
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    g.rank === 1
                      ? 'bg-[#00ff88] shadow-[0_0_20px_#00ff88]'
                      : g.rank < 100
                      ? 'bg-[#ff5e07] shadow-[0_0_15px_#ff5e07]'
                      : g.rank < 1000
                      ? 'bg-[#ffaa00] shadow-[0_0_10px_#ffaa00]'
                      : 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#05050c]/90 border border-white/20 font-mono text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                    <span className="font-bold">{g.word}</span> <span className="text-[#00f0ff]">#{g.rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="z-10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00f0ff]/10 border-2 border-[#00f0ff] flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] animate-[pulse_3s_ease-in-out_infinite]">
            <Target className="w-8 h-8 text-[#00f0ff]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#00f0ff] font-bold mt-2">
            Target Center
          </span>
        </div>
      </div>

      {/* Input Console Bar */}
      <div className="w-full max-w-2xl stitch-card rounded-2xl p-2 sm:p-3 border border-[#00f0ff]/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] flex items-center gap-2 mb-6">
        <div className="pl-3 text-[#00f0ff]">
          <Compass className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
        </div>
        <input
          id="probe-word-input"
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={solved || loadingGuess}
          placeholder={solved ? "Today's Orbit Solved! Check Standings." : "Launch semantic probe word (e.g. guitar, coffee, ocean)..."}
          className="flex-1 bg-transparent border-none text-[#eef2ff] font-mono text-sm sm:text-base px-2 py-1.5 focus:outline-none placeholder:text-[#8080a0]/40 uppercase tracking-wider"
        />
        <button
          onClick={handleSend}
          disabled={solved || loadingGuess || !inputWord.trim()}
          className="py-2.5 px-5 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40"
        >
          {loadingGuess ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Launch</span>
            </>
          )}
        </button>
      </div>

      {/* Telemetry Dashboard & AI Clues HUD */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        <div className="md:col-span-2 stitch-card rounded-3xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Recent Orbit Probes ({guesses.length})
            </h3>
            {bestGuess && (
              <span className="font-mono text-xs text-[#00ff88] font-bold">
                Closest: {bestGuess.word} (#{bestGuess.rank})
              </span>
            )}
          </div>

          {guesses.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#8080a0]">
              No probes launched yet. Type any everyday concept or word to probe proximity.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {[...guesses].reverse().map((g, idx) => (
                <div
                  key={g.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#070714] border border-white/5 hover:border-[#00f0ff]/30 transition-all font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#8080a0]">#{guesses.length - idx}</span>
                    <span className="font-bold text-[#eef2ff] uppercase tracking-wider">{g.word}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`w-3.5 h-3.5 ${
                        g.rank === 1 ? 'text-[#00ff88]' : g.rank < 100 ? 'text-[#ff5e07]' : g.rank < 1000 ? 'text-[#ffaa00]' : 'text-[#00f0ff]'
                      }`} />
                      <span className="font-bold text-[#eef2ff]">Rank #{g.rank}</span>
                    </div>
                    <span className="text-[10px] text-[#8080a0]">{Math.round(g.similarityScore * 100)}% Sim</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stitch-card rounded-3xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#00f0ff] font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Decrypted Hints ({unlockedHints.length}/3)
              </h3>
              <span className="font-mono text-xs text-[#00f0ff] font-bold">{currentScore} pts</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[0, 1, 2].map((idx) => {
                const hint = unlockedHints[idx];
                const penalty = idx === 0 ? '-100 pts' : idx === 1 ? '-200 pts' : '-350 pts';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-xs font-mono transition-all ${
                      hint
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#eef2ff]'
                        : 'bg-[#070714] border-white/5 text-[#8080a0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase font-bold text-[#00f0ff]">Clue #{idx + 1}</span>
                      {!hint && <span className="text-[9px] text-[#ff5e07]">{penalty}</span>}
                    </div>
                    {hint ? (
                      <p className="text-[#eef2ff] leading-relaxed">{hint}</p>
                    ) : (
                      <p className="italic text-[#8080a0]/60">Encrypted transmission signal...</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {!solved && unlockedHints.length < 3 && (
              <button
                onClick={handleHintClick}
                disabled={hintLoading}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00f0ff] font-mono text-xs font-bold uppercase tracking-wider transition-all border border-[#00f0ff]/30 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Decrypt Next Clue</span>
              </button>
            )}

            {solved && (
              <button
                onClick={onShowRoast}
                className="w-full py-2.5 rounded-xl bg-[#00ff88] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>View Neural AI Roast</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};