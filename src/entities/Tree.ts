import * as THREE from 'three';
import { Entity } from './Entity';

export class Tree extends Entity {
  constructor() {
    const group = new THREE.Group();

    // trunk
    const trunkGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    trunk.castShadow = true;
    group.add(trunk);

    // foliage — stacked cubes for that Crossy Road voxel look
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

    const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), leafMat);
    bottom.position.y = 0.7;
    bottom.castShadow = true;
    group.add(bottom);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), leafMat);
    top.position.y = 1.05;
    top.castShadow = true;
    group.add(top);

    super(group);
  }

  update(_delta: number): void {}
}
