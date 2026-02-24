import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Log } from '../entities/Log';
import { Player } from '../entities/Player';
import { createWaterTexture } from '../scene/Textures';

export class RiverLane extends Lane {
  private logs: Log[] = [];
  private direction: number;
  private waterMat: THREE.MeshStandardMaterial;
  private elapsed = Math.random() * 100; // stagger animation

  constructor(zIndex: number, direction?: number, speed?: number, logCount?: number) {
    super('river', zIndex);

    // River bed (dark bottom visible through water)
    const bedGeo = new THREE.PlaneGeometry(LANE_WIDTH, 1);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x050510 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = -0.25;
    this.mesh.add(bed);

    // Water surface with alpha blending
    const waterGeo = new THREE.PlaneGeometry(LANE_WIDTH, 1, 20, 1);
    const waterTex = createWaterTexture();
    waterTex.repeat.set(LANE_WIDTH / 2, 1);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a2a5a,
      map: waterTex,
      emissive: 0x001144,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.65,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const water = new THREE.Mesh(waterGeo, this.waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.1;
    water.receiveShadow = true;
    water.renderOrder = 1;
    this.mesh.add(water);

    // Shore edges (subtle bank lines)
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a10,
      emissive: 0x0a0a05,
      emissiveIntensity: 0.1,
    });
    const shoreGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.08, 0.08);
    for (const zOff of [-0.5, 0.5]) {
      const shore = new THREE.Mesh(shoreGeo, shoreMat);
      shore.position.set(0, -0.06, zOff);
      this.mesh.add(shore);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.direction = dir;
    const spd = speed ?? 0.8 + Math.random() * 1.2;
    const count = logCount ?? Math.floor(Math.random() * 2) + 2;
    const bounds = LANE_WIDTH / 2;
    const logLength = 1.5 + Math.random() * 1.5;
    const spacing = LANE_WIDTH / count;

    for (let i = 0; i < count; i++) {
      const log = new Log(dir, spd, bounds, logLength);
      log.mesh.position.set(-bounds + i * spacing + spacing / 2, 0, 0);
      this.mesh.add(log.mesh);
      this.logs.push(log);
    }
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;

    return !this.isOnLog(player);
  }

  isOnLog(player: Player): boolean {
    const px = player.position.x;
    const playerHalf = 0.3;

    for (const log of this.logs) {
      const lx = log.mesh.position.x;
      const logHalf = log.length / 2;
      if (Math.abs(px - lx) < logHalf + playerHalf) {
        return true;
      }
    }
    return false;
  }

  getLogVelocity(): number {
    if (this.logs.length === 0) return 0;
    return this.direction * this.logs[0].speed;
  }

  update(delta: number): void {
    for (const log of this.logs) {
      log.update(delta);
    }

    // Animate water opacity for shimmer effect
    this.elapsed += delta;
    const shimmer = 0.6 + 0.08 * Math.sin(this.elapsed * 2.5);
    this.waterMat.opacity = shimmer;
    this.waterMat.emissiveIntensity = 0.25 + 0.1 * Math.sin(this.elapsed * 1.8 + 1);
  }
}
