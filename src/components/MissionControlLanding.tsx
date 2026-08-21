import type { FC } from 'react';
import type { UserProfile } from '../types/game';
import { Play, MessageSquare, Shield, Users } from 'lucide-react';

interface MissionControlLandingProps {
  onLaunch: () => void;
  onOpenComms: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const MissionControlLanding: FC<MissionControlLandingProps> = ({
  onLaunch,
  onOpenComms,
  user,
  onOpenAuth,
}) => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 w-full">
      <div className="w-full max-w-md stitch-card rounded-3xl p-8 sm:p-10 border border-white/10 flex flex-col items-center text-center shadow-2xl relative">
        
        {/* Glow Pulse Rings */}
        <div className="w-28 h-28 rounded-full border border-white/10 flex items-center justify-center relative my-4">
          <div className="absolute inset-0 rounded-full border border-[#00f0ff]/20 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border border-[#00f0ff]/40 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-[#00f0ff] shadow-[0_0_20px_#00f0ff]"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#eef2ff] mt-2 mb-2">
          Orbito
        </h1>

        {/* Tagline */}
        <p className="font-sans text-sm text-[#8080a0] mb-6 max-w-xs leading-relaxed">
          The semantic word game that orbits the center.
        </p>

        {/* Authenticated Pilot Badge or Sign-In Prompt */}
        {user ? (
          <div className="w-full bg-[#070714] border border-white/5 rounded-2xl p-3.5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full border border-[#00f0ff]" />
              <div className="text-left">
                <span className="font-mono text-xs font-bold text-[#eef2ff] block">{user.name}</span>
                <span className="font-mono text-[10px] text-[#00f0ff] flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {user.community}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">
              Ready
            </span>
          </div>
        ) : (
          <div
            onClick={onOpenAuth}
            className="w-full bg-[#070714] border border-[#00f0ff]/30 hover:border-[#00f0ff] rounded-2xl p-3.5 mb-6 flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#00f0ff]" />
              <div className="text-left">
                <span className="font-mono text-xs font-bold text-[#eef2ff] block group-hover:text-[#00f0ff]">
                  Google Pilot Authentication
                </span>
                <span className="font-mono text-[10px] text-[#8080a0]">
                  Link profile to record daily standing
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#00f0ff] font-bold">Sign In &gt;</span>
          </div>
        )}

        {/* Action Dual Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onLaunch}
            className="py-3.5 px-4 rounded-xl bg-[#00f0ff] text-[#05050c] font-mono text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch</span>
          </button>

          <button
            onClick={onOpenComms}
            className="py-3.5 px-4 rounded-xl bg-transparent border border-white/10 text-[#8080a0] font-mono text-xs font-bold uppercase tracking-wider hover:border-white/30 hover:text-[#eef2ff] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comms</span>
          </button>
        </div>

        {/* System Online Badge */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#00f0ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping"></span>
          <span>• CORE SYSTEMS ONLINE</span>
        </div>
      </div>
    </main>
  );
};