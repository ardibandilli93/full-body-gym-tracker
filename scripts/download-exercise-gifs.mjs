import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const files = {
  "leg-press": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/10Z2DXU.gif",
  "bench-press": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/EIeI8Vf.gif",
  "lat-pulldown": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/LEprlgG.gif",
  "lateral-raise": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/DsgkuIt.gif",
  "cable-crunch": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/WW95auq.gif",
  "romanian-deadlift": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/wQ2c4XD.gif",
  "incline-dumbbell-press": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/ns0SIbU.gif",
  "seated-cable-row": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/fUBheHs.gif",
  "dumbbell-biceps-curl": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/BU15nH4.gif",
  "goblet-squat": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/yn8yg1r.gif",
  "machine-shoulder-press": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/67n3r98.gif",
  "face-pull": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/ZfyAGhK.gif",
  "cable-triceps-pushdown": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/gAwDzB3.gif",
  "hack-squat": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/Qa55kX1.gif",
  "barbell-hip-thrust": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/qg2PGl6.gif",
  "bulgarian-split-squat": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/qx4fgX7.gif",
  "lying-leg-curl": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/FkBIE6a.gif",
  "assisted-pull-up": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/kiJ4Z2K.gif",
  "chest-supported-dumbbell-row": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/7vG5o25.gif",
  "pec-deck-fly": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/xLYSdtg.gif",
  "standing-calf-raise": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/yl2IYyy.gif",
  "pallof-press": "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/9pa4H5m.gif"
};

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

await mkdir(resolve("assets/exercises"), { recursive: true });
let ok = 0;
for (const [id, url] of Object.entries(files)) {
  const dest = resolve(`assets/exercises/${id}.gif`);
  if (await exists(dest)) { console.log(`✓ ${id} already exists`); ok++; continue; }
  console.log(`↓ ${id}`);
  const response = await fetch(url, { headers: { "User-Agent": "full-body-gym-tracker-build" } });
  if (!response.ok) throw new Error(`Failed ${id}: ${response.status} ${response.statusText}`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("image/gif") && !type.includes("application/octet-stream")) {
    console.warn(`  warning: unexpected content-type ${type} for ${id}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error(`Downloaded file for ${id} is suspiciously small`);
  await writeFile(dest, bytes);
  ok++;
}
console.log(`Downloaded/verified ${ok} exercise GIFs.`);
