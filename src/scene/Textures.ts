import * as THREE from 'three';

function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  pixelated = false,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (pixelated) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
  }
  return tex;
}

// Helper: fill a small canvas with blocky color noise between two RGB ranges
function fillBlockyNoise(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  baseR: number, baseG: number, baseB: number,
  rangeR: number, rangeG: number, rangeB: number,
) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = baseR + Math.floor(Math.random() * rangeR);
      const g = baseG + Math.floor(Math.random() * rangeG);
      const b = baseB + Math.floor(Math.random() * rangeB);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// ====== LANE TEXTURES (tiling) ======

let _grassTex: THREE.CanvasTexture | null = null;
let _roadTex: THREE.CanvasTexture | null = null;
let _railwayTex: THREE.CanvasTexture | null = null;

export function createGrassTexture(): THREE.CanvasTexture {
  if (!_grassTex) {
    _grassTex = createCanvasTexture(16, 16, (ctx) => {
      // Dark green base with variation — some pixels lighter, some darker
      fillBlockyNoise(ctx, 16, 16, 15, 30, 12, 20, 30, 18);
      // Occasional bright grass blade pixel
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        ctx.fillStyle = `rgb(${30 + Math.floor(Math.random() * 15)},${55 + Math.floor(Math.random() * 20)},${20 + Math.floor(Math.random() * 10)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }, true);
  }
  return _grassTex.clone();
}

export function createRoadTexture(): THREE.CanvasTexture {
  if (!_roadTex) {
    _roadTex = createCanvasTexture(64, 32, (ctx) => {
      // Base asphalt — mid-grey so detail is visible after color multiply
      fillBlockyNoise(ctx, 64, 32, 40, 40, 42, 18, 18, 14);

      // Worn lighter patches — tire wear, old repairs
      for (let i = 0; i < 10; i++) {
        const px = Math.floor(Math.random() * 54);
        const py = Math.floor(Math.random() * 24);
        const pw = Math.floor(Math.random() * 8) + 2;
        const ph = Math.floor(Math.random() * 4) + 2;
        const v = 60 + Math.floor(Math.random() * 25);
        ctx.fillStyle = `rgb(${v},${v},${v - 4})`;
        ctx.fillRect(px, py, pw, ph);
      }

      // Cracks — near-black jagged lines
      for (let c = 0; c < 6; c++) {
        let cx = Math.floor(Math.random() * 64);
        let cy = Math.floor(Math.random() * 32);
        const len = 10 + Math.floor(Math.random() * 16);
        for (let s = 0; s < len; s++) {
          if (cx >= 0 && cx < 64 && cy >= 0 && cy < 32) {
            ctx.fillStyle = `rgb(${4 + Math.floor(Math.random() * 8)},${4 + Math.floor(Math.random() * 6)},${4 + Math.floor(Math.random() * 6)})`;
            ctx.fillRect(cx, cy, 1, 1);
          }
          const dir = Math.random();
          if (dir < 0.5) cx += 1;
          else if (dir < 0.7) cx -= 1;
          else if (dir < 0.85) cy += 1;
          else cy -= 1;
        }
      }

      // Oil / dark wet stains
      for (let i = 0; i < 6; i++) {
        const sx = Math.floor(Math.random() * 58);
        const sy = Math.floor(Math.random() * 26);
        const sw = Math.floor(Math.random() * 4) + 2;
        const sh = Math.floor(Math.random() * 3) + 1;
        ctx.fillStyle = `rgb(${12 + Math.floor(Math.random() * 6)},${12 + Math.floor(Math.random() * 5)},${15 + Math.floor(Math.random() * 5)})`;
        ctx.fillRect(sx, sy, sw, sh);
      }

      // Bright aggregate speckle — gravel bits poking through
      for (let i = 0; i < 40; i++) {
        const gx = Math.floor(Math.random() * 64);
        const gy = Math.floor(Math.random() * 32);
        const v = 70 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${v},${v},${v - 5})`;
        ctx.fillRect(gx, gy, 1, 1);
      }

      // Patched repair strips — slightly different tone rectangles
      for (let i = 0; i < 3; i++) {
        const px = Math.floor(Math.random() * 50);
        const py = Math.floor(Math.random() * 28);
        const pw = Math.floor(Math.random() * 10) + 4;
        const ph = Math.floor(Math.random() * 2) + 1;
        const v = 35 + Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${v},${v + 2},${v})`;
        ctx.fillRect(px, py, pw, ph);
      }

      // Lane edge markings
      for (let x = 0; x < 64; x++) {
        const v = 55 + Math.floor(Math.random() * 15);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, 0, 1, 1);
        ctx.fillRect(x, 31, 1, 1);
      }
    }, true);
  }
  return _roadTex.clone();
}

export function createRailwayTexture(): THREE.CanvasTexture {
  if (!_railwayTex) {
    _railwayTex = createCanvasTexture(16, 8, (ctx) => {
      // Dark gravel — near-black with brown/grey speckle
      fillBlockyNoise(ctx, 16, 8, 10, 10, 10, 14, 12, 10);
      // Some lighter gravel stones
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 8);
        const v = 25 + Math.floor(Math.random() * 10);
        ctx.fillStyle = `rgb(${v},${v - 2},${v - 4})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }, true);
  }
  return _railwayTex.clone();
}

