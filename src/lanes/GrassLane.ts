import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Tree } from '../entities/Tree';
import {Player} from "../entities/Player";

export class GrassLane extends Lane {
  private trees: Tree[] = [];

  constructor(zIndex: number, treePositions?: number[]) {
    super('grass', zIndex);

    // Dark grass strip
    const strip = this.createStrip(0x1a3a1a);
    this.mesh.add(strip);

    // Subtle edge lines
    const edgeGeo = new THREE.PlaneGeometry(LANE_WIDTH, 0.04);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0f2a0f });
    for (const zOff of [-0.5, 0.5]) {
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.y = 0.011;
      edge.position.z = zOff;
      this.mesh.add(edge);
    }

    const positions = treePositions ?? this.randomTreePositions();
    for (const x of positions) {
      const tree = new Tree();
      tree.mesh.position.set(x, 0, 0);
      this.mesh.add(tree.mesh);
      this.trees.push(tree);
    }
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;

    const px = Math.round(player.position.x);

    for (const tree of this.trees) {
      const tx = Math.round(tree.mesh.position.x);
      if (tx === px) return true;
    }
    return false;
  }

  private randomTreePositions(): number[] {
    const half = LANE_WIDTH / 2 - 1;
    const count = Math.floor(Math.random() * 4) + 1;
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * half * 2 - half) + 0.5;
      // avoid center 3 tiles so player can always pass through
      if (Math.abs(x) < 1.5) continue;
      positions.push(x);
    }
    return positions;
  }

  update(_delta: number): void {}
}
