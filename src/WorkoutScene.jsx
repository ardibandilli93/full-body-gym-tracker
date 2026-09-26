import { useEffect, useRef, useState } from 'react';

const W = 640;
const H = 400;
const ASSETS = {
  womanSquat: '/assets/training/pixel/woman-squat.webp',
  womanWalk: '/assets/training/pixel/woman-walk.webp',
  manPress: '/assets/training/pixel/man-press.webp',
  manWalk: '/assets/training/pixel/man-walk.webp',
};

const smooth = n => n * n * (3 - 2 * n);

function drawStage(ctx, seconds, sprites) {
  const phase = seconds % 15;
  const entering = phase < 2.2;
  const leaving = phase > 11;
  const travel = entering ? smooth(phase / 2.2) : leaving ? smooth((phase - 11) / 4) : 0;
  const womanX = entering ? 720 - 520 * travel : leaving ? 200 - 460 * travel : 200;
  const manX = entering ? 900 - 466 * travel : leaving ? 434 - 510 * travel : 434;
  const exercise = !entering && !leaving;
  const floorY = 353;

  ctx.fillStyle = '#0a0d10';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(340, 285, 22, 340, 285, 340);
  glow.addColorStop(0, '#15302c');
  glow.addColorStop(0.48, '#102020');
  glow.addColorStop(1, '#0a0d10');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // The receding floor moves under the athletes without putting them in a boxed room.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 278, W, H - 278);
  ctx.clip();
  const horizon = 280;
  const vp = 332 + Math.sin(seconds * 0.15) * 12;
  for (let x = -580; x < 1200; x += 83) {
    ctx.strokeStyle = x % 2 ? '#34695677' : '#367c8277';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vp + (x - vp) * 0.02, horizon);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const depth = ((i + seconds * 0.55) % 9) / 9;
    const y = horizon + Math.pow(depth, 1.9) * 120;
    ctx.strokeStyle = `rgba(105, 217, 157, ${0.09 + depth * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(W, Math.round(y) + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  const sprite = (image, frame, x, feet, height) => {
    const fw = image.width / 4;
    const dw = height * fw / image.height;
    ctx.drawImage(image, frame * fw, 0, fw, image.height,
      Math.round(x - dw / 2), Math.round(feet - height), Math.round(dw), Math.round(height));
  };
  const shadow = (x, radius, color) => {
    const gradient = ctx.createRadialGradient(x, floorY + 1, 2, x, floorY + 1, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#0a0d1000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, floorY + 1, radius, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.imageSmoothingEnabled = false;
  shadow(womanX, 88, '#bbfb674f');
  shadow(manX, 95, '#75cfff49');

  const walkFrame = Math.floor(seconds * 7) % 4;
  const womanFrame = Math.floor((seconds - 2.2) * 3.1) % 4;
  const manFrame = Math.floor((seconds - 2.2) * 3.1 + 1) % 4;
  sprite(exercise ? sprites.womanSquat : sprites.womanWalk,
    exercise ? womanFrame : walkFrame, womanX, floorY, 282);
  sprite(exercise ? sprites.manPress : sprites.manWalk,
    exercise ? manFrame : walkFrame, manX, floorY + 4, 289);

  ctx.fillStyle = '#aef479';
  ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('01  FULL BODY', 22, 20);
  ctx.fillStyle = '#77998c';
  ctx.font = '10px monospace';
  ctx.fillText('SQUAT / PRESS / MOVE', 22, 37);
  ctx.fillStyle = '#92f18c';
  ctx.fillRect(22, 58, 28 + (phase / 15) * 118, 2);
  ctx.fillStyle = '#33564b';
  ctx.fillRect(50 + (phase / 15) * 118, 58, 118 * (1 - phase / 15), 2);
}

export function WorkoutScene() {
  const canvasRef = useRef(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!ctx) return;
    let canceled = false;
    let visible = true;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; });
    observer.observe(canvas);

    Promise.all(Object.entries(ASSETS).map(([name, url]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve([name, img]);
      img.onerror = reject;
      img.src = url;
    }))).then(entries => {
      if (canceled) return;
      const sprites = Object.fromEntries(entries);
      setReady(true);
      const tick = now => {
        if (canceled) return;
        frame = requestAnimationFrame(tick);
        if (!visible || pausedRef.current) { last = now; return; }
        if (now - last < 40) return;
        elapsed += Math.min((now - (last || now)) / 1000, 0.1);
        last = now;
        drawStage(ctx, elapsed, sprites);
      };
      drawStage(ctx, 0, sprites);
      frame = requestAnimationFrame(tick);
    }).catch(() => { /* The poster remains visible if assets cannot load. */ });

    return () => { canceled = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [reduced]);

  return <div className="arcade-stage" role="group" aria-label="Pixel-art woman squatting and man pressing dumbbells, walking through a perspective workout stage">
    {!reduced && <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />}
    {!reduced && ready && <button type="button" className="arcade-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
