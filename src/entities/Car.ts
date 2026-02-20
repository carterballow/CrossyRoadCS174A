import * as THREE from 'three';
import { Entity } from './Entity';

const CAR_COLORS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xff8f00];

export class Car extends Entity {
  readonly speed: number;
  private direction: number;
  private bounds: number;

  constructor(direction: number, speed: number, bounds: number) {
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const group = new THREE.Group();

    // body
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.35, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.175;
    body.castShadow = true;
    group.add(body);

    // cabin
    const cabinGeo = new THREE.BoxGeometry(0.5, 0.25, 0.55);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(direction * -0.1, 0.475, 0);
    cabin.castShadow = true;
    group.add(cabin);

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
