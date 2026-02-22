import * as THREE from 'three';
import { Entity } from './Entity';

export class Log extends Entity {
  readonly speed: number;
  private direction: number;
  private bounds: number;
  readonly length: number;

  constructor(direction: number, speed: number, bounds: number, length: number) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(length, 0.3, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3e2518 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.05;
    body.castShadow = true;
    group.add(body);

    // bark detail rings
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a1508 });
    const ringGeo = new THREE.BoxGeometry(0.08, 0.32, 0.72);
    for (let i = -length / 2 + 0.3; i < length / 2; i += 0.6) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(i, 0.05, 0);
      group.add(ring);
    }

    super(group);
    this.direction = direction;
    this.speed = speed;
    this.bounds = bounds;
    this.length = length;
  }

  update(delta: number): void {
    this.mesh.position.x += this.direction * this.speed * delta;

    if (this.direction > 0 && this.mesh.position.x > this.bounds + this.length) {
      this.mesh.position.x = -this.bounds - this.length;
    } else if (this.direction < 0 && this.mesh.position.x < -this.bounds - this.length) {
      this.mesh.position.x = this.bounds + this.length;
    }
  }
}
