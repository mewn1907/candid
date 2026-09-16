// ©️ Mewn — Elegant floating golden stars (Stitch)
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
  isCross: boolean;
}

export const StarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Warm golden palette matching CANDID
    const goldenHues = ['#f6c589', '#e8a355', '#fedca8', '#d4883b'];

    const stars: Star[] = Array.from({ length: 68 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.7,
      baseAlpha: Math.random() * 0.45 + 0.4,
      twinkleSpeed: Math.random() * 0.022 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(Math.random() * 0.28 + 0.1), // More floating upward
      isCross: Math.random() > 0.72 // ~28% are 4-point shining cross stars
    }));

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
      // diagonal glint
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

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed;
        const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.25;
        const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

        // Motion update — floating with gentle tail
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        // Long floating tail — golden comet trail
        const tailLen = 26;
        const tailX = s.x - s.vx * tailLen * 7;
        const tailY = s.y - s.vy * tailLen * 7;
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
        // second fainter wider tail for depth
        ctx.strokeStyle = `rgba(255,230,120,${clampedAlpha * 0.14})`;
        ctx.lineWidth = s.radius * 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX * 0.92 + s.x * 0.08, tailY * 0.92 + s.y * 0.08);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Draw star core — shining with halo
        ctx.shadowBlur = s.isCross ? 14 : 8;
        ctx.shadowColor = s.isCross ? `rgba(255,230,120,${clampedAlpha * 0.85})` : `rgba(246,197,137,${clampedAlpha * 0.65})`;
        ctx.fillStyle = goldenHues[Math.floor(s.radius * 3) % goldenHues.length];
        ctx.globalAlpha = clampedAlpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // outer glow
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
