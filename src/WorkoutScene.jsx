import { useEffect, useRef, useState } from 'react';

const W = 1000;
const H = 520;
const EXERCISE_SECONDS = 3.4;
const WATER_SECONDS = 2.6;
const LOOP = EXERCISE_SECONDS * 3 + WATER_SECONDS;
const EXERCISES = ['SHOULDER PRESS', 'SQUATS', 'SQUAT TO PRESS'];
const ASSETS = {
  womanSquat: '/assets/training/pixel/woman-squat.webp',
  manPress: '/assets/training/pixel/man-press.webp',
  pressSquat: '/assets/training/pixel/press-squat.png',
};

function drawStage(ctx, seconds, sprites) {
  const time = seconds % LOOP;
  const interval = Math.min(3, Math.floor(time / EXERCISE_SECONDS));
  const progress = interval === 3 ? (time - EXERCISE_SECONDS * 3) / WATER_SECONDS : (time % EXERCISE_SECONDS) / EXERCISE_SECONDS;
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
    // Alternate the two standing movements to make a squat-to-press sequence.
    if (Math.floor((time - EXERCISE_SECONDS * 2) * 1.6) % 2 === 0) drawSquat(frame);
    else drawPress(frame);
  } else {
    drawSquat(0);
    const lift = Math.min(1, (time - EXERCISE_SECONDS * 3) / 0.45, (LOOP - time) / 0.45);
    const sip = Math.sin((time - EXERCISE_SECONDS * 3) * 8) * 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#172127';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(manX - 24, feet - 223);
    ctx.lineTo(manX + 10, feet - 245 + (1 - lift) * 70);
    ctx.stroke();
    ctx.strokeStyle = '#ce9068';
    ctx.lineWidth = 12;
    ctx.stroke();
    const bottle = (x, y, handColor) => {
      ctx.save();
      ctx.translate(x, y + (1 - lift) * 70 + sip);
      ctx.rotate(-0.28 - lift * 0.28);
      ctx.fillStyle = '#091d25';
      ctx.fillRect(-12, -22, 25, 45);
      ctx.fillStyle = '#69c9db';
      ctx.fillRect(-9, -18, 19, 37);
      ctx.fillStyle = '#b5f2ec';
      ctx.fillRect(-7, -15, 5, 30);
      ctx.fillStyle = '#286f8b';
      ctx.fillRect(-10, 3, 21, 16);
      ctx.fillStyle = '#d9f7f0';
      ctx.fillRect(-7, -27, 15, 7);
      ctx.fillStyle = handColor;
      ctx.fillRect(-14, 8, 8, 10);
      ctx.restore();
    };
    bottle(womanX + 12, feet - 254, '#dfa273');
    bottle(manX + 16, feet - 253, '#cf9065');
  }

  // Timed segments make the three exercises and water break visible at a glance.
  ctx.fillStyle = '#d9f7ec';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(interval === 3 ? 'WATER BREAK' : EXERCISES[interval], 520, 54);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#91aaa2';
  ctx.fillText(interval === 3 ? 'DRINK WATER · THEN REPEAT' : `EXERCISE ${interval + 1} OF 3`, 520, 75);
  const width = 83;
  for (let i = 0; i < 4; i++) {
    const x = 374 + i * 94;
    ctx.fillStyle = '#254039';
    ctx.fillRect(x, 88, width, 5);
    ctx.fillStyle = i < interval ? '#c5fa82' : i === interval ? (interval === 3 ? '#67c9db' : '#c5fa82') : '#254039';
    ctx.fillRect(x, 88, Math.round(width * (i === interval ? progress : i < interval ? 1 : 0)), 5);
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

  return <div className="arcade-stage" role="group" aria-label="Two pixel-art athletes exercise in place: shoulder presses, squats, and squat to press, then drink water before repeating">
    <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />
  </div>;
}
