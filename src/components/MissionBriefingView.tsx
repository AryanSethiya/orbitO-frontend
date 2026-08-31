import type { FC } from 'react';
import { Rocket, Target } from 'lucide-react';

interface MissionBriefingViewProps {
  onInitiateSequence: () => void;
}

export const MissionBriefingView: FC<MissionBriefingViewProps> = ({
  onInitiateSequence,
}) => {
  return (
    <div className="antialiased min-h-screen flex flex-col relative overflow-x-hidden font-telemetry-md text-on-background bg-background">
      <div className="scanline"></div>

      {/* Main Canvas */}
      <main className="flex-grow pt-24 md:pt-28 pb-20 px-4 md:px-margin-desktop max-w-container-max mx-auto w-full relative z-10">
        {/* Header Section */}
        <header className="mb-12 border-b border-white/10 pb-6 relative">
          <div className="flex justify-between items-start">
            <h1 className="font-display-hero text-4xl sm:text-5xl md:text-6xl font-extrabold text-white uppercase tracking-tight leading-none">
              MISSION BRIEFING
            </h1>
            <div className="font-mono text-xs text-on-surface-variant/60 tracking-wider">
              DOC_REF: B-774.2
            </div>
          </div>

          <p className="font-telemetry-md text-sm sm:text-base text-on-surface-variant mt-4 max-w-3xl leading-relaxed">
            Operative, your objective is to decode the semantic coordinates of the target entity. You must navigate the conceptual void by entering terms conceptually adjacent to the target. Proximity dictates survival.
          </p>
        </header>

        {/* Bento Grid Layout for Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Objective Card (Span 4) */}
          <div className="glass-panel p-6 sm:p-7 relative md:col-span-4 flex flex-col justify-between group hover:border-primary/50 transition-colors duration-300 min-h-[340px]">
            <div className="telemetry-corner corner-tl text-[10px] text-on-surface-variant/50 font-mono">
              PHASE 01
            </div>
            <div className="telemetry-corner corner-br text-[10px] text-on-surface-variant/50 font-mono">
              INIT
            </div>

            <div className="mt-4 mb-4">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 bg-white/[0.02]">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display-hero text-2xl font-bold text-white mb-3">
                The Objective
              </h3>
              <p className="font-telemetry-sm text-xs sm:text-sm text-on-surface-variant/80 leading-relaxed">
                A classified target word exists at the center of the conceptual universe. You have unlimited attempts to guess this word. Every transmission you make is analyzed for semantic similarity to the core target.
              </p>
            </div>
          </div>

          {/* Proximity Visualization (Span 8) - Smoothly Animated Orbiting System */}
          <div className="active-panel p-6 relative md:col-span-8 min-h-[360px] overflow-hidden flex items-center justify-center bg-[#080d0a]/90 border border-primary/40 shadow-[0_0_35px_rgba(72,255,72,0.08)]">
            <div className="telemetry-corner corner-tl text-primary font-mono text-[10px] tracking-wider">
              SYS_VISUAL: ORBITAL_PROXIMITY
            </div>
            <div className="telemetry-corner corner-br text-on-surface-variant/60 font-mono text-[10px]">
              LOCKED
            </div>

            {/* Continuously Animated Rotating Rings & Orbiting Probes */}
            <div className="relative w-full h-full min-h-[300px] flex items-center justify-center select-none pointer-events-none">
              {/* Outer Dashed Orbit 3 */}
              <div className="orbit-ring orbit-3 pointer-events-none"></div>
              {/* Mid Solid Orbit 2 */}
              <div className="orbit-ring orbit-2 pointer-events-none"></div>
              {/* Inner Dotted Orbit 1 */}
              <div className="orbit-ring orbit-1 pointer-events-none"></div>

              {/* Center Target Node */}
              <div className="target-node z-30"></div>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-7 font-mono text-[10px] text-primary font-bold tracking-widest uppercase z-30">
                TARGET
              </span>

              {/* Data Point 1: WARM (85%) - Smooth Fluid Orbit */}
              <div 
                className="absolute w-[160px] h-[160px] top-1/2 left-1/2 z-20"
                style={{ animation: 'rotate-orbit 18s linear infinite' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="font-mono text-[10px] font-bold text-white tracking-widest leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]">
                    WARM
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></span>
                    <span className="font-mono text-[10px] font-bold text-white leading-none drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]">
                      (85%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Point 2: COLD (32%) - Smooth Fluid Reverse Orbit */}
              <div 
                className="absolute w-[280px] h-[280px] top-1/2 left-1/2 z-20" 
                style={{ animation: 'rotate-orbit-reverse 32s linear infinite' }}
              >
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5 drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]">
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                  <span className="font-mono text-[10px] text-on-surface-variant font-bold tracking-wider whitespace-nowrap">
                    COLD (32%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step by Step Protocol (Span 12) */}
          <div className="md:col-span-12 glass-panel p-6 sm:p-8 relative mt-2">
            <div className="telemetry-corner corner-tl text-[10px] text-on-surface-variant/60 font-mono tracking-wider">
              EXECUTION PROTOCOL
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-6">
              {/* Step 01 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full border border-primary/60 text-white flex items-center justify-center font-mono text-xs flex-shrink-0 font-bold bg-primary/10">
                  01
                </div>
                <div>
                  <h4 className="font-telemetry-md text-sm sm:text-base text-white font-bold mb-1.5">
                    Input Coordinates
                  </h4>
                  <p className="font-telemetry-sm text-xs sm:text-sm text-on-surface-variant/80 leading-relaxed">
                    Transmit a valid English word into the console. The system evaluates context, not spelling.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full border border-primary/60 text-white flex items-center justify-center font-mono text-xs flex-shrink-0 font-bold bg-primary/10">
                  02
                </div>
                <div>
                  <h4 className="font-telemetry-md text-sm sm:text-base text-white font-bold mb-1.5">
                    Analyze Telemetry
                  </h4>
                  <p className="font-telemetry-sm text-xs sm:text-sm text-on-surface-variant/80 leading-relaxed">
                    Review the percentage score. Higher percentages indicate closer semantic proximity to the target entity in the multidimensional space.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full border border-primary/60 text-white flex items-center justify-center font-mono text-xs flex-shrink-0 font-bold bg-primary/10">
                  03
                </div>
                <div>
                  <h4 className="font-telemetry-md text-sm sm:text-base text-white font-bold mb-1.5">
                    Adjust Trajectory
                  </h4>
                  <p className="font-telemetry-sm text-xs sm:text-sm text-on-surface-variant/80 leading-relaxed">
                    Iterate your guesses. If "OCEAN" yields 40% and "WATER" yields 60%, shift your focus towards fluid dynamics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button (Span 12) */}
          <div className="md:col-span-12 flex justify-center mt-8 mb-4">
            <button 
              onClick={onInitiateSequence}
              className="btn-glitch px-12 py-4 font-telemetry-md text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(72,255,72,0.6)]"
            >
              <Rocket className="w-5 h-5 fill-black" />
              <span>INITIATE SEQUENCE</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-white/5 flex flex-col md:flex-row justify-between items-center px-margin-desktop py-6 relative z-10 mt-auto text-xs font-mono">
        <div className="text-white/80 mb-3 md:mb-0">
          © 2144 ORBITO SYSTEM COMMAND. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6 uppercase text-on-surface-variant/60">
          <span>MISSION_STATUS: <span className="text-primary font-bold">ONLINE</span></span>
          <span>COORDINATES: <span className="text-white">0.0.0.1</span></span>
          <span>CLOCK: <span className="text-white">UTC+0</span></span>
        </div>
      </footer>
    </div>
  );
};
