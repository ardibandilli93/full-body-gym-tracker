import { useEffect, useRef, useState } from 'react';

const W = 1000;
const H = 520;
const LOOP = 22;
const ASSETS = {
  womanWalk: '/assets/training/pixel/woman-walk.webp',
  manWalk: '/assets/training/pixel/man-walk.webp',
  womanSquat: '/assets/training/pixel/woman-squat.webp',
  manPress: '/assets/training/pixel/man-press.webp',
  pressSquat: '/assets/training/pixel/press-squat.png',
  pushups: '/assets/training/pixel/pushups.png',
};

const smooth = value => value * value * (3 - 2 * value);
const between = (time, start, end) => smooth(Math.max(0, Math.min(1, (time - start) / (end - start))));
const mix = (start, end, value) => start + (end - start) * value;

function drawStage(ctx, seconds, sprites) {
  const time = seconds % LOOP;
  const walkToPress = time < 2.5;
  const press = time >= 2.5 && time < 6.3;
  const walkToSquat = time >= 6.3 && time < 8.7;
  const squat = time >= 8.7 && time < 12.5;
  const walkToPushup = time >= 12.5 && time < 15;
  const pushup = time >= 15 && time < 19;
  const exit = time >= 19;

  let center = 340;
  let feet = 416;
  if (walkToPress) center = mix(210, 340, between(time, 0, 2.5));
  if (walkToSquat) center = mix(340, 610, between(time, 6.3, 8.7));
  if (squat) center = 610;
  if (walkToPushup) {
    const step = between(time, 12.5, 15);
    center = mix(610, 760, step);
    feet = mix(416, 490, step);
  }
  if (pushup) { center = 760; feet = 490; }
  if (exit) { center = mix(760, 1230, between(time, 19, LOOP)); feet = 490; }

  ctx.fillStyle = '#0a0d10';
  ctx.fillRect(0, 0, W, H);
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
  if (pushup) {
    const frame = Math.floor((time - 15) * 3.1) % 4;
    draw(sprites.pushups, frame, womanX, feet, 180, 0, 2, 420);
    draw(sprites.pushups, frame, manX, feet + 2, 176, 1, 2, 420);
    return;
  }

  if (press) {
    const frame = Math.floor((time - 2.5) * 3.1) % 4;
    draw(sprites.pressSquat, frame, womanX, feet, 310, 0, 2, 550);
    draw(sprites.manPress, frame, manX, feet + 2, 314);
  } else if (squat) {
    const frame = Math.floor((time - 8.7) * 3.1) % 4;
    draw(sprites.womanSquat, frame, womanX, feet, 306);
    draw(sprites.pressSquat, frame, manX, feet + 2, 310, 1, 2, 550);
  } else {
    const frame = Math.floor(seconds * 7) % 4;
    draw(sprites.womanWalk, frame, womanX, feet, 304);
    draw(sprites.manWalk, frame, manX, feet + 2, 310);
  }
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
        if (!visible || pausedRef.current) { last = now; return; }
        if (now - last < 40) return;
        elapsed += Math.min((now - (last || now)) / 1000, 0.1);
        last = now;
        drawStage(ctx, elapsed, sprites);
      };
      frame = requestAnimationFrame(tick);
    }).catch(() => { /* Keep the black backdrop if an asset cannot load. */ });

    return () => { canceled = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [reduced]);

  return <div className="arcade-stage" role="group" aria-label="Pixel-art athletes walking across the scene, pressing dumbbells, squatting, and doing push-ups">
    <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />
    {!reduced && ready && <button type="button" className="arcade-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
