import { useState, type FC } from 'react';
import { Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface HintDrawerProps {
  unlockedHints: string[];
  onRequestHint: () => Promise<void>;
  loading: boolean;
  isSolved: boolean;
}

export const HintDrawer: FC<HintDrawerProps> = ({
  unlockedHints = [],
  onRequestHint,
  loading,
  isSolved,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const penalties = [100, 200, 350];
  const nextPenalty = penalties[unlockedHints.length] || 0;

  const handleConfirmRequest = async () => {
    setShowConfirm(false);
    await onRequestHint();
  };

  return (
    <div className="w-full max-w-md my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full cyber-glass py-3 px-4 rounded-2xl flex items-center justify-between text-xs font-label-mono text-[#b9cacb] hover:text-[#00f0ff] transition-all hover:border-[#00f0ff]/30"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#ffb59a]/15 border border-[#ffb59a]/30 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-[#ffb59a]" />
          </div>
          <span className="font-semibold">Orbital Clues ({unlockedHints.length}/3 Unlocked)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#00f0ff]" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="cyber-glass mt-2 p-4 rounded-2xl flex flex-col gap-3">
          {unlockedHints.length === 0 ? (
            <p className="font-label-mono text-xs text-[#849495] text-center py-2">
              No clues revealed yet. Unlock orbital hints to guide your trajectory.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {unlockedHints.map((hint, idx) => (
                <div key={idx} className="bg-[#0c0c1f]/80 p-3.5 rounded-xl border border-[#00f0ff]/20 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-label-mono text-[#00f0ff] font-bold uppercase tracking-wider">
                      Telemetry Clue #{idx + 1}
                    </span>
                    <span className="text-[10px] font-label-mono text-[#ff5e07] font-semibold">
                      -{penalties[idx]} pts
                    </span>
                  </div>
                  <p className="font-body-md text-sm text-[#e2e0fb] leading-relaxed">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {!isSolved && unlockedHints.length < 3 && (
            <div>
              {showConfirm ? (
                <div className="bg-[#ff5e07]/10 border border-[#ff5e07]/40 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#ffb59a] text-xs font-label-mono font-medium">
                    <AlertTriangle className="w-4 h-4 text-[#ff5e07] shrink-0" />
                    <span>Unlocking Clue #{unlockedHints.length + 1} permanently deducts -{nextPenalty} points!</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-3.5 py-1.5 text-xs font-label-mono text-[#b9cacb] hover:text-white rounded-lg hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRequest}
                      disabled={loading}
                      className="px-4 py-1.5 text-xs font-label-mono bg-[#ff5e07] text-white font-bold rounded-lg hover:bg-[#ff5e07]/80 disabled:opacity-50"
                    >
                      Confirm -{nextPenalty} pts
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#00f0ff]/40 text-[#00f0ff] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Unlock Clue #{unlockedHints.length + 1} (-{nextPenalty} pts)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};