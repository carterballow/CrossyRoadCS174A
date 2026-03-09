import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Train } from '../entities/Train';
import { Player } from '../entities/Player';
import { createRailwayTexture } from '../scene/Textures';

export class RailwayLane extends Lane {
  private train: Train;
  private trainDir: number;

  constructor(zIndex: number, direction?: number, waitDuration?: number) {
    super('railway', zIndex);

    // Dark gravel strip with texture
    const tex = createRailwayTexture();
    tex.repeat.set(LANE_WIDTH / 2, 1);
    const strip = this.createStrip(0x1a1a1a, tex);
    this.mesh.add(strip);

    // rails — wider apart to match bigger train
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.6, roughness: 0.3 });
    for (const zOff of [-0.25, 0.25]) {
      const railGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.06, 0.06);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.03, zOff);
      this.mesh.add(rail);
    }

    // wooden ties — only in visible play area for performance
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e });
    const tieGeo = new THREE.BoxGeometry(0.08, 0.03, 0.7);
    for (let x = -14; x < 14; x += 0.5) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(x, 0.015, 0);
      this.mesh.add(tie);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.trainDir = dir;
    const wait = waitDuration ?? 3 + Math.random() * 3;

    this.train = new Train(dir, wait);
    this.mesh.add(this.train.mesh);

    // warning signals at edges of play area
    const sig1 = this.train.signalLight.clone();
    sig1.position.set(-9.5, 0.4, 0);
    this.mesh.add(sig1);

    const sig2 = this.train.signalLight;
    sig2.position.set(9.5, 0.4, 0);
    this.mesh.add(sig2);
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;

    const px = player.position.x;
    const tx = this.train.mesh.position.x;

    const player_half = 0.18;
    // Loco is centered at tx, half-length 1.1
    // Wagons trail behind: wagon i at tx - dir * i * 1.9, each ~1.7 wide (half = 0.85)
    const locoFront = tx + this.trainDir * 1.1;
    const lastWagonCenter = tx - this.trainDir * 7 * 1.9;
    const lastWagonBack = lastWagonCenter - this.trainDir * 0.85;

    const minX = Math.min(locoFront, lastWagonBack);
    const maxX = Math.max(locoFront, lastWagonBack);

    return px + player_half > minX && px - player_half < maxX;
  }

  update(delta: number): void {
    this.train.update(delta);
  }
}
