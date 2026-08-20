import { useState, type FC, type FormEvent } from 'react';
import { Send, Loader2, Compass } from 'lucide-react';

interface GuessInputProps {
  onSubmit: (guess: string) => Promise<void>;
  disabled?: boolean;
}

export const GuessInput: FC<GuessInputProps> = ({ onSubmit, disabled }) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;

    try {
      setLoading(true);
      await onSubmit(trimmed);
      setValue('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md my-4 relative group">
      <div className="relative flex items-center cyber-glass rounded-2xl p-1.5 border border-white/10 focus-within:border-[#00f0ff]/80 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all duration-300">
        <div className="pl-3.5 pr-2 text-[#00f0ff]">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter a word to probe semantic orbit..."
          disabled={disabled || loading}
          autoFocus
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-transparent border-none py-2 text-sm sm:text-base font-semantic-word font-medium text-[#e2e0fb] placeholder:text-[#849495]/60 focus:ring-0 focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#7df4ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(0,240,255,0.6)] active:scale-95 transition-all disabled:opacity-30 disabled:hover:shadow-none flex items-center gap-1.5 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Orbit</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="flex justify-between items-center px-3 mt-1.5">
        <span className="text-[10px] font-label-mono text-[#849495]">
          Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-white">ENTER</kbd> to launch probe
        </span>
        <span className="text-[10px] font-label-mono text-[#849495]">
          1,000 pts base • -5 pts/guess
        </span>
      </div>
    </form>
  );
};