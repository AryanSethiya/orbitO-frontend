import { type Guess } from '../types/game';

export interface ShareTelemetryParams {
  puzzleDate?: string | null;
  guesses?: Guess[];
  guessesCount: number;
  finalScore: number;
  isForfeited?: boolean;
  userCallsign: string;
  efficiencyRating: string;
  aiRoast?: string | null;
}

/**
 * Formats a clean, non-spoiler Wordle/Orbito-style telemetry log for social sharing.
 */
export const generateShareText = ({
  puzzleDate,
  guesses = [],
  guessesCount,
  finalScore,
  isForfeited = false,
  userCallsign,
  efficiencyRating,
  aiRoast,
}: ShareTelemetryParams): string => {
  const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
  const cleanCallsign =
    userCallsign &&
    !userCallsign.toLowerCase().startsWith('pilot_00') &&
    !userCallsign.toLowerCase().startsWith('guest_')
      ? userCallsign
      : 'PILOT';

  const cleanRoast = aiRoast ? aiRoast.trim().replace(/^["']|["']$/g, '') : null;

  if (isForfeited) {
    const lines = [
      `🛰️ ORBITO MISSION REPORT #${dateStr}`,
      `Pilot: ${cleanCallsign} // STATUS: MIA`,
      `Probes Deployed: ${guessesCount} | Credits: 0 CR`,
      `Status: Signal lost in deep void 📡`,
    ];
    if (cleanRoast) {
      lines.push(``, `🤖 AI ROAST: "${cleanRoast}"`);
    }
    lines.push(``, `Can you decipher the orbital frequency?`, `https://orbit-o-sigma.vercel.app/`);
    return lines.join('\n');
  }

  // Generate radar trajectory blocks
  const validGuesses = guesses.length > 0 ? guesses : [];
  let telemetryRows: string[] = [];

  const getSignalEmoji = (similarity: number, rank: number) => {
    if (rank === 1 || similarity >= 0.99) return { emoji: '🎯', label: '100% LOCK', bar: '▓▓▓▓▓▓▓▓▓▓' };
    if (similarity >= 0.75 || rank <= 50) return { emoji: '🟢', label: `${Math.round(similarity * 100)}% SIGNAL`, bar: '▓▓▓▓▓▓▓░░░' };
    if (similarity >= 0.45 || rank <= 250) return { emoji: '🟡', label: `${Math.round(similarity * 100)}% PROXIMITY`, bar: '▓▓▓▓▓░░░░░' };
    if (similarity >= 0.20 || rank <= 600) return { emoji: '🟠', label: `${Math.round(similarity * 100)}% DRIFT`, bar: '▓▓▓░░░░░░░' };
    return { emoji: '🔴', label: `${Math.round(similarity * 100)}% VOID`, bar: '▓░░░░░░░░░' };
  };

  if (validGuesses.length > 0 && validGuesses.length <= 6) {
    telemetryRows = validGuesses.map((g, idx) => {
      const { emoji, label, bar } = getSignalEmoji(g.similarityScore || 0, g.rank || 500);
      return `${idx + 1}. ${emoji} ${bar} ${label}`;
    });
  } else if (validGuesses.length > 6) {
    // Show first 2 probes, highest middle probe, and final victory
    const first = validGuesses[0];
    const second = validGuesses[1];
    const sortedBest = [...validGuesses.slice(2, -1)].sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
    const bestMiddle = sortedBest[0];
    const last = validGuesses[validGuesses.length - 1];

    const s1 = getSignalEmoji(first.similarityScore || 0, first.rank || 500);
    const s2 = getSignalEmoji(second.similarityScore || 0, second.rank || 500);
    telemetryRows.push(`1. ${s1.emoji} ${s1.bar} ${s1.label}`);
    telemetryRows.push(`2. ${s2.emoji} ${s2.bar} ${s2.label}`);
    if (bestMiddle) {
      const sb = getSignalEmoji(bestMiddle.similarityScore || 0, bestMiddle.rank || 500);
      telemetryRows.push(`... ${sb.emoji} ${sb.bar} ${sb.label} (Best Approach)`);
    }
    const sl = getSignalEmoji(last.similarityScore || 1.0, last.rank || 1);
    telemetryRows.push(`${validGuesses.length}. ${sl.emoji} ${sl.bar} ${sl.label}`);
  } else {
    telemetryRows = [`🎯 ▓▓▓▓▓▓▓▓▓▓ 100% DIRECT LOCK`];
  }

  const resultLines = [
    `🛰️ ORBITO FLIGHT LOG #${dateStr}`,
    `Pilot: ${cleanCallsign} [${efficiencyRating}]`,
    `Probes: ${guessesCount} | Score: ${finalScore} CR`,
    `Status: ORBIT ACQUIRED ⚡`,
    ``,
    ...telemetryRows,
  ];

  if (cleanRoast) {
    resultLines.push(``, `🤖 AI ROAST: "${cleanRoast}"`);
  }

  resultLines.push(``, `Intercept today's coordinate:`, `https://orbit-o-sigma.vercel.app/`);

  return resultLines.join('\n');
};
