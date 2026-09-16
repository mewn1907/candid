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

    const stars: Star[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.6,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.2 + 0.08), // Gentle upward drift
      isCross: Math.random() > 0.88 // ~12% are 4-point twinkling stars
    }));

    const drawCrossStar = (x: number, y: number, r: number, alpha: number) => {
      ctx.save();
      ctx.strokeStyle = `rgba(246, 197, 137, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - r * 2.8, y);
      ctx.lineTo(x + r * 2.8, y);
      ctx.moveTo(x, y - r * 2.8);
      ctx.lineTo(x, y + r * 2.8);
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed;
        const alpha = s.baseAlpha + Math.sin(s.twinklePhase) * 0.25;
        const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

        // Motion update
        s.x += s.vx;
        s.y += s.vy;
        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        // Draw star core
        ctx.fillStyle = goldenHues[Math.floor(s.radius * 3) % goldenHues.length];
        ctx.globalAlpha = clampedAlpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        if (s.isCross) {
          drawCrossStar(s.x, s.y, s.radius * 2, clampedAlpha * 0.85);
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
      className="fixed inset-0 pointer-events-none z-0 opacity-75"
      aria-hidden="true"
    />
  );
};
