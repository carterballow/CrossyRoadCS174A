import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Train } from '../entities/Train';

export class RailwayLane extends Lane {
  private train: Train;

  constructor(zIndex: number, direction?: number, waitDuration?: number) {
    super('railway', zIndex);

    // dark gravel strip
    const strip = this.createStrip(0x424242);
    this.mesh.add(strip);

    // rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e });
    for (const zOff of [-0.15, 0.15]) {
      const railGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.06, 0.06);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.03, zOff);
      this.mesh.add(rail);
    }

    // wooden ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
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

  update(delta: number): void {
    this.train.update(delta);
  }
}
