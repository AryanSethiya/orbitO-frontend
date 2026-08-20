import { useState, type FC, type FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

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
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter a word to probe orbit..."
        disabled={disabled || loading}
        autoFocus
        autoComplete="off"
        spellCheck="false"
        className="input-field w-full bg-transparent border-none text-center font-semantic-word text-lg md:text-xl text-[#e2e0fb] placeholder:text-[#b9cacb]/40 focus:ring-0 focus:outline-none pb-2 transition-all disabled:opacity-50"
      />
      <div className="input-underline"></div>
      
      <button
        type="submit"
        disabled={!value.trim() || loading || disabled}
        className="absolute right-0 top-0 bottom-2 text-[#00f0ff] hover:text-[#7df4ff] transition-colors px-3 disabled:opacity-30 disabled:hover:text-[#00f0ff] flex items-center justify-center"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </form>
  );
};