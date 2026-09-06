import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { Copy, Check, Download, Send, Terminal, Sparkles } from 'lucide-react';
import { type Guess } from '../types/game';
import { generateShareText } from '../utils/shareTelemetry';

export type BadgeThemeId = 'tactical' | 'synthwave' | 'quantum';

interface BadgeThemeConfig {
  id: BadgeThemeId;
  name: string;
  tag: string;
  spec: string;
  accentColor: string;
  secondaryColor: string;
  bgAsset: string;
}

const BADGE_THEMES: BadgeThemeConfig[] = [
  {
    id: 'tactical',
    name: 'TACTICAL DOGE',
    tag: 'SPEC-01',
    spec: 'Phosphor Green HUD',
    accentColor: '#48ff48',
    secondaryColor: '#10b981',
    bgAsset: '/badges/tactical_doge.png',
  },
  {
    id: 'synthwave',
    name: 'CYBER SYNTH',
    tag: 'SPEC-02',
    spec: 'Magenta / Cyan Shiba',
    accentColor: '#FF007F',
    secondaryColor: '#00F5FF',
    bgAsset: '/badges/synthwave_doge.png',
  },
  {
    id: 'quantum',
    name: 'QUANTUM CAT',
    tag: 'SPEC-03',
    spec: 'Cobalt / Ruby Astronaut',
    accentColor: '#00D5FF',
    secondaryColor: '#FF003C',
    bgAsset: '/badges/quantum_cat.png',
  },
];

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
  const [selectedTheme, setSelectedTheme] = useState<BadgeThemeId>(() => {
    try {
      const saved = localStorage.getItem('orbito_badge_theme') as BadgeThemeId;
      if (saved && ['tactical', 'synthwave', 'quantum'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'tactical';
  });
  const [badgePreviewUrl, setBadgePreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const currentTheme = BADGE_THEMES.find((t) => t.id === selectedTheme) || BADGE_THEMES[0];

  const shareText = generateShareText({
    puzzleDate,
    guesses,
    guessesCount,
    finalScore,
    isForfeited,
    userCallsign,
    efficiencyRating,
  });

  // Clean dynamic callsign from user's actual profile (never hardcoded)
  const getDisplayCallsign = useCallback(() => {
    if (!userCallsign) return 'PILOT';
    const trimmed = userCallsign.trim();
    if (trimmed.toLowerCase().startsWith('pilot_00') || trimmed.toLowerCase().startsWith('guest_')) {
      return 'PILOT';
    }
    return trimmed.toUpperCase().replace(/\s+/g, '_');
  }, [userCallsign]);

  // Preload high-res badge artwork
  useEffect(() => {
    BADGE_THEMES.forEach((t) => {
      const existing = imageCacheRef.current.get(t.bgAsset);
      if (existing && existing.complete && existing.naturalWidth > 0) {
        if (t.id === selectedTheme) {
          renderBadge(t);
        }
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCacheRef.current.set(t.bgAsset, img);
        if (t.id === selectedTheme) {
          renderBadge(t);
        }
      };
      img.onerror = () => {
        console.warn(`Badge asset could not be loaded: ${t.bgAsset}`);
      };
      img.src = t.bgAsset;

      if (img.complete && img.naturalWidth > 0) {
        imageCacheRef.current.set(t.bgAsset, img);
        if (t.id === selectedTheme) {
          renderBadge(t);
        }
      }
    });
  }, [selectedTheme]);

  // Render the badge artwork and dynamically personalize with real user name and stats
  const renderBadge = useCallback((theme: BadgeThemeConfig): string | null => {
    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1376;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
      const pilotName = getDisplayCallsign();
      const cachedImg = imageCacheRef.current.get(theme.bgAsset);

      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        // 1. Draw the high-detail artwork base (Doge / Cat astronaut)
        ctx.drawImage(cachedImg, 0, 0, 1376, 768);

        // 2. Personalize depending on the theme layout
        if (theme.id === 'tactical') {
          // --- TACTICAL DOGE OVERLAY ---
          // A) Cover subtitle with pilot's real name
          ctx.fillStyle = '#050a06';
          ctx.fillRect(65, 148, 560, 32);
          ctx.fillStyle = '#48ff48';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(`CMDR ${pilotName} [${isForfeited ? 'MIA' : efficiencyRating}]`, 70, 172);

          // B) Stat Card 1: Final Credits
          ctx.fillStyle = '#060d08';
          ctx.fillRect(66, 218, 195, 122);
          ctx.strokeStyle = '#48ff4870';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(66, 218, 195, 122);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('FINAL CREDITS:', 80, 246);
          ctx.fillStyle = isForfeited ? '#EF4444' : '#48ff48';
          ctx.font = 'bold 36px monospace';
          ctx.fillText(isForfeited ? '0 CR' : `${finalScore} CR`, 80, 292);
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '12px monospace';
          ctx.fillText(isForfeited ? '[FORFEITED]' : '[REGISTERED]', 80, 322);

          // C) Stat Card 2: Probes Launched
          ctx.fillStyle = '#060d08';
          ctx.fillRect(276, 218, 195, 122);
          ctx.strokeStyle = '#48ff4870';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(276, 218, 195, 122);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('PROBES LAUNCHED:', 290, 246);
          ctx.fillStyle = '#48ff48';
          ctx.font = 'bold 36px monospace';
          ctx.fillText(`${guessesCount}`, 290, 292);
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '12px monospace';
          ctx.fillText(`[${guessesCount} BURSTS]`, 290, 322);

          // D) Stat Card 3: Orbit Status
          ctx.fillStyle = '#060d08';
          ctx.fillRect(486, 218, 195, 122);
          ctx.strokeStyle = '#48ff4870';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(486, 218, 195, 122);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('ORBIT STATUS:', 500, 246);
          ctx.fillStyle = isForfeited ? '#EF4444' : '#48ff48';
          ctx.font = 'bold 32px monospace';
          ctx.fillText(isForfeited ? 'MIA' : '100% LOCK', 500, 292);
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.font = '12px monospace';
          ctx.fillText(isForfeited ? '[SIGNAL LOST]' : '[DECODED]', 500, 322);

          // E) Top sector date
          ctx.fillStyle = '#050a06';
          ctx.fillRect(740, 32, 530, 28);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`SECTOR DATE: ${dateStr} • UPLINK: VERIFIED [ENCRYPTED]`, 745, 52);

          // F) Cover bottom URL strip with updated Vercel URL
          ctx.fillStyle = '#050a06';
          ctx.fillRect(65, 710, 800, 32);
          ctx.fillStyle = '#48ff48';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('+ INTERCEPT THE DAILY COORDINATE -> https://orbit-o-sigma.vercel.app/', 70, 730);

        } else if (theme.id === 'quantum') {
          // --- QUANTUM CAT OVERLAY ---
          // A) Cover subtitle with pilot's real name
          ctx.fillStyle = '#040912';
          ctx.fillRect(62, 146, 560, 32);
          ctx.fillStyle = '#00F5FF';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(`CMDR ${pilotName} [${isForfeited ? 'MIA' : efficiencyRating}]`, 68, 170);

          // B) Stacked Stat Cards on left
          const drawCatCard = (y: number, title: string, value: string, isAlert = false) => {
            ctx.fillStyle = '#050d18';
            ctx.fillRect(64, y, 195, 58);
            ctx.strokeStyle = '#00D5FF60';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(64, y, 195, 58);

            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(title, 76, y + 22);

            ctx.fillStyle = isAlert ? '#FF003C' : '#00F5FF';
            ctx.font = 'bold 15px monospace';
            ctx.fillText(value, 76, y + 46);
          };

          drawCatCard(208, 'SECTOR DATE:', `${dateStr}`);
          drawCatCard(278, 'FINAL CREDITS:', isForfeited ? '0 CR [FORFEITED]' : `${finalScore} CR`, isForfeited);
          drawCatCard(348, 'PROBES DEPLOYED:', `${guessesCount} BURSTS`);
          drawCatCard(418, 'ORBIT LOCK:', isForfeited ? 'MIA [SIGNAL LOST]' : '100% [VERIFIED]', isForfeited);

          // C) Cover bottom URL strip with updated Vercel URL
          ctx.fillStyle = '#050d18';
          ctx.fillRect(64, 706, 800, 30);
          ctx.fillStyle = '#00D5FF';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('+ INTERCEPT THE DAILY COORDINATE -> https://orbit-o-sigma.vercel.app/', 70, 726);

        } else if (theme.id === 'synthwave') {
          // --- CYBER SYNTH SHIBA OVERLAY ---
          // A) Cover subtitle in top-center box
          ctx.fillStyle = '#10081c';
          ctx.fillRect(425, 78, 510, 30);
          ctx.fillStyle = '#00F5FF';
          ctx.font = 'bold 19px monospace';
          ctx.fillText(`CMDR ${pilotName} [${isForfeited ? 'MIA' : efficiencyRating}]`, 440, 100);

          // B) Center stats card
          ctx.fillStyle = '#0e0618';
          ctx.fillRect(530, 126, 320, 118);
          ctx.strokeStyle = '#FF007F70';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(530, 126, 320, 118);

          ctx.fillStyle = isForfeited ? '#FF007F' : '#00F5FF';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(`CREDITS: ${isForfeited ? '0 CR' : `${finalScore} CR`}`, 550, 156);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`PROBES: ${guessesCount} DEPLOYED`, 550, 190);

          ctx.fillStyle = isForfeited ? '#EF4444' : '#FF007F';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`ORBIT LOCK: ${isForfeited ? 'FORFEITED / MIA' : '100%'}`, 550, 224);

          // C) Cover bottom URL strip with updated Vercel URL
          ctx.fillStyle = '#090514';
          ctx.fillRect(80, 705, 1216, 48);
          ctx.fillStyle = '#00F5FF';
          ctx.font = 'bold 14px monospace';
          ctx.fillText('+ INTERCEPT THE DAILY COORDINATE -> https://orbit-o-sigma.vercel.app/', 360, 735);
        }
      } else {
        // High-tech procedural fallback while image loads
        ctx.fillStyle = '#050a06';
        ctx.fillRect(0, 0, 1376, 768);
        ctx.fillStyle = '#48ff48';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('SYNCHRONIZING BADGE TELEMETRY...', 400, 380);
      }

      const dataUrl = canvas.toDataURL('image/png');
      setBadgePreviewUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Badge rendering error:', err);
      return null;
    }
  }, [puzzleDate, userCallsign, isForfeited, efficiencyRating, finalScore, guessesCount, getDisplayCallsign]);

  // Re-render when theme or props change
  useEffect(() => {
    renderBadge(currentTheme);
  }, [selectedTheme, renderBadge, currentTheme]);

  const handleSelectTheme = (themeId: BadgeThemeId) => {
    setSelectedTheme(themeId);
    try {
      localStorage.setItem('orbito_badge_theme', themeId);
    } catch {}
  };

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


  // Direct WhatsApp text debrief handler
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadBadge = () => {
    setIsGeneratingBadge(true);
    try {
      const dataUrl = badgePreviewUrl || renderBadge(currentTheme);
      if (!dataUrl) return;

      const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `orbito-${selectedTheme}-badge-${dateStr}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setBadgeDownloaded(true);
      setTimeout(() => setBadgeDownloaded(false), 3000);
    } catch (err) {
      console.error('Badge download error:', err);
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  const isAlertMode = isForfeited;
  const cardBorderClass = isAlertMode ? 'border-[#EF4444]/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]' : 'border-primary/40 shadow-[0_0_25px_rgba(72,255,72,0.1)]';
  const headerTextClass = isAlertMode ? 'text-[#EF4444]' : 'text-primary';
  const badgeDownloadBtnClass = isAlertMode
    ? 'bg-[#EF4444] hover:bg-white text-black border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    : 'bg-primary hover:bg-white text-black border-primary shadow-[0_0_15px_rgba(72,255,72,0.35)]';

  return (
    <div className={`w-full bg-[#070b08] border ${cardBorderClass} p-3 sm:p-4 font-mono text-left`}>
      {/* Hidden Canvas for High-Res PNG Generator */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Terminal Title Strip */}
      <div className={`flex items-center justify-between pb-2 border-b ${isAlertMode ? 'border-[#EF4444]/20' : 'border-primary/20'} mb-3 text-[10px]`}>
        <span className={`flex items-center gap-1.5 ${headerTextClass} font-bold uppercase tracking-wider`}>
          <Terminal className="w-3.5 h-3.5" />
          MISSION TELEMETRY LOG
        </span>
        <span className="text-white/40 uppercase tracking-widest text-[9px] flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isAlertMode ? 'bg-[#EF4444]' : 'bg-primary'} animate-ping`}></span>
          OFFICIAL FLIGHT BADGE
        </span>
      </div>

      {/* 3 Badge Theme Specifications Switcher */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-white/60 mb-1.5 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Sparkles className={`w-3 h-3 ${isAlertMode ? 'text-[#EF4444]' : 'text-primary'}`} />
            SELECT BADGE SPECIFICATION:
          </span>
          <span className="font-bold" style={{ color: currentTheme.accentColor }}>
            {currentTheme.name} [{currentTheme.tag}]
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
          {BADGE_THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`py-2.5 px-2 border transition-all cursor-pointer flex items-center justify-center min-w-0 ${
                  isSelected
                    ? 'bg-black/90 font-black shadow-lg scale-[1.02]'
                    : 'border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/30'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: theme.accentColor,
                        boxShadow: `0 0 14px ${theme.accentColor}40`,
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-1.5 truncate w-full justify-center">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span
                    className="truncate font-bold text-[10px] sm:text-[11px]"
                    style={{ color: isSelected ? theme.accentColor : undefined }}
                  >
                    {theme.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual PNG Flight Badge Preview */}
      <div className={`relative border ${isAlertMode ? 'border-[#EF4444]/40' : 'border-primary/40'} bg-black/95 p-1 sm:p-1.5 shadow-[0_0_25px_rgba(0,0,0,0.8)] mb-3 overflow-hidden group rounded-sm`}>
        {badgePreviewUrl ? (
          <img
            src={badgePreviewUrl}
            alt="Official Flight Badge"
            className="w-full h-auto max-h-[340px] object-contain border border-white/10 shadow-md transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="h-44 flex items-center justify-center text-primary/70 font-mono text-xs animate-pulse">
            CALIBRATING MISSION FLIGHT BADGE...
          </div>
        )}
      </div>

      {/* Quick Action Share Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Download PNG Badge */}
        <button
          onClick={handleDownloadBadge}
          disabled={isGeneratingBadge}
          className={`py-2.5 px-2 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer text-[11px] ${badgeDownloadBtnClass}`}
        >
          {badgeDownloaded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="truncate">SAVED!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span className="truncate">{isGeneratingBadge ? 'SAVING...' : 'PNG BADGE'}</span>
            </>
          )}
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="py-2.5 px-2 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer text-[11px]"
        >
          {copied ? <Check className={`w-3.5 h-3.5 ${headerTextClass}`} /> : <Copy className="w-3.5 h-3.5" />}
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

        {/* Share to WhatsApp (Text Debrief) */}
        <button
          onClick={handleShareWhatsApp}
          className="py-2.5 px-2 bg-[#064e3b]/90 hover:bg-[#065f46] text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#10b981]/50 cursor-pointer text-[11px] shadow-sm"
          title="Share flight debrief directly to WhatsApp"
        >
          <Send className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="truncate">WHATSAPP</span>
        </button>
      </div>
    </div>
  );
};