// ====== ENTITY TEXTURES (pixelated, mapped onto box faces) ======

let _carBodyTex: THREE.CanvasTexture | null = null;
let _carCabinTex: THREE.CanvasTexture | null = null;
let _treeTrunkTex: THREE.CanvasTexture | null = null;
let _treeLeafTex: THREE.CanvasTexture | null = null;
let _logTex: THREE.CanvasTexture | null = null;
let _logRingTex: THREE.CanvasTexture | null = null;
let _trainBodyTex: THREE.CanvasTexture | null = null;
let _trainWagonTex: THREE.CanvasTexture | null = null;
let _wheelTex: THREE.CanvasTexture | null = null;

export function getCarBodyTexture(): THREE.CanvasTexture {
  if (!_carBodyTex) {
    // Tonal variation — the base color tints this, so we use greyscale noise
    _carBodyTex = createCanvasTexture(8, 4, (ctx) => {
      fillBlockyNoise(ctx, 8, 4, 180, 180, 180, 60, 60, 60);
      // Darker bottom row (shadow under body)
      for (let x = 0; x < 8; x++) {
        const v = 140 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, 3, 1, 1);
      }
      // Lighter top highlight row
      for (let x = 0; x < 8; x++) {
        const v = 220 + Math.floor(Math.random() * 35);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, 0, 1, 1);
      }
    }, true);
  }
  return _carBodyTex;
}

export function getCarCabinTexture(): THREE.CanvasTexture {
  if (!_carCabinTex) {
    _carCabinTex = createCanvasTexture(8, 4, (ctx) => {
      // Dark cabin glass with slight blue/teal variation
      fillBlockyNoise(ctx, 8, 4, 15, 18, 30, 12, 12, 20);
      // Faint window reflection highlight
      ctx.fillStyle = 'rgb(35,40,55)';
      ctx.fillRect(1, 0, 3, 1);
      ctx.fillRect(5, 0, 2, 1);
    }, true);
  }
  return _carCabinTex;
}

export function getTreeTrunkTexture(): THREE.CanvasTexture {
  if (!_treeTrunkTex) {
    _treeTrunkTex = createCanvasTexture(4, 8, (ctx) => {
      // Brown bark — vertical grain, darker and lighter streaks
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 4; x++) {
          const base = x % 2 === 0 ? 0 : 8;
          const r = 45 + base + Math.floor(Math.random() * 15);
          const g = 28 + base + Math.floor(Math.random() * 10);
          const b = 18 + Math.floor(Math.random() * 8);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }, true);
  }
  return _treeTrunkTex;
}

