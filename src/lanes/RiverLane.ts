import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Log } from '../entities/Log';
import { Player } from '../entities/Player';

export class RiverLane extends Lane {
  private logs: Log[] = [];
  private direction: number;

  constructor(zIndex: number, direction?: number, speed?: number, logCount?: number) {
    super('river', zIndex);

    // Water surface
    const waterGeo = new THREE.PlaneGeometry(LANE_WIDTH, 1);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a3a,
      emissive: 0x001133,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.15;
    water.receiveShadow = true;
    this.mesh.add(water);

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
    // For river: returns true if player is NOT on a log (i.e., in water = death)
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
  }
}
