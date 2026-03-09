import * as THREE from 'three';
import { Entity } from './Entity';

// Neon city-night car palette
const CAR_COLORS = [0xff1744, 0x00e5ff, 0xffea00, 0x76ff03, 0xff9100, 0xd500f9];

export class Car extends Entity {
  readonly speed: number;
  private direction: number;
  private bounds: number;

  constructor(direction: number, speed: number, bounds: number) {
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const group = new THREE.Group();

    // body with subtle emissive glow
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.35, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.175;
    body.castShadow = true;
    group.add(body);

    // cabin (dark tinted windows)
    const cabinGeo = new THREE.BoxGeometry(0.5, 0.25, 0.55);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(direction * -0.1, 0.475, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // headlights
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.8,
    });
    const hlGeo = new THREE.BoxGeometry(0.06, 0.08, 0.08);
    for (const zOff of [-0.22, 0.22]) {
      const hl = new THREE.Mesh(hlGeo, headlightMat);
      hl.position.set(direction * 0.46, 0.15, zOff);
      group.add(hl);
    }

    // taillights
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.6,
    });
    for (const zOff of [-0.22, 0.22]) {
      const tl = new THREE.Mesh(hlGeo, taillightMat);
      tl.position.set(direction * -0.46, 0.15, zOff);
      group.add(tl);
    }

    super(group);
    this.direction = direction;
    this.speed = speed;
    this.bounds = bounds;
  }

  update(delta: number): void {
    this.mesh.position.x += this.direction * this.speed * delta;

    // wrap around when out of bounds
    if (this.direction > 0 && this.mesh.position.x > this.bounds) {
      this.mesh.position.x = -this.bounds;
    } else if (this.direction < 0 && this.mesh.position.x < -this.bounds) {
      this.mesh.position.x = this.bounds;
    }
  }
}
