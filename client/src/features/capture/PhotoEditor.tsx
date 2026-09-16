// ©️ Mewn — extra feature 2: retake-friendly quick edit (rotate + warmth/brightness, wabi-sabi)

import React, { useState, useEffect, useRef } from 'react';

interface PhotoEditorProps {
  src: string;
  onSave: (editedDataUrl: string) => void;
  onClose: () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ src, onSave, onClose }) => {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [brightness, setBrightness] = useState(100); // 70-130
  const [warmth, setWarmth] = useState(0); // 0-60 sepia
  const [preview, setPreview] = useState(src);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPreview(src);
    setRotation(0);
    setBrightness(100);
    setWarmth(0);
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rad = (rotation * Math.PI) / 180;
      const swap = rotation % 180 !== 0;
      const w = swap ? img.height : img.width;
      const h = swap ? img.width : img.height;
      // cap preview canvas to keep it light
      const MAX = 900;
      const scale = Math.min(1, MAX / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      const filterParts = [];
      if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`);
      if (warmth > 0) filterParts.push(`sepia(${warmth}%)`);
      if (filterParts.length) {
        // fallback for older browsers
        if ('filter' in ctx) ctx.filter = filterParts.join(' ');
      } else if ('filter' in ctx) {
        ctx.filter = 'none';
      }
      ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.restore();
      setPreview(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, rotation, brightness, warmth]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in">
      <div className="bg-white rounded-2xl shadow-xl border border-surface-200 w-full max-w-2xl overflow-hidden">
        <div className="p-4 border-b border-surface-200 flex items-center justify-between">
          <h3 className="text-heading-sm font-semibold text-surface-900">Quick edit</h3>
          <button onClick={onClose} className="btn-ghost btn-sm" aria-label="Close editor">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="relative w-full bg-surface-50 rounded-xl overflow-hidden border border-surface-200 flex items-center justify-center min-h-[280px]">
            <img src={preview} alt="Edited preview" className="max-w-full max-h-[420px] object-contain" />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-caption font-medium text-surface-700">Rotate</label>
              <div className="flex gap-2">
                <button onClick={() => setRotation((r) => (r + 270) % 360)} className="btn-secondary btn-sm flex-1">↺ 90°</button>
                <button onClick={() => setRotation((r) => (r + 90) % 360)} className="btn-secondary btn-sm flex-1">↻ 90°</button>
                <button onClick={() => setRotation(0)} className="btn-ghost btn-sm">Reset</button>
              </div>
              <p className="text-caption text-surface-500">{rotation}°</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="brightness" className="text-caption font-medium text-surface-700">Brightness</label>
              <input
                id="brightness"
                type="range"
                min={70}
                max={130}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-wabi-500"
              />
              <p className="text-caption text-surface-500">{brightness}%</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="warmth" className="text-caption font-medium text-surface-700">Warmth</label>
              <input
                id="warmth"
                type="range"
                min={0}
                max={60}
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="w-full accent-wabi-500"
              />
              <p className="text-caption text-surface-500">{warmth}% sepia</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary btn-md flex-1">Cancel</button>
            <button
              onClick={() => {
                onSave(preview);
                onClose();
              }}
              className="btn-primary btn-md flex-1"
            >
              Save
            </button>
          </div>
          <p className="text-caption text-surface-400 text-center">Edits stay on device — original burst shots are kept.</p>
        </div>
      </div>
    </div>
  );
};
