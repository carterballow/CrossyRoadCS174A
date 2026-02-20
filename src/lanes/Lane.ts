import * as THREE from 'three';

export const LANE_WIDTH = 20;

export type LaneType = 'grass' | 'road' | 'railway';

export abstract class Lane {
  readonly mesh: THREE.Group;
  readonly zIndex: number;
  readonly type: LaneType;

  constructor(type: LaneType, zIndex: number) {
    this.type = type;
    this.zIndex = zIndex;
    this.mesh = new THREE.Group();
    this.mesh.position.z = zIndex;
  }

  protected createStrip(color: number): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(LANE_WIDTH, 1);
    const mat = new THREE.MeshStandardMaterial({ color });
    const strip = new THREE.Mesh(geo, mat);
    strip.rotation.x = -Math.PI / 2;
    strip.receiveShadow = true;
    return strip;
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
