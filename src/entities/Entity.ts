import * as THREE from 'three';

export abstract class Entity {
  readonly mesh: THREE.Object3D;

  constructor(mesh: THREE.Object3D) {
    this.mesh = mesh;
  }

  abstract update(delta: number): void;

  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
