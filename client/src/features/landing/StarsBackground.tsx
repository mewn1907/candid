// ©️ Mewn — Elegant floating golden stars (Stitch) — responsive density
import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  zigAmp: number;
  zigSpeed: number;
  isCross: boolean;
}

export const StarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const goldenHues = ['#f6c589', '#e8a355', '#fedca8', '#d4883b'];

    const getStarCount = (w: number, h: number) => {
      const area = w * h;
      return Math.max(32, Math.min(82, Math.round(area / 22000)));
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const newCount = getStarCount(width, height);
      if (starsRef.current.length && newCount !== starsRef.current.length) {
        starsRef.current = Array.from({ length: newCount }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.2 + 1.4,
          baseAlpha: Math.random() * 0.35 + 0.55,
          twinkleSpeed: Math.random() * 0.022 + 0.008,
          twinklePhase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.55) * 0.32,
          zigAmp: Math.random() * 0.9 + 0.4,
          zigSpeed: Math.random() * 0.0018 + 0.0007,
          isCross: Math.random() > 0.68,
        }));
      }
    };
    window.addEventListener('resize', handleResize);

    const stars: Star[] = Array.from({ length: getStarCount(width, height) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 1.4,
      baseAlpha: Math.random() * 0.35 + 0.55,
      twinkleSpeed: Math.random() * 0.022 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.55) * 0.32,
      zigAmp: Math.random() * 0.9 + 0.4,
      zigSpeed: Math.random() * 0.0018 + 0.0007,
      isCross: Math.random() > 0.68,
    }));
    starsRef.current = stars;

    const drawCrossStar = (x: number, y: number, r: number, alpha: number) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(255, 230, 120, ${alpha * 0.7})`;
      ctx.strokeStyle = `rgba(255, 236, 180, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - r * 3.2, y);
      ctx.lineTo(x + r * 3.2, y);
      ctx.moveTo(x, y - r * 3.2);
      ctx.lineTo(x, y + r * 3.2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.55;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x - r * 2.2, y - r * 2.2);
      ctx.lineTo(x + r * 2.2, y + r * 2.2);
      ctx.moveTo(x + r * 2.2, y - r * 2.2);
      ctx.lineTo(x - r * 2.2, y + r * 2.2);
      ctx.stroke();
      ctx.restore();
    };

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now();

      for (const s of starsRef.current) {
        s.twinklePhase += s.twinkleSpeed;
        const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.25;
        const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

        const zigX = Math.sin(now * s.zigSpeed + s.twinklePhase) * s.zigAmp;
        const zigY = Math.cos(now * s.zigSpeed * 0.7 + s.twinklePhase * 0.6) * s.zigAmp * 0.35;
        const mx = s.vx + zigX * 0.08;
        const my = s.vy + zigY * 0.08;
        s.x += mx;
        s.y += my;
        if (s.y < -14) s.y = height + 14;
        if (s.y > height + 14) s.y = -14;
        if (s.x < -14) s.x = width + 14;
        if (s.x > width + 14) s.x = -14;

        const tailLen = 26;
        const tailX = s.x - mx * tailLen * 7;
        const tailY = s.y - my * tailLen * 7;
        const tailGrad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        tailGrad.addColorStop(0, 'rgba(246,197,137,0)');
        tailGrad.addColorStop(0.35, `rgba(246,197,137,${clampedAlpha * 0.18})`);
        tailGrad.addColorStop(1, `rgba(246,197,137,${clampedAlpha * 0.62})`);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = Math.max(1, s.radius * 0.75);
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(246,197,137,${clampedAlpha * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,230,120,${clampedAlpha * 0.14})`;
        ctx.lineWidth = s.radius * 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX * 0.92 + s.x * 0.08, tailY * 0.92 + s.y * 0.08);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.shadowBlur = s.isCross ? 14 : 8;
        ctx.shadowColor = s.isCross ? `rgba(255,230,120,${clampedAlpha * 0.85})` : `rgba(246,197,137,${clampedAlpha * 0.65})`;
        ctx.fillStyle = goldenHues[Math.floor(s.radius * 3) % goldenHues.length];
        ctx.globalAlpha = clampedAlpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255,230,120,${clampedAlpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        if (s.isCross) {
          drawCrossStar(s.x, s.y, s.radius * 2.1, clampedAlpha * 0.92);
        }
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90"
      aria-hidden="true"
    />
  );
};
