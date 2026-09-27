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
  const press = time >= 2.8 && time < 6;
  const squat = time >= 9.4 && time < 12.4;
  const pushup = time >= 15.6 && time < 19;

  let center = 340;
  let feet = 416;
  if (time < 2.2) center = mix(340, 470, between(time, 0, 2.2));
  else if (time < 6.6) center = 470;
  else if (time < 8.8) center = mix(470, 610, between(time, 6.6, 8.8));
  else if (time < 13) center = 610;
  else if (time < 15) {
    const step = between(time, 13, 15);
    center = mix(610, 500, step);
    feet = mix(416, 490, step);
  } else if (time < 19.6) { center = 500; feet = 490; }
  else if (time < 21.4) {
    const step = between(time, 19.6, 21.4);
    center = mix(500, 340, step);
    feet = mix(490, 416, step);
  } else center = 340;

  ctx.fillStyle = '#0a0d10';
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  const draw = (image, frame, x, bottom, height, row = 0, rows = 1, split = null, facing = 1, widthScale = 1) => {
    const frameWidth = image.width / 4;
    const rowStart = split ? (row ? split : 0) : row * image.height / rows;
    const rowHeight = split ? (row ? image.height - split : split) : image.height / rows;
    const width = height * frameWidth / rowHeight * widthScale;
    ctx.save();
    ctx.translate(Math.round(x), 0);
    ctx.scale(facing, 1);
    ctx.drawImage(image, frame * frameWidth, rowStart, frameWidth, rowHeight,
      Math.round(-width / 2), Math.round(bottom - height), Math.round(width), Math.round(height));
    ctx.restore();
  };

  const womanX = center - 116;
  const manX = center + 116;
  const drawWalk = (direction, widthScale = 1, moving = true) => {
    const frame = moving ? Math.floor(seconds * 7) % 4 : 1;
    const facing = direction === 'left' ? -1 : 1;
    draw(sprites.womanWalk, frame, womanX, feet, 304, 0, 1, null, facing, widthScale);
    draw(sprites.manWalk, frame, manX, feet + 2, 310, 0, 1, null, facing, widthScale);
  };
  const drawFront = (widthScale = 1) => {
    if (time < 6.6) draw(sprites.pressSquat, 0, womanX, feet, 310, 0, 2, 550, 1, widthScale);
    else draw(sprites.womanSquat, 0, womanX, feet, 306, 0, 1, null, 1, widthScale);
    draw(sprites.pressSquat, 0, manX, feet + 2, 310, 1, 2, 550, 1, widthScale);
  };
  const drawTurn = (from, to, start, end) => {
    const progress = between(time, start, end);
    const stage = progress < 0.5 ? from : to;
    const widthScale = Math.max(0.35, Math.abs(progress - 0.5) * 2);
    if (stage === 'front') drawFront(widthScale);
    else drawWalk(stage, widthScale, false);
  };

  if (time >= 2.2 && time < 2.8) return drawTurn('right', 'front', 2.2, 2.8);
  if (time >= 6 && time < 6.6) return drawTurn('front', 'right', 6, 6.6);
  if (time >= 8.8 && time < 9.4) return drawTurn('right', 'front', 8.8, 9.4);
  if (time >= 12.4 && time < 13) return drawTurn('front', 'left', 12.4, 13);
  if (time >= 15 && time < 15.6) return drawTurn('left', 'front', 15, 15.6);
  if (time >= 19 && time < 19.6) return drawTurn('front', 'left', 19, 19.6);
  if (time >= 21.4) {
    if (time < 21.7) return drawTurn('left', 'front', 21.4, 21.7);
    return drawTurn('front', 'right', 21.7, LOOP);
  }

  if (pushup) {
    const frame = Math.floor((time - 15.6) * 3.1) % 4;
    draw(sprites.pushups, frame, womanX, feet, 180, 0, 2, 420);
    draw(sprites.pushups, frame, manX, feet + 2, 176, 1, 2, 420);
    return;
  }

  if (press) {
    const frame = Math.floor((time - 2.8) * 3.1) % 4;
    draw(sprites.pressSquat, frame, womanX, feet, 310, 0, 2, 550);
    draw(sprites.manPress, frame, manX, feet + 2, 314);
  } else if (squat) {
    const frame = Math.floor((time - 9.4) * 3.1) % 4;
    draw(sprites.womanSquat, frame, womanX, feet, 306);
    draw(sprites.pressSquat, frame, manX, feet + 2, 310, 1, 2, 550);
  } else {
    drawWalk(time < 13 ? 'right' : 'left');
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
        if (now - last < 40) return;
        elapsed += Math.min((now - (last || now)) / 1000, 0.1);
        last = now;
        drawStage(ctx, elapsed, sprites);
      };
      frame = requestAnimationFrame(tick);
    }).catch(() => { /* Keep the black backdrop if an asset cannot load. */ });

    return () => { canceled = true; cancelAnimationFrame(frame); observer.disconnect(); };
  }, [reduced]);

  return <div className="arcade-stage" role="group" aria-label="Pixel-art athletes looping around the scene, pressing dumbbells, squatting, and doing push-ups">
    <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} aria-hidden="true" />
  </div>;
}
