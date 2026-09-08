import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { Copy, Check, Download, Send, Terminal, Sparkles, Smartphone, Monitor } from 'lucide-react';
import { type Guess } from '../types/game';
import { generateShareText } from '../utils/shareTelemetry';

export type BadgeThemeId = 'alien' | 'doge' | 'cat' | 'pepe' | 'station';
export type CardFormat = 'wide' | 'story';

export interface BadgeThemeConfig {
  id: BadgeThemeId;
  name: string;
  tag: string;
  role: string;
  spec: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  bgAsset: string;
}

export const BADGE_THEMES: BadgeThemeConfig[] = [
  {
    id: 'alien',
    name: 'CYBER ALIEN',
    tag: 'ROAST-01',
    role: 'AI Roast Interrogator',
    spec: 'Alien Neural Overseer',
    accentColor: '#48ff48',
    secondaryColor: '#10b981',
    glowColor: 'rgba(72, 255, 72, 0.45)',
    bgAsset: '/alien_holding_roast_box.jpg',
  },
  {
    id: 'doge',
    name: 'CYBER DOGE',
    tag: 'VICTORY-02',
    role: 'Chief Orbit Champion',
    spec: 'Tesseract Orbit Champion',
    accentColor: '#38bdf8',
    secondaryColor: '#48ff48',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    bgAsset: '/doge_holding_victory_box.jpg',
  },
  {
    id: 'cat',
    name: 'QUANTUM CAT',
    tag: 'CIPHER-03',
    role: 'Deep Signal Specialist',
    spec: 'Robotic Tail Decryptor',
    accentColor: '#c084fc',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    bgAsset: '/cat_holding_hint_decryptor.jpg',
  },
  {
    id: 'pepe',
    name: 'CYBER PEPE',
    tag: 'ABORT-04',
    role: 'Deep Void Sentry',
    spec: 'Mission Abort & Savage Unit',
    accentColor: '#ef4444',
    secondaryColor: '#f97316',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    bgAsset: '/pepe_holding_forfeit_box.jpg',
  },
  {
    id: 'station',
    name: 'SOLAR STATION',
    tag: 'RELAY-05',
    role: 'Array Maintenance Cat',
    spec: 'Sub-Light Solar Engineer',
    accentColor: '#facc15',
    secondaryColor: '#22c55e',
    glowColor: 'rgba(250, 204, 21, 0.45)',
    bgAsset: '/cyber_cat_satellite.jpg',
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
  aiRoast?: string | null;
  targetWord?: string;
}

const GAME_NAME = 'orbitO';
const GAME_URL = 'https://orbit-o-sigma.vercel.app/';

// Clean Instagram camera icon SVG
const InstagramIcon: FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

// Helper: Convert hex color to rgba string
function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper: draw an image clipped into rounded rectangle with cover aspect ratio
function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.clip();

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sWidth = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sWidth) / 2;
  } else {
    sHeight = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  ctx.restore();
}

// Helper: wrap text cleanly within maximum bounds with ellipsis
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 5
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      if (lineCount >= maxLines - 1) {
        ctx.fillText(`${line}...`, x, currentY);
        return currentY;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
  }
  return currentY;
}

