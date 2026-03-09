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

export function createWaterTexture(): THREE.CanvasTexture {
  return createCanvasTexture(256, 256, (ctx) => {
    // Deep water gradient base
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#08203a');
    grad.addColorStop(0.5, '#0a2a5a');
    grad.addColorStop(1, '#081830');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Layered horizontal wave bands
    for (let layer = 0; layer < 5; layer++) {
      const freq = 0.02 + layer * 0.01;
      const amp = 2 + layer * 1.5;
      const phase = layer * 40;
      const alpha = 0.06 + layer * 0.02;

      ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
      ctx.lineWidth = 1.5 - layer * 0.15;

      for (let row = 0; row < 256; row += 8 + layer * 3) {
        ctx.beginPath();
        for (let x = 0; x <= 256; x += 2) {
          const y = row + Math.sin(x * freq + phase) * amp
                        + Math.sin(x * freq * 2.3 + phase * 0.7) * amp * 0.4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // Ripple rings scattered across the surface
    for (let i = 0; i < 12; i++) {
      const cx = Math.random() * 256;
      const cy = Math.random() * 256;
      const maxR = 8 + Math.random() * 12;
      for (let r = maxR; r > 2; r -= 3) {
        const alpha = 0.04 + (1 - r / maxR) * 0.08;
        ctx.strokeStyle = `rgba(150, 210, 255, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Bright specular highlights — small bright spots
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const alpha = Math.random() * 0.12 + 0.03;
      const radius = Math.random() * 2 + 0.5;
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
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
