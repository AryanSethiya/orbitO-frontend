import { useState, type FC } from 'react';
import { Rocket, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MissionControlProps {
  onLaunch: (callsign: string) => void;
  onOpenComms: () => void;
}

export const MissionControlLanding: FC<MissionControlProps> = ({ onLaunch, onOpenComms }) => {
  const [callsign, setCallsign] = useState(
    () => localStorage.getItem('orbito_username') || 'AstroPioneer'
  );

  const handleLaunch = () => {
    localStorage.setItem('orbito_username', callsign);
    onLaunch(callsign);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="stitch-card w-full max-w-[420px] rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center relative"
      >
        {/* Glowing Orb Icon */}
        <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 rounded-full border border-[#00f0ff]/40"></div>
          <div className="absolute inset-5 rounded-full border border-[#00f0ff]/70"></div>
          <div className="w-4 h-4 rounded-full bg-[#00f0ff] shadow-[0_0_20px_#00f0ff]"></div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="font-sans text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">
          Orbito
        </h1>
        <p className="font-sans text-sm text-[#8080a0] max-w-[280px] mb-8 leading-relaxed">
          The semantic word game that orbits the center.
        </p>

        {/* Callsign Quick Config */}
        <div className="w-full mb-6 text-left">
          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8080a0] mb-1.5 px-1">
            Pilot Callsign
          </label>
          <input
            type="text"
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            className="w-full bg-[#070714] border border-white/10 rounded-xl py-2.5 px-3.5 font-mono text-xs text-[#00f0ff] focus:outline-none focus:border-[#00f0ff] transition-all"
            placeholder="AstroPioneer"
          />
        </div>

        {/* Action Buttons (Dual Pills) */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <button
            onClick={handleLaunch}
            className="py-3 px-4 rounded-full border border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#00f0ff] hover:text-[#05050c] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch</span>
          </button>

          <button
            onClick={onOpenComms}
            className="py-3 px-4 rounded-full border border-white/15 bg-white/5 text-[#eef2ff] font-mono text-[11px] uppercase tracking-wider hover:border-white/40 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#8080a0]" />
            <span>Comms</span>
          </button>
        </div>

        {/* Systems Online Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#8080a0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff] animate-pulse"></span>
          <span>Core Systems Online</span>
        </div>
      </motion.div>
    </div>
  );
};