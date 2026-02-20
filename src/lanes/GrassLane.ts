import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Tree } from '../entities/Tree';

export class GrassLane extends Lane {
  private trees: Tree[] = [];

  constructor(zIndex: number, treePositions?: number[]) {
    super('grass', zIndex);

    // green strip
    const strip = this.createStrip(0x4caf50);
    this.mesh.add(strip);

    // subtle edge lines
    const edgeGeo = new THREE.PlaneGeometry(LANE_WIDTH, 0.04);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x388e3c });
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
