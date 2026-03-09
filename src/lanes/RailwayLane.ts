import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Train } from '../entities/Train';
import {Player} from "../entities/Player";

export class RailwayLane extends Lane {
  private train: Train;

  constructor(zIndex: number, direction?: number, waitDuration?: number) {
    super('railway', zIndex);

    // Very dark gravel strip
    const strip = this.createStrip(0x121212);
    this.mesh.add(strip);

    // rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.6, roughness: 0.3 });
    for (const zOff of [-0.15, 0.15]) {
      const railGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.06, 0.06);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.03, zOff);
      this.mesh.add(rail);
    }

    // wooden ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e });
    const tieGeo = new THREE.BoxGeometry(0.08, 0.03, 0.5);
    for (let x = -LANE_WIDTH / 2; x < LANE_WIDTH / 2; x += 0.5) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(x, 0.015, 0);
      this.mesh.add(tie);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const wait = waitDuration ?? 3 + Math.random() * 3;

    this.train = new Train(dir, wait);
    this.mesh.add(this.train.mesh);

    // warning signals on both sides of the lane
    const sig1 = this.train.signalLight.clone();
    sig1.position.set(-LANE_WIDTH / 2 + 0.5, 0.3, 0);
    this.mesh.add(sig1);

    const sig2 = this.train.signalLight; // original
    sig2.position.set(LANE_WIDTH / 2 - 0.5, 0.3, 0);
    this.mesh.add(sig2);
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;

    const px = player.position.x;        
    const tx = this.train.mesh.position.x;  

    const train_half = 2.5; // both
    const player_half = 0.3; // need to be fine tuned

    return Math.abs(px - tx) <= (train_half + player_half);
  }

  update(delta: number): void {
    this.train.update(delta);
  }
}
