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
    <div className="w-full max-w-md my-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full glass-panel py-2.5 px-4 rounded-xl flex items-center justify-between text-xs font-label-mono text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#ffb59a]" />
          <span>Orbital Hints ({unlockedHints.length}/3)</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="glass-card mt-2 p-4 rounded-xl flex flex-col gap-3">
          {unlockedHints.length === 0 ? (
            <p className="font-label-mono text-xs text-[#b9cacb]/70 text-center py-2">
              No hints requested yet. Hints reveal semantic clues about the center word.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {unlockedHints.map((hint, idx) => (
                <div key={idx} className="bg-[#1e1e31]/60 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-label-mono text-[#ffb59a] font-bold uppercase">
                      Hint #{idx + 1}
                    </span>
                    <span className="text-[10px] font-label-mono text-[#849495]">
                      (-{penalties[idx]} pts)
                    </span>
                  </div>
                  <p className="font-body-md text-sm text-[#e2e0fb]">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {!isSolved && unlockedHints.length < 3 && (
            <div>
              {showConfirm ? (
                <div className="bg-[#ff5e07]/10 border border-[#ff5e07]/30 p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#ffb59a] text-xs font-label-mono">
                    <AlertTriangle className="w-4 h-4 text-[#ff5e07]" />
                    <span>Unlocking Hint #{unlockedHints.length + 1} costs -{nextPenalty} points!</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-3 py-1 text-xs font-label-mono text-[#b9cacb] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRequest}
                      disabled={loading}
                      className="px-3 py-1 text-xs font-label-mono bg-[#ff5e07] text-white rounded-md hover:bg-[#ff5e07]/80 disabled:opacity-50"
                    >
                      Confirm Reveal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-lg border border-[#00f0ff]/40 text-[#00f0ff] font-label-mono text-xs uppercase tracking-wider hover:bg-[#00f0ff]/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Unlock Hint #{unlockedHints.length + 1} (-{nextPenalty} pts)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};