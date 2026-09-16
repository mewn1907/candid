// ©️ Mewn — Creative extras (all optional)
import React, { useState } from 'react';

export const PROMPTS = [
  "Look at each other, not the camera",
  "Laugh together — no posing",
  "Whisper a secret",
  "Both do your silliest face",
  "Hold the polaroid together (pretend)",
  "Close eyes, open on 1",
];

export const STICKERS = ['❤️','⭐','🐱','🌿','✨','🎈','🍂','☁️'];

export const DoodleOverlay: React.FC<{ src: string; onSave: (url: string)=>void; onClose: ()=>void }> = ({ src, onSave, onClose }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [color, setColor] = React.useState('#1C1B18');
  const [size, setSize] = React.useState(4);
  const drawing = React.useRef(false);

  React.useEffect(()=>{ if (imgRef.current && canvasRef.current) {
    const c = canvasRef.current; const img = imgRef.current;
    const resize = ()=>{ if (!img.complete) return; c.width = img.clientWidth; c.height = img.clientHeight; };
    img.onload = resize; resize();
  }}, [src]);

  const pos = (e: React.MouseEvent|React.TouchEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const t = (e as any).touches?.[0] ?? e as any;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e: any)=>{ drawing.current=true; const ctx=canvasRef.current!.getContext('2d')!; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
  const move = (e: any)=>{ if(!drawing.current) return; const ctx=canvasRef.current!.getContext('2d')!; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle=color; ctx.lineWidth=size; ctx.lineCap='round'; ctx.stroke(); e.preventDefault(); };
  const end = ()=>{ drawing.current=false; };

  const save = ()=>{
    const img = imgRef.current!; const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!; ctx.drawImage(img,0,0,c.width,c.height);
    // scale doodle
    const d = canvasRef.current!; ctx.drawImage(d,0,0,c.width,c.height);
    onSave(c.toDataURL('image/jpeg',0.92)); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cream rounded-organic shadow-cozy-lg w-full max-w-2xl overflow-hidden">
        <div className="p-3 border-b border-paper-border flex items-center justify-between">
          <h3 className="font-display text-ink-900">Doodle — wabi ink (extra)</h3>
          <button onClick={onClose} className="btn-ghost btn-sm">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative bg-paper-50 rounded-organic overflow-hidden border border-paper-border flex items-center justify-center">
            <img ref={imgRef} src={src} alt="doodle base" className="max-w-full max-h-[420px] object-contain select-none" draggable={false} />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair" onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {['#1C1B18','#C48849','#3E4D3A','#BD5338','#4A6B82'].map(c=>(
              <button key={c} onClick={()=>setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color===c?'ring-2 ring-clay scale-110':''}`} style={{background:c}} aria-label={c} />
            ))}
            <input type="range" min={2} max={12} value={size} onChange={e=>setSize(Number(e.target.value))} className="w-24 accent-clay" />
            <span className="text-xs font-mono text-ink-500">{size}px</span>
            <button onClick={()=>{ const c=canvasRef.current!.getContext('2d')!; c.clearRect(0,0,canvasRef.current!.width, canvasRef.current!.height);}} className="btn-ghost btn-sm ml-auto">Clear</button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} className="btn-primary flex-1">Save doodle</button>
          </div>
          <p className="text-[11px] text-ink-500 text-center">Extra — draw with mouse/finger, then save</p>
        </div>
      </div>
    </div>
  );
};

export const StickerOverlay: React.FC<{ src: string; onSave: (url:string)=>void; onClose:()=>void }> = ({ src, onSave, onClose }) => {
  const [items, setItems] = useState<{id:number,x:number,y:number,emoji:string,scale:number}[]>([]);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const add = (emoji:string)=> setItems(s=>[...s,{id:Date.now()+Math.random(),x:50+Math.random()*20,y:50+Math.random()*20,emoji,scale:1}]);
  const save = ()=>{
    const img = imgRef.current!; const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; const ctx=c.getContext('2d')!; ctx.drawImage(img,0,0,c.width,c.height);
    const r = img.getBoundingClientRect(); // approximate placement using natural size
    ctx.textAlign='center'; ctx.textBaseline='middle';
    items.forEach(it=>{
      const x = (it.x/100)*c.width; const y=(it.y/100)*c.height;
      ctx.font = `${Math.round(c.width*0.08*it.scale)}px serif`;
      ctx.fillText(it.emoji, x, y);
    });
    onSave(c.toDataURL('image/jpeg',0.92)); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cream rounded-organic shadow-cozy-lg w-full max-w-2xl overflow-hidden">
        <div className="p-3 border-b border-paper-border flex items-center justify-between"><h3 className="font-display text-ink-900">Stickers — draggable (extra)</h3><button onClick={onClose} className="btn-ghost btn-sm">✕</button></div>
        <div className="p-4 space-y-3">
          <div className="relative bg-paper-50 rounded-organic overflow-hidden border border-paper-border flex items-center justify-center">
            <img ref={imgRef} src={src} className="max-w-full max-h-[420px] object-contain" alt="sticker base" />
            {items.map(it=>(
              <div key={it.id} className="absolute select-none cursor-grab active:cursor-grabbing text-2xl" style={{left:`${it.x}%`, top:`${it.y}%`, transform:'translate(-50%,-50%) scale('+it.scale+')'}} onMouseDown={e=>{
                const startX=e.clientX, startY=e.clientY, ox=it.x, oy=it.y;
                const move=(ev:MouseEvent)=>{ const dx=(ev.clientX-startX)/ (imgRef.current!.clientWidth) *100; const dy=(ev.clientY-startY)/ (imgRef.current!.clientHeight)*100; setItems(s=>s.map(x=>x.id===it.id?{...x,x:ox+dx,y:oy+dy}:x)); };
                const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
                window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
              }}>{it.emoji}</div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {STICKERS.map(s=>(<button key={s} onClick={()=>add(s)} className="w-9 h-9 rounded-full bg-paper-200 border border-paper-border text-lg hover:scale-110 transition-transform">{s}</button>))}
            <button onClick={()=>setItems([])} className="btn-ghost btn-sm">Clear</button>
          </div>
          <div className="flex gap-3"><button onClick={onClose} className="btn-secondary flex-1">Cancel</button><button onClick={save} className="btn-primary flex-1">Save stickers</button></div>
        </div>
      </div>
    </div>
  );
};

export const PromptCard: React.FC<{ onDismiss: ()=>void }> = ({ onDismiss }) => {
  const [prompt] = useState(()=> PROMPTS[Math.floor(Math.random()*PROMPTS.length)]);
  return (
    <div className="card-deckle p-4 max-w-md mx-auto text-center animate-scale-in relative overflow-hidden">
      <div className="washi-tape" />
      <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-1">Live prompt (extra)</p>
      <p className="font-handwritten text-2xl text-ink-900">“{prompt}”</p>
      <button onClick={onDismiss} className="btn-ghost btn-sm mt-3">Got it — start countdown</button>
    </div>
  );
};
