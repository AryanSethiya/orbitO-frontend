import { useState, type FC, type FormEvent } from 'react';
import { X, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      localStorage.setItem('orbito_auth_email', email);
      onSuccess(email);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl w-full max-w-sm p-6 relative"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-headline-md text-xl font-bold text-[#00f0ff]">
            {isSignUp ? 'REGISTER ACCOUNT' : 'ASTRONAUT LOGIN'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-[#849495] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-[#00f0ff] animate-bounce" />
            <p className="font-label-mono text-xs text-[#e2e0fb]">
              Authenticated! Initializing personal cosmic session...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-left font-label-mono text-[10px] uppercase text-[#849495] mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#849495]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cosmonaut@space.org"
                  className="w-full bg-[#0c0c1f]/80 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs font-label-mono text-[#e2e0fb] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-left font-label-mono text-[10px] uppercase text-[#849495] mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#849495]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0c0c1f]/80 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs font-label-mono text-[#e2e0fb] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] active:scale-95 transition-all mt-2"
            >
              {isSignUp ? 'Create Cloud Profile' : 'Enter Starfield'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] font-label-mono text-[#849495] hover:text-[#ffb59a] text-center mt-1"
            >
              {isSignUp ? 'Already registered? Sign In' : 'New explorer? Register Account'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};