export function getTreeLeafTexture(): THREE.CanvasTexture {
  if (!_treeLeafTex) {
    _treeLeafTex = createCanvasTexture(8, 8, (ctx) => {
      // Green foliage — dark base with lighter leaf highlights
      fillBlockyNoise(ctx, 8, 8, 8, 40, 8, 12, 30, 12);
      // Brighter leaf spots
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 8);
        const y = Math.floor(Math.random() * 8);
        ctx.fillStyle = `rgb(${15 + Math.floor(Math.random() * 10)},${65 + Math.floor(Math.random() * 20)},${12 + Math.floor(Math.random() * 8)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }, true);
  }
  return _treeLeafTex;
}

export function getLogTexture(): THREE.CanvasTexture {
  if (!_logTex) {
    _logTex = createCanvasTexture(8, 4, (ctx) => {
      // Warm brown wood grain
      fillBlockyNoise(ctx, 8, 4, 50, 28, 16, 20, 14, 10);
      // Lighter grain streaks
      for (let x = 0; x < 8; x++) {
        if (Math.random() > 0.5) {
          const r = 70 + Math.floor(Math.random() * 15);
          const g = 42 + Math.floor(Math.random() * 10);
          const b = 22 + Math.floor(Math.random() * 8);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, 1 + Math.floor(Math.random() * 2), 1, 1);
        }
      }
    }, true);
  }
  return _logTex;
}

export function getLogRingTexture(): THREE.CanvasTexture {
  if (!_logRingTex) {
    _logRingTex = createCanvasTexture(4, 4, (ctx) => {
      // Darker bark ring
      fillBlockyNoise(ctx, 4, 4, 30, 14, 5, 15, 10, 8);
    }, true);
  }
  return _logRingTex;
}

export function getTrainBodyTexture(): THREE.CanvasTexture {
  if (!_trainBodyTex) {
    _trainBodyTex = createCanvasTexture(8, 8, (ctx) => {
      // Dark steel blue with panel variation
      fillBlockyNoise(ctx, 8, 8, 18, 18, 32, 14, 14, 18);
      // Panel line (horizontal darker stripe)
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = `rgb(${10 + Math.floor(Math.random() * 5)},${10 + Math.floor(Math.random() * 5)},${20 + Math.floor(Math.random() * 5)})`;
        ctx.fillRect(x, 4, 1, 1);
      }
      // Subtle highlight along top
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = `rgb(${28 + Math.floor(Math.random() * 8)},${28 + Math.floor(Math.random() * 8)},${45 + Math.floor(Math.random() * 10)})`;
        ctx.fillRect(x, 0, 1, 1);
      }
    }, true);
  }
  return _trainBodyTex;
}

export function getTrainWagonTexture(): THREE.CanvasTexture {
  if (!_trainWagonTex) {
    _trainWagonTex = createCanvasTexture(8, 8, (ctx) => {
      // Slightly different shade from loco — darker, more muted
      fillBlockyNoise(ctx, 8, 8, 12, 12, 22, 10, 10, 14);
      // Rivet line
      for (let x = 0; x < 8; x += 2) {
        ctx.fillStyle = 'rgb(22,22,32)';
        ctx.fillRect(x, 3, 1, 1);
      }
    }, true);
  }
  return _trainWagonTex;
}

export function getWheelTexture(): THREE.CanvasTexture {
  if (!_wheelTex) {
    _wheelTex = createCanvasTexture(4, 4, (ctx) => {
      // Near-black rubber with subtle variation
      fillBlockyNoise(ctx, 4, 4, 6, 6, 6, 10, 10, 10);
      // Slightly lighter center
      ctx.fillStyle = 'rgb(18,18,18)';
      ctx.fillRect(1, 1, 2, 2);
    }, true);
  }
  return _wheelTex;
}
