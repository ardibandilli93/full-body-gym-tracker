import { useEffect, useRef, useState } from 'react';

const W = 1000;
const H = 520;
const LOOP = 21.1;
const ASSETS = {
  womanWalk: '/assets/training/pixel/woman-walk.webp',
  manWalk: '/assets/training/pixel/man-walk.webp',
  womanFront: '/assets/training/pixel/woman-walk-front.webp',
  manFront: '/assets/training/pixel/man-walk-front.webp',
  womanBack: '/assets/training/pixel/woman-walk-back.webp',
  manBack: '/assets/training/pixel/man-walk-back.webp',
  womanTurn: '/assets/training/pixel/woman-turn.webp',
  manTurn: '/assets/training/pixel/man-turn.webp',
  womanSquat: '/assets/training/pixel/woman-squat.webp',
  manPress: '/assets/training/pixel/man-press.webp',
  pressSquat: '/assets/training/pixel/press-squat.png',
};

const smooth = value => value * value * (3 - 2 * value);
const between = (time, start, end) => smooth(Math.max(0, Math.min(1, (time - start) / (end - start))));
const mix = (start, end, value) => start + (end - start) * value;

function drawStage(ctx, seconds, sprites) {
  const time = seconds % LOOP;
  const press = time >= 3.2 && time < 6.5;
  const squat = time >= 10.3 && time < 13.6;

  let center = 340;
  let feet = 416;
  if (time < 2.4) center = mix(340, 480, between(time, 0, 2.4));
  else if (time < 7.2) center = 480;
  else if (time < 9.6) center = mix(480, 610, between(time, 7.2, 9.6));
  else if (time < 14.6) center = 610;
  else if (time < 17.2) {
    const step = between(time, 14.6, 17.2);
    center = mix(610, 340, step);
    feet = mix(416, 382, step);
  } else if (time < 18.2) { center = 340; feet = 382; }
  else if (time < 20.4) {
    const step = between(time, 18.2, 20.4);
    center = 340;
    feet = mix(382, 416, step);
  } else center = 340;

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

  const draw = (image, frame, x, bottom, height, row = 0, rows = 1, split = null) => {
    const frameWidth = image.width / 4;
    const rowStart = split ? (row ? split : 0) : row * image.height / rows;
    const rowHeight = split ? (row ? image.height - split : split) : image.height / rows;
    const width = height * frameWidth / rowHeight;
    ctx.drawImage(image, frame * frameWidth, rowStart, frameWidth, rowHeight,
      Math.round(x - width / 2), Math.round(bottom - height), Math.round(width), Math.round(height));
  };

  const womanX = center - 116;
  const manX = center + 116;
  const shadows = () => {
    for (const [x, color] of [[womanX, '#a4e95e'], [manX, '#43b9dc']]) {
      const shadow = ctx.createRadialGradient(x, feet + 5, 5, x, feet + 5, 100);
      shadow.addColorStop(0, `${color}42`);
      shadow.addColorStop(1, `${color}00`);
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(x, feet + 7, 105, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  shadows();
  const drawWalk = view => {
    const frame = Math.floor(seconds * 7) % 4;
    const bob = Math.sin(seconds * Math.PI * 3.5) * 2;
    const pair = view === 'back' ? [sprites.womanBack, sprites.manBack] : view === 'front' ? [sprites.womanFront, sprites.manFront] : [sprites.womanWalk, sprites.manWalk];
    draw(pair[0], frame, womanX, feet + bob, 304);
    draw(pair[1], frame, manX, feet + bob + 2, 310);
  };
  const drawTurn = (start, end, first, last) => {
    const frame = Math.round(mix(first, last, between(time, start, end)));
    draw(sprites.womanTurn, frame, womanX, feet, 306);
    draw(sprites.manTurn, frame, manX, feet + 2, 310);
  };

  if (time >= 2.4 && time < 3.2) return drawTurn(2.4, 3.2, 1, 0);
  if (time >= 6.5 && time < 7.2) return drawTurn(6.5, 7.2, 0, 1);
  if (time >= 9.6 && time < 10.3) return drawTurn(9.6, 10.3, 1, 0);
  if (time >= 13.6 && time < 14.6) return drawTurn(13.6, 14.6, 0, 3);
  if (time >= 17.2 && time < 18.2) return drawTurn(17.2, 18.2, 3, 0);
  if (time >= 20.4) return drawTurn(20.4, LOOP, 0, 1);

  if (press) {
    const frame = Math.floor((time - 3.2) * 3.1) % 4;
    draw(sprites.pressSquat, frame, womanX, feet, 310, 0, 2, 550);
    draw(sprites.manPress, frame, manX, feet + 2, 314);
  } else if (squat) {
    const frame = Math.floor((time - 10.3) * 3.1) % 4;
    draw(sprites.womanSquat, frame, womanX, feet, 306);
    draw(sprites.pressSquat, frame, manX, feet + 2, 310, 1, 2, 550);
  } else {
    drawWalk(time < 9.6 ? 'side' : time < 17.2 ? 'back' : 'front');
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
      drawStage(ctx, reduced ? 3.2 : 0, sprites);
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

  return <div className="arcade-stage" role="group" aria-label="Pixel-art athletes walking and turning through a continuous loop, pressing dumbbells and squatting">
    <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />
  </div>;
}
