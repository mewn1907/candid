// ©️ Mewn — Moving stars backdrop for landing (lightweight, theme-aware)
import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftX: number;
  driftY: number;
  color: string;
}

const STAR_COUNT = 110;
const SHOOTING_INTERVAL_MS = 4200;

export const StarsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);
  const shootingRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; active: boolean }>({
    x: -100,
    y: -100,
    vx: 0,
    vy: 0,
    life: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getThemeStarColors = (): string[] => {
      const theme = document.documentElement.getAttribute('data-theme') || 'sabi';
      // theme-aware palette — keep subtle on light, gold on kintsugi
      if (theme === 'kintsugi') return ['rgba(212,175,55,', 'rgba(240,216,120,', 'rgba(255,255,255,'];
      if (theme === 'minimal') return ['rgba(0,0,0,', 'rgba(64,64,64,'];
      if (theme === 'ink') return ['rgba(43,43,43,', 'rgba(115,111,104,'];
      if (theme === 'nordic') return ['rgba(154,175,136,', 'rgba(255,255,255,'];
      return ['rgba(196,136,73,', 'rgba(255,255,255,', 'rgba(90,104,80,']; // sabi
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initStars = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const colors = getThemeStarColors();
      starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.003 + 0.0012,
        twinklePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.18,
        driftY: (Math.random() - 0.5) * 0.18,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    const themeObserver = new MutationObserver(() => {
      const colors = getThemeStarColors();
      starsRef.current.forEach((s) => {
        if (Math.random() < 0.3) s.color = colors[Math.floor(Math.random() * colors.length)];
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    initStars();

    let last = performance.now();
    let lastShooting = performance.now();
    const w = () => canvas.getBoundingClientRect().width;
    const h = () => canvas.getBoundingClientRect().height;

    const triggerShooting = () => {
      const rectW = w();
      const rectH = h();
      shootingRef.current = {
        x: Math.random() * rectW * 0.6,
        y: Math.random() * rectH * 0.35,
        vx: Math.random() * 6 + 7,
        vy: Math.random() * 3 + 2.5,
        life: 1,
        active: true,
      };
    };

    const frame = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;

      const rectW = w();
      const rectH = h();
      ctx.clearRect(0, 0, rectW, rectH);

      // subtle vignette for depth
      const grad = ctx.createRadialGradient(rectW * 0.5, rectH * 0.5, 0, rectW * 0.5, rectH * 0.5, Math.max(rectW, rectH) * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rectW, rectH);

      starsRef.current.forEach((s) => {
        if (!prefersReduced) {
          s.x += s.driftX * (dt / 16);
          s.y += s.driftY * (dt / 16);
          // wrap
          if (s.x < -5) s.x = rectW + 5;
          if (s.x > rectW + 5) s.x = -5;
          if (s.y < -5) s.y = rectH + 5;
          if (s.y > rectH + 5) s.y = -5;
        }
        const tw = Math.sin(now * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65;
        const alpha = s.baseAlpha * tw;

        // core star
        ctx.fillStyle = `${s.color}${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // subtle halo for larger stars
        if (s.r > 0.9) {
          ctx.fillStyle = `${s.color}${alpha * 0.18})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // shooting star
      if (!prefersReduced) {
        if (now - lastShooting > SHOOTING_INTERVAL_MS && Math.random() < 0.015) {
          triggerShooting();
          lastShooting = now;
        }
        const sh = shootingRef.current;
        if (sh.active) {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= 0.018;
          if (sh.life <= 0 || sh.x > rectW + 100 || sh.y > rectH + 100) {
            sh.active = false;
          } else {
            // trail
            const trailLen = 70;
            const grad2 = ctx.createLinearGradient(sh.x - sh.vx * 8, sh.y - sh.vy * 8, sh.x, sh.y);
            grad2.addColorStop(0, 'rgba(255,255,255,0)');
            grad2.addColorStop(0.5, `rgba(212,175,55,${0.35 * sh.life})`);
            grad2.addColorStop(1, `rgba(255,255,255,${0.9 * sh.life})`);
            ctx.strokeStyle = grad2;
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sh.x - sh.vx * (trailLen / 10), sh.y - sh.vy * (trailLen / 10));
            ctx.lineTo(sh.x, sh.y);
            ctx.stroke();

            ctx.fillStyle = `rgba(255,255,255,${0.95 * sh.life})`;
            ctx.beginPath();
            ctx.arc(sh.x, sh.y, 1.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    const onResize = () => {
      resize();
      // re-seed slightly to avoid clumping after resize
      starsRef.current.forEach((s) => {
        s.x = Math.random() * canvas.getBoundingClientRect().width;
        s.y = Math.random() * canvas.getBoundingClientRect().height;
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
};
