import type { FC } from 'react';
import { Rocket } from 'lucide-react';

interface LandingViewProps {
  onStartMission: () => void;
  onOpenBriefing: () => void;
}

export const LandingView: FC<LandingViewProps> = ({
  onStartMission,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden starfield-bg text-on-background bg-black select-none">
      <div className="scanline"></div>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center pt-20 sm:pt-24 pb-12 px-3 sm:px-4 md:px-margin-desktop relative">
        {/* Background Asteroids / Orbs (Decorational) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-10 w-16 h-16 bg-surface-variant rounded-full blur-md"></div>
          <div className="absolute bottom-1/4 right-20 w-24 h-24 bg-surface-container rounded-full blur-sm"></div>
          <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-on-surface-variant rounded-full blur-sm"></div>
        </div>

        <div className="max-w-4xl w-full text-center relative z-10 flex flex-col items-center">
          {/* Top-Left Telemetry HUD */}
          <div className="absolute -top-6 left-0 hidden md:block font-telemetry-sm text-xs text-on-surface-variant/40 text-left leading-relaxed font-mono">
            SYS.REQ: 0x00F8<br/>
            LAT: 45.92<br/>
            LON: -12.4
          </div>

          {/* Headline - Exact 2 lines, responsive across devices */}
          <h1 className="font-display-hero text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight uppercase leading-[1.08] max-w-3xl mb-6 sm:mb-8 px-2">
            ONE WORD HIDES AT THE<br className="hidden sm:inline" /> CENTER OF EVERY ORBIT.
          </h1>

          {/* Central Illustration Container with Corner Brackets */}
          <div className="relative w-full max-w-2xl aspect-[16/9] mb-6 sm:mb-8 group flex items-center justify-center">
            {/* Corner Brackets */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white/40"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white/40"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white/40"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white/40"></div>

            {/* Illustration */}
            <img 
              className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(72,255,72,0.25)] rounded-none" 
              alt="Cybernetic Space Operative" 
              src="/cyber_pepe_astronaut.jpg"
            />

            {/* Glowing Sign Overlay (Positioned directly on the cyber console board) */}
            <div className="absolute bottom-[8%] sm:bottom-[10%] left-[18%] sm:left-[20%] w-[38%] sm:w-[33%] min-h-[46px] sm:h-[26%] flex flex-col items-center justify-center pointer-events-none text-center bg-black/85 backdrop-blur-[2px] p-1 sm:p-2 border border-[#48ff48]/60 shadow-[0_0_20px_rgba(72,255,72,0.4)]">
              <div className="font-label-caps text-[6px] xs:text-[8px] sm:text-[10px] text-[#48ff48]/90 uppercase tracking-widest font-mono flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48ff48] animate-pulse"></span>
                <span>SYS.LINK v2.4</span>
              </div>
              <span className="font-display-hero text-[10px] xs:text-xs sm:text-base md:text-xl font-extrabold text-[#48ff48] drop-shadow-[0_0_12px_rgba(72,255,72,1)] tracking-wider uppercase leading-tight">
                WELCOME TO THE GAME
              </span>
              <span className="font-telemetry-sm text-[6px] xs:text-[8px] sm:text-[10px] text-white/90 font-bold tracking-widest font-mono mt-0.5">
                &gt; INITIALIZE ORBIT &lt;
              </span>
            </div>
          </div>

          {/* CTA & Right-Aligned Telemetry */}
          <div className="w-full max-w-2xl relative flex items-center justify-center px-4 sm:px-0">
            {/* Single Solid Neon Button */}
            <button 
              onClick={onStartMission}
              className="w-full sm:w-auto bg-[#48ff48] text-black font-telemetry-md text-sm md:text-base font-bold px-8 sm:px-12 py-3.5 border border-[#48ff48] glitch-hover flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(72,255,72,0.4)] min-h-[48px]"
            >
              <Rocket className="w-5 h-5 fill-current stroke-none" />
              <span>START MISSION</span>
            </button>

            {/* Bottom-Right Telemetry */}
            <div className="absolute right-0 hidden md:block font-telemetry-sm text-xs text-primary/70 text-right leading-relaxed font-mono">
              CONNECTION: SECURE<br/>
              UPLINK: ACTIVE
            </div>
          </div>
        </div>
      </main>

      {/* Clean Brutalist Footer */}
      <footer className="w-full bg-black/90 border-t border-white/10 py-5 px-4 md:px-margin-desktop mb-14 md:mb-0">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4 font-mono text-xs">
          <div className="text-white/80 font-bold uppercase tracking-wider text-center md:text-left">
            © 2144 ORBITO SYSTEM COMMAND. ALL RIGHTS RESERVED.
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10 text-on-surface-variant/60 tracking-wider uppercase text-center">
            <span>MISSION_STATUS: <span className="text-primary font-bold">ONLINE</span></span>
            <span>COORDINATES: <span className="text-white font-bold">0.0.0.1</span></span>
            <span>CLOCK: <span className="text-white font-bold">UTC+0</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};