import * as THREE from 'three';
import { Entity } from './Entity';
import { getTreeTrunkTexture, getTreeLeafTexture } from '../scene/Textures';

// Shared geometries and materials — created once, reused by every Tree
const trunkGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
const trunkTex = getTreeTrunkTexture();
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, map: trunkTex, roughness: 0.7 });
const leafTex = getTreeLeafTexture();
const leafMat = new THREE.MeshStandardMaterial({ color: 0x0d3b0d, map: leafTex, roughness: 0.6, metalness: 0.05 });
const bottomGeo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
const topGeo = new THREE.BoxGeometry(0.5, 0.35, 0.5);

export class Tree extends Entity {
  constructor() {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    trunk.castShadow = true;
    group.add(trunk);

    const bottom = new THREE.Mesh(bottomGeo, leafMat);
    bottom.position.y = 0.7;
    bottom.castShadow = true;
    group.add(bottom);

    const top = new THREE.Mesh(topGeo, leafMat);
    top.position.y = 1.05;
    top.castShadow = true;
    group.add(top);

    super(group);
  }

  update(_delta: number): void {}
}
