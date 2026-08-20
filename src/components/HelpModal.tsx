import type { FC } from 'react';
import { X, Target, Compass, Flame, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl w-full max-w-md p-6 flex flex-col relative max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-xl font-bold text-[#00f0ff]">HOW TO PLAY</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[#849495] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs font-body-md text-[#e2e0fb] leading-relaxed">
          <div className="flex gap-3 items-start">
            <Target className="w-5 h-5 text-[#00f0ff] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Find the Center Word</strong>
              Every day, a secret target word sits at Rank #1 in the semantic starfield.
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Compass className="w-5 h-5 text-[#ffb59a] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Semantic Proximity</strong>
              Rank is based on mathematical meaning distance, not spelling. The closer your word is in meaning, the higher the temperature.
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Flame className="w-5 h-5 text-[#ff5e07] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Heat Signals</strong>
              Rank 1-10 is Burning Hot 🔥🔥🔥, Rank 11-100 is Very Hot 🔥, Rank 101-500 is Warm 🌡️.
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Lightbulb className="w-5 h-5 text-[#ffdcc3] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Points & Hints</strong>
              Start with 1,000 pts. Every guess costs -5 pts. Unlocking clues deducts points.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-full bg-[#00f0ff] text-[#00363a] font-label-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7df4ff] transition-all"
        >
          Got It, Let's Orbit!
        </button>
      </motion.div>
    </div>
  );
};