import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Tree } from '../entities/Tree';
import { Player } from '../entities/Player';
import { createGrassTexture } from '../scene/Textures';

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
    const edgeGeo = new THREE.PlaneGeometry(LANE_WIDTH, 0.04);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x142e14 });
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

    const px = player.position.x;
    const playerHalf = 0.18;
    const treeHalf = 0.35; // trunk + foliage radius

    for (const tree of this.trees) {
      const tx = tree.mesh.position.x;
      if (Math.abs(px - tx) < playerHalf + treeHalf) return true;
    }
    return false;
  }

  private randomTreePositions(): number[] {
    const half = 9; // trees only in play area, not across full lane width
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
