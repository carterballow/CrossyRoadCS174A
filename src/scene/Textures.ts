import * as THREE from 'three';

function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createGrassTexture(): THREE.CanvasTexture {
  return createCanvasTexture(128, 128, (ctx) => {
    // Base dark green
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, 128, 128);

    // Random grass blades
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const brightness = Math.floor(Math.random() * 30 + 15);
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 20}, ${brightness})`;
      ctx.fillRect(x, y, 1, Math.random() * 3 + 1);
    }
  });
}

export function createRoadTexture(): THREE.CanvasTexture {
  return createCanvasTexture(256, 64, (ctx) => {
    // Asphalt base
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 64);

    // Noise grain for asphalt look
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 64;
      const v = Math.floor(Math.random() * 15 + 20);
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Lane edge markings (top and bottom)
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 256, 2);
    ctx.fillRect(0, 62, 256, 2);
  });
}
export function createRailwayTexture(): THREE.CanvasTexture {
  return createCanvasTexture(128, 64, (ctx) => {
    // Dark gravel
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 128, 64);

    // Gravel stones
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 64;
      const v = Math.floor(Math.random() * 20 + 10);
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      const s = Math.random() * 2 + 1;
      ctx.fillRect(x, y, s, s);
    }
  });
}
