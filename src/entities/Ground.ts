import * as THREE from 'three';
import { Entity } from './Entity';

const TILE_SIZE = 1;
const GRID_WIDTH = 60;
const GRID_DEPTH = 60;

export class Ground extends Entity {
  constructor() {
    const group = new THREE.Group();

    const planeGeo = new THREE.PlaneGeometry(
      GRID_WIDTH * TILE_SIZE,
      GRID_DEPTH * TILE_SIZE,
    );
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    group.add(plane);

    const grid = new THREE.GridHelper(
      GRID_WIDTH * TILE_SIZE,
      GRID_WIDTH,
      0x388e3c,
      0x388e3c,
    );
    grid.position.y = 0.01;
    group.add(grid);

    super(group);
  }

  update(_delta: number): void {
    // static — nothing to update yet
  }
}
