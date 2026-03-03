import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Tree } from '../entities/Tree';
import { Player } from '../entities/Player';
import { createGrassTexture } from '../scene/Textures';

// Shared geometry/materials across all grass lanes
const edgeGeo = new THREE.PlaneGeometry(LANE_WIDTH, 0.04);
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x142e14 });

export class GrassLane extends Lane {
  private trees: Tree[] = [];

  constructor(zIndex: number, treePositions?: number[]) {
    super('grass', zIndex);

    // Dark grass strip with texture
    const tex = createGrassTexture();
    tex.repeat.set(LANE_WIDTH, 1);
    const strip = this.createStrip(0x1e4420, tex);
    this.mesh.add(strip);

    // Subtle edge lines
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
      if (tree.mesh.position.x === px) return true;
    }
    return false;
  }

  private randomTreePositions(): number[] {
    const count = Math.floor(Math.random() * 3) + 1;
    // Candidate integer positions — avoid center 3 tiles so player can pass
    const candidates: number[] = [];
    for (let x = -8; x <= 8; x++) {
      if (Math.abs(x) < 2) continue;
      candidates.push(x);
    }
    // Shuffle and pick, ensuring no adjacent trees
    const positions: number[] = [];
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    for (const x of shuffled) {
      if (positions.length >= count) break;
      if (positions.some((p) => Math.abs(p - x) < 2)) continue;
      positions.push(x);
    }
    return positions;
  }

  update(_delta: number): void {}
}
