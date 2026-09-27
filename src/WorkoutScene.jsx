import { useEffect, useRef, useState } from 'react';

const W = 1000;
const H = 520;
const EXERCISE_SECONDS = 3.4;
const WATER_SECONDS = 2.6;
const LOOP = EXERCISE_SECONDS * 3 + WATER_SECONDS;
const ASSETS = {
  womanSquat: '/assets/training/pixel/woman-squat.webp',
  manPress: '/assets/training/pixel/man-press.webp',
  pressSquat: '/assets/training/pixel/press-squat.png',
  pushups: '/assets/training/pixel/pushups.png',
  water: '/assets/training/pixel/water-break.png',
};

function drawStage(ctx, seconds, sprites) {
  const time = seconds % LOOP;
  const interval = Math.min(3, Math.floor(time / EXERCISE_SECONDS));
  const frame = Math.floor(time * 2.8) % 4;
  const feet = 394;
  const womanX = 404;
  const manX = 636;

  const backdrop = ctx.createLinearGradient(0, 0, 0, H);
  backdrop.addColorStop(0, '#080d10');
  backdrop.addColorStop(0.68, '#0b1919');
  backdrop.addColorStop(1, '#0a1115');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(560, 370, 30, 560, 370, 380);
  glow.addColorStop(0, '#133e3440');
  glow.addColorStop(1, '#133e3400');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#376e6560';
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(500 + i * 24, 355);
    ctx.lineTo(500 + i * 92, H);
    ctx.stroke();
  }
  for (let i = 1; i <= 7; i++) {
    const y = 355 + Math.pow(i / 7, 1.7) * (H - 355);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.imageSmoothingEnabled = false;

  const draw = (image, selectedFrame, x, bottom, height, row = 0, rows = 1, split = null) => {
    const frameWidth = image.width / 4;
    const rowStart = split ? (row ? split : 0) : row * image.height / rows;
    const rowHeight = split ? (row ? image.height - split : split) : image.height / rows;
    const width = height * frameWidth / rowHeight;
    ctx.drawImage(image, selectedFrame * frameWidth, rowStart, frameWidth, rowHeight,
      Math.round(x - width / 2), Math.round(bottom - height), Math.round(width), Math.round(height));
  };
  const drawPress = selectedFrame => {
    draw(sprites.pressSquat, selectedFrame, womanX, feet, 310, 0, 2, 550);
    draw(sprites.manPress, selectedFrame, manX, feet + 2, 314);
  };
  const drawSquat = selectedFrame => {
    draw(sprites.womanSquat, selectedFrame, womanX, feet, 306);
    draw(sprites.pressSquat, selectedFrame, manX, feet + 2, 310, 1, 2, 550);
  };

  for (const [x, color] of [[womanX, '#a4e95e'], [manX, '#43b9dc']]) {
    const shadow = ctx.createRadialGradient(x, feet + 5, 5, x, feet + 5, 100);
    shadow.addColorStop(0, `${color}42`);
    shadow.addColorStop(1, `${color}00`);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(x, feet + 7, 105, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (interval === 0) drawPress(frame);
  else if (interval === 1) drawSquat(frame);
  else if (interval === 2) {
    draw(sprites.pushups, frame, womanX, feet, 180, 0, 2, 420);
    draw(sprites.pushups, frame, manX, feet + 28, 175, 1, 2, 420);
  } else {
    const waterTime = time - EXERCISE_SECONDS * 3;
    const waterFrame = waterTime < 0.4 ? 0 : waterTime < 0.9 ? 1 : waterTime < 1.8 ? 2 : waterTime < 2.2 ? 1 : 3;
    draw(sprites.water, waterFrame, womanX, feet, 310, 0, 2);
    draw(sprites.water, waterFrame, manX, feet + 2, 310, 1, 2);
  }
}

export function WorkoutScene() {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
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
      drawStage(ctx, 0, sprites);
      if (reduced) return;
      const tick = now => {
        if (canceled) return;
        frame = requestAnimationFrame(tick);
        if (!visible) { last = now; return; }
        if (now - last < 16) return;
        elapsed += Math.min((now - (last || now)) / 1000, 0.1);
        last = now;
        drawStage(ctx, elapsed, sprites);
      };
      frame = requestAnimationFrame(tick);
    }).catch(() => { /* Keep the black backdrop if an asset cannot load. */ });

    return () => { canceled = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [reduced]);

  return <div className="arcade-stage" role="group" aria-label="Two pixel-art athletes exercise in place: shoulder presses, squats, and push-ups, then drink water before repeating">
    <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />
  </div>;
}
