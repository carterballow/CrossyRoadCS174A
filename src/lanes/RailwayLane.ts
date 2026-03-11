import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Train } from '../entities/Train';
import { BulletTrain, BULLET_TRAIN_LENGTH } from '../entities/BulletTrain';
import { Player } from '../entities/Player';
import { createRailwayTexture } from '../scene/Textures';

// Shared geometry/materials across all railway lanes
const railMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.6, roughness: 0.3 });
const railGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.06, 0.06);
const tieMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e });
const tieGeo = new THREE.BoxGeometry(0.08, 0.03, 0.7);

const WAGON_SPACING = 1.9;

export class RailwayLane extends Lane {
  private train: Train | BulletTrain;
  private trainDir: number;
  private isBullet: boolean;

  constructor(zIndex: number, direction?: number, waitDuration?: number) {
    super('railway', zIndex);

    // Dark gravel strip with texture
    const tex = createRailwayTexture();
    tex.repeat.set(LANE_WIDTH / 2, 1);
    const strip = this.createStrip(0x1a1a1a, tex);
    this.mesh.add(strip);

    // rails
    for (const zOff of [-0.25, 0.25]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.03, zOff);
      this.mesh.add(rail);
    }

    // wooden ties — InstancedMesh instead of individual meshes
    const tieCount = Math.ceil((14 - (-14)) / 0.5);
    const tieInstanced = new THREE.InstancedMesh(tieGeo, tieMat, tieCount);
    const matrix = new THREE.Matrix4();
    let idx = 0;
    for (let x = -14; x < 14; x += 0.5) {
      matrix.makeTranslation(x, 0.015, 0);
      tieInstanced.setMatrixAt(idx++, matrix);
    }
    tieInstanced.instanceMatrix.needsUpdate = true;
    tieInstanced.count = idx;
    this.mesh.add(tieInstanced);

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.trainDir = dir;

    // 10% chance of a bullet train
    this.isBullet = Math.random() < 0.1;

    if (this.isBullet) {
      this.train = new BulletTrain(dir);
    } else {
      const wait = waitDuration ?? 3 + Math.random() * 3;
      this.train = new Train(dir, wait);
    }
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

    const trainLen = this.isBullet ? BULLET_TRAIN_LENGTH : 8;

    // Loco front edge
    const locoFront = tx + this.trainDir * 1.1;
    // Last wagon trailing edge
    const lastWagonCenter = tx - this.trainDir * (trainLen - 1) * WAGON_SPACING;
    const lastWagonBack = lastWagonCenter - this.trainDir * 0.85;

    const minX = Math.min(locoFront, lastWagonBack);
    const maxX = Math.max(locoFront, lastWagonBack);

    return px + player_half > minX && px - player_half < maxX;
  }

  update(delta: number): void {
    this.train.update(delta);
  }
}
