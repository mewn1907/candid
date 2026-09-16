// ©️ Mewn — extra feature 4: wabi-sabi sound & flash (no assets, Web Audio)

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playTick(): void {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.12;
  o.connect(g).connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
  o.stop(c.currentTime + 0.13);
}

export function playShutter(): void {
  const c = getCtx();
  if (!c) return;
  // click + soft thud
  const bufferSize = Math.floor(c.sampleRate * 0.12);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // short noise burst decaying
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2) * 0.9;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = 0.35;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}
