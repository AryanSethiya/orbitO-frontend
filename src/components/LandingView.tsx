import { useState, type FC, type FormEvent } from 'react';
import { Rocket, Sparkles, User, LogIn, Trophy, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingViewProps {
  onStartGame: (username: string) => void;
  onOpenAuth: () => void;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export const LandingView: FC<LandingViewProps> = ({
  onStartGame,
  onOpenAuth,
  onOpenLeaderboard,
  onOpenHelp,
}) => {
  const [callsign, setCallsign] = useState(
    () => localStorage.getItem('orbito_username') || 'Pilot-' + Math.floor(1000 + Math.random() * 9000)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalName = callsign.trim() || 'CosmicDrifter';
    localStorage.setItem('orbito_username', finalName);
    onStartGame(finalName);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-4 overflow-hidden">
      {/* Starfield & Concentric Rings */}
      <div className="starfield"></div>
      <div className="orbital-plane orbit-1"></div>
      <div className="orbital-plane orbit-2"></div>
      <div className="orbital-plane orbit-3"></div>

      {/* Top Nav Shortcuts */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 z-40">
        <button
          onClick={onOpenHelp}
          className="text-[#b9cacb] hover:text-[#00f0ff] p-2 rounded-full hover:bg-white/5 transition-all"
          title="How to play"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="text-[#b9cacb] hover:text-[#00f0ff] p-2 rounded-full hover:bg-white/5 transition-all flex items-center gap-1 font-label-mono text-xs"
          title="Space Standings"
        >
          <Trophy className="w-4 h-4 text-[#00f0ff]" />
          <span>Leaderboard</span>
        </button>
      </header>

      {/* Center Landing Hero Card */}
      <motion.main
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 relative flex flex-col items-center"
      >
        <div className="glass-card w-full rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_10px_50px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* Subtle radial cyan glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.12)_0%,transparent_70%)] pointer-events-none"></div>

          {/* Concentric Logo Icon */}
          <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-[#00f0ff] rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 border border-[#00f0ff] rounded-full opacity-50"></div>
            <div className="absolute inset-4 bg-[#00f0ff] rounded-full shadow-[0_0_25px_rgba(0,240,255,0.9)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00363a]" />
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="font-display-lg-mobile md:font-display-lg text-4xl md:text-5xl text-[#dbfcff] drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] tracking-tighter mb-1 font-bold">
            ORBITO
          </h1>
          <p className="font-body-md text-sm text-[#b9cacb] mb-6">
            Find the secret word at the center of the semantic starfield.
          </p>

          {/* Daily Puzzle Badge */}
          <div className="px-3.5 py-1 rounded-full bg-[#1e1e31]/80 border border-white/10 text-[11px] font-label-mono text-[#ffb59a] mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5e07] animate-ping"></span>
            <span>TODAY'S ORBIT // {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Form / Callsign Input */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="w-full relative">
              <label className="block text-left font-label-mono text-[10px] uppercase text-[#849495] mb-1.5 px-1">
                Astronaut Callsign
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-[#849495]" />
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="Enter callsign..."
                  maxLength={24}
                  className="w-full bg-[#0c0c1f]/80 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-label-mono text-[#e2e0fb] placeholder:text-[#849495] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
                />
              </div>
            </div>

            {/* Play as Guest Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Rocket className="w-4 h-4" />
              Launch Orbit
            </button>
          </form>

          {/* Auth link */}
          <button
            onClick={onOpenAuth}
            className="mt-5 text-[#849495] hover:text-[#00f0ff] font-label-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 py-1"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Cloud Account</span>
          </button>
        </div>
      </motion.main>
    </div>
  );
};