export const ShareFlightCard: FC<ShareFlightCardProps> = ({
  puzzleDate,
  guesses = [],
  guessesCount,
  finalScore,
  isForfeited = false,
  userCallsign,
  efficiencyRating,
  aiRoast,
  targetWord,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);
  const [badgeDownloaded, setBadgeDownloaded] = useState(false);
  const [storyShared, setStoryShared] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // RADAR (16:9) IS DEFAULT AS REQUESTED
  const [cardFormat, setCardFormat] = useState<CardFormat>('wide');

  const [selectedTheme, setSelectedTheme] = useState<BadgeThemeId>(() => {
    try {
      const saved = localStorage.getItem('orbito_custom_badge_theme') as BadgeThemeId;
      if (saved && ['alien', 'doge', 'cat', 'pepe', 'station'].includes(saved)) {
        return saved;
      }
    } catch {}
    return isForfeited ? 'pepe' : 'alien';
  });

  const [badgePreviewUrl, setBadgePreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const currentTheme = BADGE_THEMES.find((t) => t.id === selectedTheme) || BADGE_THEMES[0];

  // Clean dynamic callsign from user's actual profile
  const getDisplayCallsign = useCallback(() => {
    if (!userCallsign) return 'PILOT';
    const trimmed = userCallsign.trim();
    if (trimmed.toLowerCase().startsWith('pilot_00') || trimmed.toLowerCase().startsWith('guest_')) {
      return 'PILOT';
    }
    return trimmed.toUpperCase().replace(/\s+/g, '_');
  }, [userCallsign]);

  // Compute clean AI roast text or dynamic witty fallback
  const getEffectiveRoast = useCallback(() => {
    const pilot = getDisplayCallsign();
    if (aiRoast && typeof aiRoast === 'string' && aiRoast.trim().length > 0) {
      return aiRoast
        .trim()
        .replace(/^["'“]|["'”]$/g, '')
        .replace(/Pilot_0000[0-9a-zA-Z]*/gi, `CMDR ${pilot}`)
        .replace(/pilot_[a-z0-9]{8,}/gi, `CMDR ${pilot}`)
        .replace(/guest_[a-z0-9]{8,}/gi, `CMDR ${pilot}`);
    }

    if (isForfeited) {
      return `Fired ${guessesCount} blind probes into cosmic void. Coordinate lost in deep space. Ship safely ejected.`;
    }
    if (finalScore >= 950) {
      return `Flawless orbital interception! Locked target in ${guessesCount} probes with ${finalScore} credits. Pure mathematical brilliance.`;
    }
    if (finalScore >= 750) {
      return `Target acquired in ${guessesCount} probes. Minor telemetry drift, but orbital trajectory was solid. Reliable navigation, Commander.`;
    }
    return `Expended ${guessesCount} probes circling the coordinate. Thruster fuel running on fumes, but locked in with ${finalScore} credits!`;
  }, [aiRoast, isForfeited, guessesCount, finalScore, getDisplayCallsign]);

  const shareText = generateShareText({
    puzzleDate,
    guesses,
    guessesCount,
    finalScore,
    isForfeited,
    userCallsign,
    efficiencyRating,
    aiRoast: getEffectiveRoast(),
  });

  // Preload all high-res character artwork assets
  useEffect(() => {
    BADGE_THEMES.forEach((t) => {
      const existing = imageCacheRef.current.get(t.bgAsset);
      if (existing && existing.complete && existing.naturalWidth > 0) {
        if (t.id === selectedTheme) {
          renderBadge(t, cardFormat);
        }
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCacheRef.current.set(t.bgAsset, img);
        if (t.id === selectedTheme) {
          renderBadge(t, cardFormat);
        }
      };
      img.onerror = () => {
        console.warn(`Badge asset could not be loaded: ${t.bgAsset}`);
      };
      img.src = t.bgAsset;

      if (img.complete && img.naturalWidth > 0) {
        imageCacheRef.current.set(t.bgAsset, img);
        if (t.id === selectedTheme) {
          renderBadge(t, cardFormat);
        }
      }
    });
  }, [selectedTheme, cardFormat]);

  // Helper to draw a styled cyber HUD panel with neon border & 4 corner ticks
  const drawHUDPanel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    accentColor: string,
    fillColor: string = 'rgba(4, 9, 15, 0.92)',
    tickSize: number = 10,
    radius: number = 8
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Neon border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 4 Corner ticks
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y + tickSize); ctx.lineTo(x, y); ctx.lineTo(x + tickSize, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - tickSize, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + tickSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h - tickSize); ctx.lineTo(x, y + h); ctx.lineTo(x + tickSize, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - tickSize, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - tickSize); ctx.stroke();

    ctx.restore();
  };

  // Render the flight badge artwork dynamically
  const renderBadge = useCallback(
    (theme: BadgeThemeConfig, format: CardFormat = cardFormat): string | null => {
      try {
        const canvas = canvasRef.current || document.createElement('canvas');
        const isStory = format === 'story';
        const width = isStory ? 1080 : 1920;
        const height = isStory ? 1920 : 1080;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
        const pilotName = getDisplayCallsign();
        const effectiveRoast = getEffectiveRoast();
        const cachedImg = imageCacheRef.current.get(theme.bgAsset);

        // 1. Cosmic Deep Space Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020407');
        bgGrad.addColorStop(0.25, '#040b12');
        bgGrad.addColorStop(0.5, '#050d16');
        bgGrad.addColorStop(0.75, '#040911');
        bgGrad.addColorStop(1, '#020406');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient radial glow behind character
        const glowCenterX = isStory ? width / 2 : 500;
        const glowCenterY = isStory ? 680 : 540;
        const glowRad = ctx.createRadialGradient(glowCenterX, glowCenterY, 80, glowCenterX, glowCenterY, isStory ? 750 : 650);
        glowRad.addColorStop(0, hexToRgba(theme.accentColor, 0.22));
        glowRad.addColorStop(0.45, hexToRgba(theme.secondaryColor, 0.08));
        glowRad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowRad;
        ctx.fillRect(0, 0, width, height);

        // Cyberpunk Cartesian Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 1;
        const gridStep = 60;
        for (let gx = 0; gx <= width; gx += gridStep) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
        }
        for (let gy = 0; gy <= height; gy += gridStep) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
        }

        // Deterministic starry background
        for (let i = 0; i < 90; i++) {
          const sx = (i * 7919 + 1013) % width;
          const sy = (i * 6271 + 2017) % height;
          const size = i % 7 === 0 ? 2.6 : 1.2;
          const alpha = 0.15 + ((i % 8) / 10);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();

          if (i % 14 === 0) {
            ctx.strokeStyle = hexToRgba(theme.accentColor, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy);
            ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
            ctx.stroke();
          }
        }

        // Outer Bounding Frame
        const outerMargin = 30;
        ctx.strokeStyle = hexToRgba(theme.accentColor, 0.28);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(outerMargin, outerMargin, width - 2 * outerMargin, height - 2 * outerMargin);

        // 4 Corner High-Tech Brackets
        const bracketSize = 36;
        ctx.strokeStyle = theme.accentColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(outerMargin, outerMargin + bracketSize); ctx.lineTo(outerMargin, outerMargin); ctx.lineTo(outerMargin + bracketSize, outerMargin); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width - outerMargin - bracketSize, outerMargin); ctx.lineTo(width - outerMargin, outerMargin); ctx.lineTo(width - outerMargin, outerMargin + bracketSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(outerMargin, height - outerMargin - bracketSize); ctx.lineTo(outerMargin, height - outerMargin); ctx.lineTo(outerMargin + bracketSize, height - outerMargin); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(width - outerMargin - bracketSize, height - outerMargin); ctx.lineTo(width - outerMargin, height - outerMargin); ctx.lineTo(width - outerMargin, height - outerMargin - bracketSize); ctx.stroke();

        // ════════════════════════════════════════════════════════════════════
        // FORMAT A: WIDE RADAR (16:9 - 1920 x 1080) - DEFAULT!
        // ════════════════════════════════════════════════════════════════════
        if (!isStory) {
          // 1. TOP BRAND STRIP: GAME NAME + PROMINENT LINK (y: 50 - 130)
          drawHUDPanel(ctx, 55, 50, 1810, 80, theme.accentColor, 'rgba(3, 8, 14, 0.95)', 12, 8);

          // Game Logo: "orbitO"
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 44px monospace';
          ctx.fillText(GAME_NAME, 80, 106);

          // Glowing neon dot next to orbitO
          const logoW = ctx.measureText(GAME_NAME).width;
          ctx.fillStyle = theme.accentColor;
          ctx.beginPath();
          ctx.arc(80 + logoW + 12, 94, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = hexToRgba(theme.accentColor, 0.9);
          ctx.font = 'bold 13px monospace';
          ctx.fillText('DAILY SEMANTIC RADAR', 80 + logoW + 28, 102);

          // Game Link Box in Center
          const linkBoxX = 760;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(linkBoxX, 64, 520, 52);
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(linkBoxX, 64, 520, 52);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`PLAY: ${GAME_URL}`, linkBoxX + 22, 96);

          // Sector & Uplink Status on Right
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`SECTOR: ${dateStr}`, 1340, 96);
          ctx.fillStyle = theme.accentColor;
          ctx.fillText('● UPLINK: VERIFIED', 1620, 96);

          // 2. LEFT HERO COLUMN: Character Artwork (x: 55, y: 145, w: 840, h: 875)
          const imgX = 55;
          const imgY = 145;
          const imgW = 840;
          const imgH = 875;

          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            drawRoundedImage(ctx, cachedImg, imgX, imgY, imgW, imgH, 16);

            // Bottom vignette
            const vig = ctx.createLinearGradient(imgX, imgY + imgH - 240, imgX, imgY + imgH);
            vig.addColorStop(0, 'rgba(2, 6, 12, 0)');
            vig.addColorStop(1, 'rgba(2, 6, 12, 0.95)');
            ctx.fillStyle = vig;
            ctx.fillRect(imgX, imgY + imgH - 240, imgW, 240);

            // Border & ticks
            ctx.strokeStyle = theme.accentColor;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
          } else {
            drawHUDPanel(ctx, imgX, imgY, imgW, imgH, theme.accentColor, 'rgba(4, 10, 18, 0.95)');
          }

          // Top badge tag overlay on character image
          ctx.fillStyle = 'rgba(2, 6, 12, 0.9)';
          ctx.fillRect(imgX + 20, imgY + 20, 440, 42);
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(imgX + 20, imgY + 20, 440, 42);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`UNIT: ${theme.name} [${theme.tag}]`, imgX + 36, imgY + 46);

          // Bottom target tag on image
          ctx.fillStyle = 'rgba(2, 6, 12, 0.92)';
          ctx.fillRect(imgX + 20, imgY + imgH - 60, 520, 42);
          ctx.strokeStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(imgX + 20, imgY + imgH - 60, 520, 42);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText(
            isForfeited ? '⌖ RADAR STATUS: MISSION ABORTED' : `⌖ TARGET ACQUIRED: ${targetWord ? targetWord.toUpperCase() : 'COORDINATE LOCKED'}`,
            imgX + 36,
            imgY + imgH - 34
          );

          // 3. RIGHT COLUMN: Telemetry Dossier & AI Roast (x: 915, w: 950)
          // Pilot Dossier Header (y: 145 - 265)
          drawHUDPanel(ctx, 915, 145, 950, 120, theme.accentColor, 'rgba(4, 10, 18, 0.95)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`// OFFICIAL ${GAME_NAME.toUpperCase()} PILOT DOSSIER`, 940, 175);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 38px monospace';
          ctx.fillText(`▸ CMDR ${pilotName}`, 940, 218);

          const cW = ctx.measureText(`▸ CMDR ${pilotName}`).width;
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 14px monospace';
          ctx.fillText('[ ✓ VERIFIED PILOT ]', 940 + cW + 16, 218);

          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(
            `STATUS: ${isForfeited ? 'MIA // FORFEIT' : 'ACTIVE IN ORBIT'}  •  RATING: ${efficiencyRating}  •  SPEC: ${theme.tag}`,
            940,
            248
          );

          // Middle Stats Grid (y: 280 - 450)
          const statW = 465;
          const statH = 170;
          // Card 1: Scores
          drawHUDPanel(ctx, 915, 280, statW, statH, theme.accentColor, 'rgba(4, 10, 18, 0.95)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('MISSION CREDITS', 940, 314);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 50px monospace';
          ctx.fillText(isForfeited ? '0 CR' : `${finalScore} CR`, 940, 380);
          ctx.fillStyle = isForfeited ? 'rgba(239, 68, 68, 0.7)' : hexToRgba(theme.accentColor, 0.7);
          ctx.font = 'bold 12px monospace';
          ctx.fillText(isForfeited ? '[ MISSION FAILED ]' : '[ REWARD VERIFIED ]', 940, 424);

          // Card 2: Probes
          drawHUDPanel(ctx, 1400, 280, statW, statH, theme.accentColor, 'rgba(4, 10, 18, 0.95)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('PROBES DEPLOYED', 1425, 314);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 50px monospace';
          ctx.fillText(`${guessesCount} BURSTS`, 1425, 380);
          ctx.fillStyle = isForfeited ? 'rgba(239, 68, 68, 0.7)' : hexToRgba(theme.accentColor, 0.7);
          ctx.font = 'bold 12px monospace';
          ctx.fillText(isForfeited ? '[ LOST IN VOID ]' : '[ 100% ORBIT LOCK ]', 1425, 424);

          // AI Roast Holographic Terminal (y: 465 - 895)
          const roastY = 465;
          const roastH = 430;
          drawHUDPanel(ctx, 915, roastY, 950, roastH, theme.accentColor, 'rgba(3, 8, 14, 0.96)', 14, 12);
          ctx.fillStyle = hexToRgba(theme.accentColor, 0.15);
          ctx.fillRect(916, roastY + 1, 948, 48);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText('// TACTICAL AI DEBRIEF // SECTOR NEURAL ROAST MATRIX', 940, roastY + 30);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 12px monospace';
          ctx.fillText('● TRANSMISSION INTERCEPTED', 1600, roastY + 30);

          // Decorative quote watermark
          ctx.fillStyle = hexToRgba(theme.accentColor, 0.18);
          ctx.font = 'bold 100px serif';
          ctx.fillText('“', 935, roastY + 135);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 24px monospace';
          wrapText(ctx, `"${effectiveRoast}"`, 945, roastY + 120, 890, 42, 6);

          // Terminal footer
          ctx.strokeStyle = hexToRgba(theme.accentColor, 0.25);
          ctx.beginPath(); ctx.moveTo(935, roastY + roastH - 52); ctx.lineTo(1840, roastY + roastH - 52); ctx.stroke();
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText('— ORBITO TACTICAL AI SYSTEM // DEEP SPACE INTELLIGENCE', 945, roastY + roastH - 24);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = '11px monospace';
          ctx.fillText('COGNITIVE TRAJECTORY VERIFIED', 1580, roastY + roastH - 24);

          // Bottom Uplink & Game Link Bar (y: 910 - 1020)
          drawHUDPanel(ctx, 915, 910, 950, 110, theme.accentColor, 'rgba(4, 9, 15, 0.95)', 12, 10);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 17px monospace';
          ctx.fillText(`▸ PLAY LIVE: ${GAME_URL}`, 940, 950);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`SHARE ON INSTAGRAM  •  TAG @ORBITOGAME  •  #${GAME_NAME} #OrbitoDaily`, 940, 988);

        // ════════════════════════════════════════════════════════════════════
        // FORMAT B: INSTAGRAM STORY (9:16 - 1080 x 1920)
        // ════════════════════════════════════════════════════════════════════
        } else {
          // 1. Top Header Bar: Game Name "orbitO" + Link (y: 60 - 155)
          drawHUDPanel(ctx, 60, 60, 960, 95, theme.accentColor, 'rgba(4, 10, 16, 0.95)', 12, 10);

          // Game Logo: "orbitO"
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 44px monospace';
          ctx.fillText(GAME_NAME, 84, 110);

          // Glowing dot
          const storyLogoW = ctx.measureText(GAME_NAME).width;
          ctx.fillStyle = theme.accentColor;
          ctx.beginPath();
          ctx.arc(84 + storyLogoW + 12, 98, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = hexToRgba(theme.accentColor, 0.9);
          ctx.font = 'bold 13px monospace';
          ctx.fillText('DAILY SEMANTIC RADAR', 84 + storyLogoW + 28, 106);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`LINK: ${GAME_URL}`, 84, 138);

          // Top Right Live Pill
          ctx.fillStyle = hexToRgba(theme.accentColor, 0.15);
          ctx.fillRect(800, 78, 200, 36);
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(800, 78, 200, 36);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 11px monospace';
          ctx.fillText('● ENCRYPTED RADAR', 820, 101);

          // 2. Pilot Callsign Dossier Strip (y: 175 - 295)
          drawHUDPanel(ctx, 60, 175, 960, 120, theme.accentColor, 'rgba(4, 12, 20, 0.92)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`// OFFICIAL ${GAME_NAME.toUpperCase()} PILOT IDENTIFICATION`, 82, 204);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px monospace';
          ctx.fillText(`▸ CMDR ${pilotName}`, 82, 248);

          const nameWidth = ctx.measureText(`▸ CMDR ${pilotName}`).width;
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 14px monospace';
          ctx.fillText('[ ✓ VERIFIED ]', 82 + nameWidth + 16, 248);

          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText(
            `STATUS: ${isForfeited ? 'MIA // ABORTED' : 'IN ORBIT'}  •  RATING: ${efficiencyRating}  •  SPEC: ${theme.tag}`,
            82,
            276
          );

          // 3. Hero Character Viewport (y: 315 - 955)
          const imgX = 60;
          const imgY = 315;
          const imgW = 960;
          const imgH = 640;

          if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
            drawRoundedImage(ctx, cachedImg, imgX, imgY, imgW, imgH, 16);

            // Bottom vignette
            ctx.save();
            const vigGrad = ctx.createLinearGradient(imgX, imgY + imgH - 180, imgX, imgY + imgH);
            vigGrad.addColorStop(0, 'rgba(2, 6, 12, 0)');
            vigGrad.addColorStop(1, 'rgba(2, 6, 12, 0.95)');
            ctx.fillStyle = vigGrad;
            ctx.fillRect(imgX, imgY + imgH - 180, imgW, 180);
            ctx.restore();

            ctx.strokeStyle = theme.accentColor;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(imgX, imgY, imgW, imgH);
          } else {
            drawHUDPanel(ctx, imgX, imgY, imgW, imgH, theme.accentColor, 'rgba(5, 12, 20, 0.95)');
          }

          // Badge tag on hero image
          ctx.fillStyle = 'rgba(2, 6, 12, 0.9)';
          ctx.fillRect(imgX + 16, imgY + 16, 400, 38);
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(imgX + 16, imgY + 16, 400, 38);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`UNIT: ${theme.name} [${theme.tag}]`, imgX + 30, imgY + 40);

          // Target coordinate tag on hero image
          ctx.fillStyle = 'rgba(2, 6, 12, 0.9)';
          ctx.fillRect(imgX + 16, imgY + imgH - 52, 480, 38);
          ctx.strokeStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(imgX + 16, imgY + imgH - 52, 480, 38);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(
            isForfeited ? '⌖ RADAR TARGET: FORFEITED' : `⌖ TARGET ACQUIRED: ${targetWord ? targetWord.toUpperCase() : 'COORDINATE DECODED'}`,
            imgX + 30,
            imgY + imgH - 28
          );

          // 4. Telemetry Stats Grid (y: 975 - 1175)
          const cardW = 465;
          const cardH = 190;
          const statY = 975;

          // Box 1: MISSION CREDITS
          drawHUDPanel(ctx, 60, statY, cardW, cardH, theme.accentColor, 'rgba(4, 11, 18, 0.94)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('MISSION CREDITS', 82, statY + 36);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 52px monospace';
          ctx.fillText(isForfeited ? '0 CR' : `${finalScore} CR`, 82, statY + 106);
          ctx.fillStyle = isForfeited ? 'rgba(239, 68, 68, 0.7)' : hexToRgba(theme.accentColor, 0.7);
          ctx.font = 'bold 12px monospace';
          ctx.fillText(isForfeited ? '[ MISSION FAILED ]' : '[ SCORE RECORDED ]', 82, statY + 152);

          // Box 2: PROBES LAUNCHED
          drawHUDPanel(ctx, 555, statY, cardW, cardH, theme.accentColor, 'rgba(4, 11, 18, 0.94)', 12, 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('PROBES LAUNCHED', 577, statY + 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 52px monospace';
          ctx.fillText(`${guessesCount} BURSTS`, 577, statY + 106);
          ctx.fillStyle = isForfeited ? 'rgba(239, 68, 68, 0.7)' : hexToRgba(theme.accentColor, 0.7);
          ctx.font = 'bold 12px monospace';
          ctx.fillText(isForfeited ? '[ VOID TRAJECTORY ]' : '[ 100% ORBIT LOCK ]', 577, statY + 152);

          // 5. AI Roast Terminal (y: 1185 - 1675)
          const roastY = 1185;
          const roastH = 480;
          drawHUDPanel(ctx, 60, roastY, 960, roastH, theme.accentColor, 'rgba(3, 8, 14, 0.96)', 14, 12);
          ctx.fillStyle = hexToRgba(theme.accentColor, 0.14);
          ctx.fillRect(61, roastY + 1, 958, 48);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText('// TACTICAL AI DEBRIEF // SECTOR NEURAL ROAST MATRIX', 86, roastY + 30);
          ctx.fillStyle = isForfeited ? '#ef4444' : theme.accentColor;
          ctx.font = 'bold 12px monospace';
          ctx.fillText('● TRANSMISSION DECODED', 760, roastY + 30);

          ctx.fillStyle = hexToRgba(theme.accentColor, 0.15);
          ctx.font = 'bold 110px serif';
          ctx.fillText('“', 82, roastY + 140);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 24px monospace';
          wrapText(ctx, `"${effectiveRoast}"`, 92, roastY + 130, 875, 42, 6);

          ctx.strokeStyle = hexToRgba(theme.accentColor, 0.25);
          ctx.beginPath(); ctx.moveTo(80, roastY + roastH - 55); ctx.lineTo(1000, roastY + roastH - 55); ctx.stroke();
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 13px monospace';
          ctx.fillText('— ORBITO TACTICAL AI SYSTEM // DEEP SPACE INTELLIGENCE', 92, roastY + roastH - 26);

          // 6. Instagram Story Share & Uplink Bar (y: 1690 - 1860)
          drawHUDPanel(ctx, 60, 1690, 960, 155, theme.accentColor, 'rgba(4, 9, 15, 0.95)', 12, 10);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(`▸ PLAY LIVE: ${GAME_URL}`, 86, 1736);
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`SHARE TO STORY  •  TAG @ORBITOGAME  •  #${GAME_NAME} #OrbitoDaily`, 86, 1780);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = '12px monospace';
          ctx.fillText(`${GAME_NAME} // THE DAILY VECTOR WORD RADAR PUZZLE`, 86, 1818);
        }

        const dataUrl = canvas.toDataURL('image/png');
        setBadgePreviewUrl(dataUrl);
        return dataUrl;
      } catch (err) {
        console.error('Badge rendering error:', err);
        return null;
      }
    },
    [puzzleDate, userCallsign, isForfeited, efficiencyRating, finalScore, guessesCount, targetWord, getDisplayCallsign, getEffectiveRoast, cardFormat]
  );

  // Re-render when theme, format, or props change
  useEffect(() => {
    renderBadge(currentTheme, cardFormat);
  }, [selectedTheme, cardFormat, renderBadge, currentTheme, aiRoast]);

  const handleSelectTheme = (themeId: BadgeThemeId) => {
    setSelectedTheme(themeId);
    try {
      localStorage.setItem('orbito_custom_badge_theme', themeId);
    } catch {}
  };

  const handleSelectFormat = (format: CardFormat) => {
    setCardFormat(format);
  };

  // Instagram Share Handler (Native Web Share if mobile, or direct download + toast)
  const handleShareInstagram = async () => {
    setIsGeneratingBadge(true);
    setShareFeedback(null);
    try {
      const dataUrl = badgePreviewUrl || renderBadge(currentTheme, cardFormat);
      if (!dataUrl) return;

      const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
      const filename = `orbito-${selectedTheme}-${cardFormat === 'wide' ? 'radar-16x9' : 'story-9x16'}-${dateStr}.png`;

      // Convert dataUrl to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // Try native share sheet (Supported on mobile Safari & Chrome for Instagram Stories/Feed!)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'orbitO Flight Telemetry',
            text: `Commander ${getDisplayCallsign()} on orbitO! ${isForfeited ? 'Mission Aborted' : `${finalScore} CR in ${guessesCount} probes`}. Play at ${GAME_URL} #orbitO #OrbitoDaily`,
          });
          setStoryShared(true);
          setTimeout(() => setStoryShared(false), 3000);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
        }
      }

      // Download file to disk / camera roll
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setStoryShared(true);
      setShareFeedback(`CARD SAVED! Open Instagram to share your ${cardFormat === 'wide' ? '16:9 Radar' : 'Story'} badge 📸`);
      setTimeout(() => {
        setStoryShared(false);
        setShareFeedback(null);
      }, 5000);
    } catch (err) {
      console.error('Instagram share error:', err);
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  const handleDownloadBadge = () => {
    setIsGeneratingBadge(true);
    try {
      const dataUrl = badgePreviewUrl || renderBadge(currentTheme, cardFormat);
      if (!dataUrl) return;

      const dateStr = puzzleDate || new Date().toISOString().split('T')[0];
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `orbito-${selectedTheme}-${cardFormat === 'wide' ? 'radar-16x9' : 'story-9x16'}-${dateStr}.png`;
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

  const isAlertMode = isForfeited;
  const cardBorderClass = isAlertMode
    ? 'border-[#EF4444]/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    : 'border-primary/40 shadow-[0_0_30px_rgba(72,255,72,0.15)]';
  const headerTextClass = isAlertMode ? 'text-[#EF4444]' : 'text-primary';

  return (
    <div className={`w-full bg-[#060a08] border ${cardBorderClass} p-3 sm:p-4 font-mono text-left relative`}>
      {/* Hidden Canvas for Generating High-Res Graphic */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Terminal Title Strip with Game Name & Link */}
      <div
        className={`flex items-center justify-between pb-2 border-b ${
          isAlertMode ? 'border-[#EF4444]/20' : 'border-primary/20'
        } mb-3 text-[10px]`}
      >
        <span className={`flex items-center gap-1.5 ${headerTextClass} font-bold uppercase tracking-wider`}>
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-white font-black">{GAME_NAME}</span> // FLIGHT DEBRIEF
        </span>
        <span className="text-white/50 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isAlertMode ? 'bg-[#EF4444]' : 'bg-primary'} animate-ping`}></span>
          VERIFIED BADGE
        </span>
      </div>

      {/* Format & Theme Selection Toolbar */}
      <div className="space-y-2 mb-3">
        {/* Aspect Ratio Switcher: RADAR (16:9) DEFAULT vs INSTAGRAM STORY (9:16) */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-black/60 border border-white/10 rounded">
          <div className="flex items-center gap-1.5 text-[10px] text-white/70 px-1 uppercase font-bold">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>FORMAT:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* RADAR 16:9 - DEFAULT */}
            <button
              onClick={() => handleSelectFormat('wide')}
              className={`py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                cardFormat === 'wide'
                  ? 'bg-primary text-black font-black shadow-[0_0_15px_rgba(72,255,72,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>RADAR (16:9)</span>
            </button>

            {/* INSTAGRAM STORY 9:16 */}
            <button
              onClick={() => handleSelectFormat('story')}
              className={`py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                cardFormat === 'story'
                  ? 'bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-[0_0_15px_rgba(220,39,67,0.5)] font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>INSTAGRAM (9:16)</span>
            </button>
          </div>
        </div>

        {/* 5 Character Theme Switcher */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-white/60 mb-1.5 uppercase tracking-wider">
            <span>SELECT FLIGHT BADGE SPECIFICATION:</span>
            <span className="font-bold" style={{ color: currentTheme.accentColor }}>
              {currentTheme.name} [{currentTheme.tag}]
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 font-mono text-[10px]">
            {BADGE_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`py-2 px-1.5 border transition-all cursor-pointer flex items-center justify-center min-w-0 rounded-sm ${
                    isSelected
                      ? 'bg-black/90 font-black shadow-lg scale-[1.02]'
                      : 'border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/30'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: theme.accentColor,
                          boxShadow: `0 0 12px ${theme.accentColor}50`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-1.5 truncate w-full justify-center">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.accentColor }} />
                    <span
                      className="truncate font-bold text-[10px]"
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
      </div>

      {/* Visual Canvas Flight Badge Preview */}
      <div
        className={`relative border ${
          isAlertMode ? 'border-[#EF4444]/40' : 'border-primary/40'
        } bg-black/95 p-1.5 shadow-[0_0_30px_rgba(0,0,0,0.9)] mb-3 overflow-hidden group rounded flex items-center justify-center`}
      >
        {badgePreviewUrl ? (
          <img
            src={badgePreviewUrl}
            alt="Official Flight Badge"
            className={`w-auto object-contain border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-[1.01] ${
              cardFormat === 'wide' ? 'max-h-[260px] sm:max-h-[320px]' : 'max-h-[380px] sm:max-h-[420px]'
            }`}
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-primary/70 font-mono text-xs animate-pulse">
            CALIBRATING {GAME_NAME.toUpperCase()} BADGE TELEMETRY...
          </div>
        )}
      </div>

      {/* Share Feedback Toast if downloaded */}
      {shareFeedback && (
        <div className="mb-3 p-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold text-center text-xs tracking-wider rounded shadow-lg animate-pulse flex items-center justify-center gap-2">
          <InstagramIcon className="w-4 h-4 text-white shrink-0" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* High-Impact Share Action Buttons */}
      <div className="space-y-2">
        {/* Primary Instagram Share Button (Works for both 16:9 and 9:16!) */}
        <button
          onClick={handleShareInstagram}
          disabled={isGeneratingBadge}
          className="w-full py-3 px-3 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/30 cursor-pointer text-xs shadow-[0_0_20px_rgba(220,39,67,0.4)] hover:shadow-[0_0_30px_rgba(220,39,67,0.7)]"
        >
          {storyShared ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>SAVED FOR INSTAGRAM!</span>
            </>
          ) : (
            <>
              <InstagramIcon className="w-4 h-4 text-white" />
              <span>
                {isGeneratingBadge
                  ? 'CALIBRATING...'
                  : cardFormat === 'wide'
                  ? 'SHARE 16:9 RADAR TO INSTAGRAM'
                  : 'SHARE TO INSTAGRAM STORY'}
              </span>
            </>
          )}
        </button>

        {/* Secondary Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Download PNG Badge */}
          <button
            onClick={handleDownloadBadge}
            disabled={isGeneratingBadge}
            className={`py-2.5 px-2 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer text-[11px] ${
              isAlertMode
                ? 'bg-[#EF4444] hover:bg-white text-black border-[#EF4444]'
                : 'bg-primary hover:bg-white text-black border-primary shadow-[0_0_15px_rgba(72,255,72,0.35)]'
            }`}
          >
            {badgeDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="truncate">SAVED!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="truncate">{isGeneratingBadge ? 'SAVING...' : 'DOWNLOAD PNG'}</span>
              </>
            )}
          </button>

          {/* Copy Telemetry Log */}
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

          {/* Share to WhatsApp */}
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
    </div>
  );
};
