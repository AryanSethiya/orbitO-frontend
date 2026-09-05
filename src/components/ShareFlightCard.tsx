import { useState, useRef, type FC } from 'react';
import { Share2, Copy, Check, Download, Send, Terminal } from 'lucide-react';
import { type Guess } from '../types/game';
import { generateShareText } from '../utils/shareTelemetry';

interface ShareFlightCardProps {
  puzzleDate?: string | null;
  guesses?: Guess[];
  guessesCount: number;
  finalScore: number;
  isForfeited?: boolean;
  userCallsign: string;
  efficiencyRating: string;
}

export const ShareFlightCard: FC<ShareFlightCardProps> = ({
  puzzleDate,
  guesses = [],
  guessesCount,
  finalScore,
  isForfeited = false,
  userCallsign,
  efficiencyRating,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [badgeDownloaded, setBadgeDownloaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareText = generateShareText({
    puzzleDate,
    guesses,
    guessesCount,
    finalScore,
    isForfeited,
    userCallsign,
    efficiencyRating,
  });

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleShareX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OrbitO Mission Telemetry #${puzzleDate || 'Daily'}`,
          text: shareText,
          url: 'https://orbito.site',
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Generate Cyber Flight Badge Canvas Image
  const handleDownloadBadge = () => {
    setIsGeneratingBadge(true);
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
      const cleanCallsign = userCallsign && !userCallsign.toLowerCase().startsWith('pilot_00') && !userCallsign.toLowerCase().startsWith('guest_')
        ? userCallsign.toUpperCase()
        : 'PILOT';

      // 1. Background Fill
      ctx.fillStyle = '#060a07';
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle Cyber Grid Lines
      ctx.strokeStyle = 'rgba(72, 255, 72, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 630);
        ctx.stroke();
      }
      for (let y = 0; y < 630; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }

      // Outer Glow Neon Border
      ctx.strokeStyle = '#48ff48';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#48ff48';
      ctx.shadowBlur = 18;
      ctx.strokeRect(28, 28, 1200 - 56, 630 - 56);
      ctx.shadowBlur = 0; // reset

      // Cyber Corner Crosshairs
      const drawCross = (cx: number, cy: number) => {
        ctx.strokeStyle = '#48ff48';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx + 12, cy);
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx, cy + 12);
        ctx.stroke();
      };
      drawCross(50, 50);
      drawCross(1200 - 50, 50);
      drawCross(50, 630 - 50);
      drawCross(1200 - 50, 630 - 50);

      // 2. Top Header Telemetry
      ctx.fillStyle = '#48ff48';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('ORBIT.SYS // MISSION TELEMETRY LOG', 70, 75);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '16px monospace';
      ctx.fillText(`SECTOR DATE: ${dateStr} • UPLINK: VERIFIED`, 70, 105);

      // 3. Central Brand & Pilot Identity
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px monospace';
      ctx.fillText('ORBITO // DAILY RADAR', 70, 175);

      ctx.fillStyle = '#48ff48';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`CMDR ${cleanCallsign} [${isForfeited ? 'MIA' : efficiencyRating}]`, 70, 215);

      // 4. Metrics Stats Cards (Score, Probes, Status)
      const drawStatBox = (x: number, y: number, w: number, h: number, label: string, val: string, sub: string) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(72, 255, 72, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(label, x + 16, y + 28);

        ctx.fillStyle = '#48ff48';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(val, x + 16, y + 74);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '12px monospace';
        ctx.fillText(sub, x + 16, y + 102);
      };

      drawStatBox(70, 250, 180, 120, 'FINAL CREDITS', isForfeited ? '0 CR' : `${finalScore} CR`, isForfeited ? 'SURRENDER' : 'REGISTERED');
      drawStatBox(270, 250, 180, 120, 'PROBES LAUNCHED', `${guessesCount}`, `${guessesCount} BURSTS`);
      drawStatBox(470, 250, 180, 120, 'ORBIT STATUS', isForfeited ? 'MIA' : '100% LOCK', isForfeited ? 'SIGNAL LOST' : 'DECODED');

      // 5. Visual Signal Progression Track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('SIGNAL PROXIMITY TRAJECTORY:', 70, 420);

      const trackGuesses = guesses.slice(0, 6);
      const startX = 70;
      const startY = 440;
      const barWidth = 90;
      const barSpacing = 16;

      if (trackGuesses.length > 0) {
        trackGuesses.forEach((g, i) => {
          const x = startX + i * (barWidth + barSpacing);
          const sim = g.similarityScore || (g.rank === 1 ? 1.0 : 0.1);
          const pct = Math.round(sim * 100);

          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(x, startY, barWidth, 60);
          ctx.strokeStyle = g.rank === 1 ? '#48ff48' : sim >= 0.7 ? '#22c55e' : sim >= 0.4 ? '#eab308' : '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, startY, barWidth, 60);

          // Fill bar
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(x + 4, startY + 60 - Math.max(8, (sim * 52)), barWidth - 8, Math.max(8, (sim * 52)));

          // Label
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`P${i + 1}: ${pct}%`, x + 10, startY + 80);
        });
      } else {
        ctx.fillStyle = '#48ff48';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('🎯 DIRECT 100% ORBITAL LOCK ACHIEVED ON FIRST PROBE', 70, 465);
      }

      // 6. Right Side Graphic: Holographic Sonar Radar
      const radarCenterX = 980;
      const radarCenterY = 315;
      const maxRadius = 180;

      // Concentric circles
      for (let r = 40; r <= maxRadius; r += 45) {
        ctx.strokeStyle = 'rgba(72, 255, 72, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(radarCenterX, radarCenterY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radar Crosshair Lines
      ctx.strokeStyle = 'rgba(72, 255, 72, 0.3)';
      ctx.beginPath();
      ctx.moveTo(radarCenterX - maxRadius, radarCenterY);
      ctx.lineTo(radarCenterX + maxRadius, radarCenterY);
      ctx.moveTo(radarCenterX, radarCenterY - maxRadius);
      ctx.lineTo(radarCenterX, radarCenterY + maxRadius);
      ctx.stroke();

      // Radar Center Target
      ctx.fillStyle = isForfeited ? '#ef4444' : '#48ff48';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(radarCenterX, radarCenterY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Radar Sweep Arc
      const sweepGradient = ctx.createRadialGradient(radarCenterX, radarCenterY, 0, radarCenterX, radarCenterY, maxRadius);
      sweepGradient.addColorStop(0, 'rgba(72, 255, 72, 0.35)');
      sweepGradient.addColorStop(1, 'rgba(72, 255, 72, 0.0)');
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(radarCenterX, radarCenterY);
      ctx.arc(radarCenterX, radarCenterY, maxRadius, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();

      // Radar Ring Legend
      ctx.fillStyle = 'rgba(72, 255, 72, 0.7)';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('RADAR SCAN: 360°', radarCenterX - 55, radarCenterY + maxRadius + 30);

      // 7. Footer Watermark
      ctx.fillStyle = '#48ff48';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('INTERCEPT THE DAILY COORDINATE → ORBITO.SITE', 70, 580);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '13px monospace';
      ctx.fillText('POWERED BY ORBITO TELEMETRY PROTOCOL', 780, 580);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `orbito-mission-${dateStr}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setBadgeDownloaded(true);
      setTimeout(() => setBadgeDownloaded(false), 3000);
    } catch (err) {
      console.error('Badge generation error:', err);
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  return (
    <div className="w-full bg-[#080d09] border border-primary/40 p-4 font-mono shadow-[0_0_25px_rgba(72,255,72,0.1)] text-left">
      {/* Hidden Canvas for High-Res PNG Generator */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Terminal Title Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-primary/20 mb-3 text-[10px]">
        <span className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          MISSION DEBRIEF // TELEMETRY LOG
        </span>
        <span className="text-white/40 uppercase tracking-widest text-[9px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
          VIRAL SHARE READY
        </span>
      </div>

      {/* Cyber Text Preview Container */}
      <div className="bg-black/90 border border-primary/30 p-3 mb-3 relative group">
        <pre className="text-[11px] sm:text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed select-all">
          {shareText}
        </pre>
        <button
          onClick={handleCopy}
          title="Copy Telemetry"
          className="absolute top-2 right-2 p-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-bold"
        >
          {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'COPIED!' : 'COPY'}</span>
        </button>
      </div>

      {/* Quick Action Share Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="py-2.5 px-2 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer text-[11px]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="truncate">{copied ? 'COPIED!' : 'COPY LOG'}</span>
        </button>

        {/* Share to X (Twitter) */}
        <button
          onClick={handleShareX}
          className="py-2.5 px-2 bg-black hover:bg-[#111] text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/30 cursor-pointer text-[11px] shadow-sm hover:border-primary/60"
        >
          <span className="font-black text-sm">𝕏</span>
          <span className="truncate">POST ON 𝕏</span>
        </button>

        {/* Share to WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          className="py-2.5 px-2 bg-[#064e3b]/80 hover:bg-[#065f46] text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#10b981]/50 cursor-pointer text-[11px]"
        >
          <Send className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="truncate">WHATSAPP</span>
        </button>

        {/* Download PNG Badge */}
        <button
          onClick={handleDownloadBadge}
          disabled={isGeneratingBadge}
          className="py-2.5 px-2 bg-primary/20 hover:bg-primary text-primary hover:text-black font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-primary cursor-pointer text-[11px] shadow-[0_0_12px_rgba(72,255,72,0.25)]"
        >
          {badgeDownloaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="truncate">SAVED!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span className="truncate">{isGeneratingBadge ? 'DRAWING...' : 'PNG BADGE'}</span>
            </>
          )}
        </button>
      </div>

      {/* Native Mobile Share fallback if available */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <div className="mt-2 pt-2 border-t border-white/10 text-center">
          <button
            onClick={handleNativeShare}
            className="text-[10px] text-primary/80 hover:text-primary underline cursor-pointer transition-colors uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
          >
            <Share2 className="w-3 h-3" />
            <span>Open System Share Sheet (AirDrop, Messages, Stories)</span>
          </button>
        </div>
      )}
    </div>
  );
};
