import { mkdir, writeFile } from 'node:fs/promises';

const fixed = value => ({ a: 0, k: value });
const animated = frames => ({ a: 1, k: frames.map(([t, value], index) => index === frames.length - 1 ? { t, s: value } : { t, s: value, e: frames[index + 1][1], i: { x: .62, y: 1 }, o: { x: .38, y: 0 } }) });
const colors = {
  lime: [0.77, 0.98, 0.51, 1], green: [0.37, 0.79, 0.47, 1], blue: [0.48, 0.68, 0.84, 1], gold: [1, .76, .38, 1], muted: [.55, .64, .62, 1],
};
function circle(name, size, color, position, opacity, scale = fixed([100, 100, 100])) {
  return {
    ddd: 0, ind: 1, ty: 4, nm: name, sr: 1, ip: 0, op: 90, st: 0, bm: 0,
    ks: { o: animated(opacity), r: fixed(0), p: animated(position), a: fixed([0, 0, 0]), s: scale },
    shapes: [{ ty: 'gr', nm: name, it: [
      { ty: 'el', d: 1, p: fixed([0, 0]), s: fixed([size, size]), nm: 'circle' },
      { ty: 'fl', c: fixed(color), o: fixed(100), r: 1, bm: 0, nm: 'fill' },
      { ty: 'tr', p: fixed([0, 0]), a: fixed([0, 0]), s: fixed([100, 100]), r: fixed(0), o: fixed(100) },
    ] }],
  };
}
const file = (name, layers) => ({ v: '5.12.0', fr: 30, ip: 0, op: 90, w: 200, h: 200, nm: name, ddd: 0, assets: [], layers });

const up = [circle('victory glow', 54, colors.lime, [[0, [100, 100, 0]], [90, [100, 100, 0]]], [[0, [0]], [12, [100]], [68, [100]], [90, [0]]], animated([[0, [30, 30, 100]], [28, [115, 115, 100]], [50, [100, 100, 100]], [90, [100, 100, 100]]]))];
for (let i = 0; i < 16; i++) {
  const angle = i * Math.PI / 8;
  const radius = 59 + i % 3 * 14;
  up.push(circle(`confetti ${i + 1}`, 6 + i % 3 * 3, [colors.lime, colors.green, colors.gold][i % 3], [[0, [100, 100, 0]], [10, [100, 100, 0]], [58, [100 + Math.cos(angle) * radius, 100 + Math.sin(angle) * radius, 0]], [90, [100 + Math.cos(angle) * (radius + 8), 100 + Math.sin(angle) * (radius + 8), 0]]], [[0, [0]], [10, [0]], [22, [100]], [68, [100]], [90, [0]]]));
}

const same = [circle('steady center', 32, colors.gold, [[0, [100, 100, 0]], [90, [100, 100, 0]]], [[0, [70]], [20, [100]], [60, [100]], [90, [70]]], animated([[0, [70, 70, 100]], [35, [105, 105, 100]], [70, [85, 85, 100]], [90, [70, 70, 100]]]))];
for (let i = 0; i < 8; i++) {
  const angle = i * Math.PI / 4;
  same.push(circle(`steady orbit ${i + 1}`, 7, i % 2 ? colors.gold : colors.lime, [[0, [100 + Math.cos(angle) * 42, 100 + Math.sin(angle) * 42, 0]], [45, [100 + Math.cos(angle + .45) * 57, 100 + Math.sin(angle + .45) * 57, 0]], [90, [100 + Math.cos(angle + .9) * 42, 100 + Math.sin(angle + .9) * 42, 0]]], [[0, [45]], [35, [100]], [70, [75]], [90, [45]]]));
}

const down = [circle('quiet center', 38, colors.blue, [[0, [100, 80, 0]], [35, [100, 104, 0]], [90, [100, 104, 0]]], [[0, [0]], [20, [75]], [80, [75]], [90, [0]]])];
for (let i = 0; i < 11; i++) {
  const x = 39 + i * 12;
  down.push(circle(`soft rain ${i + 1}`, 4 + i % 3 * 2, i % 2 ? colors.blue : colors.muted, [[0, [x, -20 - i % 3 * 20, 0]], [65, [x + (i % 3 - 1) * 11, 174, 0]], [90, [x + (i % 3 - 1) * 11, 205, 0]]], [[0, [0]], [12, [65]], [55, [65]], [90, [0]]]));
}

await mkdir(new URL('../public/lottie/', import.meta.url), { recursive: true });
for (const [name, layers] of Object.entries({ up, same, down, first: up })) {
  await writeFile(new URL(`../public/lottie/${name}.json`, import.meta.url), JSON.stringify(file(name, layers)));
}
