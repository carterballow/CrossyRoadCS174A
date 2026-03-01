import * as THREE from 'three';
import { Entity } from './Entity';

const CAR_COLORS = [0xcc2233, 0x2266cc, 0xccaa22, 0x22aa44, 0xcc6622, 0x8833aa];

export class Car extends Entity {
  readonly speed: number;
  private direction: number;
  private bounds: number;

  // Model is always built facing +x direction.
  // RoadLane rotates the group via rotation.y for direction.
  constructor(direction: number, speed: number, bounds: number) {
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const group = new THREE.Group();

    // body — flat color, no emissive glow
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.4, 0.75);
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    group.add(body);

    // cabin
    const cabinGeo = new THREE.BoxGeometry(0.8, 0.3, 0.7);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.15, 0.55, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // headlights (front = +x)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffdd,
      emissiveIntensity: 1.0,
    });
    const hlGeo = new THREE.BoxGeometry(0.06, 0.1, 0.12);
    for (const zOff of [-0.28, 0.28]) {
      const hl = new THREE.Mesh(hlGeo, headlightMat);
      hl.position.set(0.91, 0.18, zOff);
      group.add(hl);
    }

    // headlight point light
    const headlightPL = new THREE.PointLight(0xffeedd, 1.2, 3.5, 2);
    headlightPL.position.set(1.1, 0.25, 0);
    group.add(headlightPL);

    // taillights (rear = -x)
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0x880000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });
    for (const zOff of [-0.28, 0.28]) {
      const tl = new THREE.Mesh(hlGeo, taillightMat);
      tl.position.set(-0.91, 0.18, zOff);
      group.add(tl);
    }

    // taillight point light
    const taillightPL = new THREE.PointLight(0xff2200, 0.4, 2, 2);
    taillightPL.position.set(-1.05, 0.25, 0);
    group.add(taillightPL);

    // wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelGeo = new THREE.BoxGeometry(0.25, 0.18, 0.1);
    for (const xOff of [-0.6, 0.6]) {
      for (const zOff of [-0.38, 0.38]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(xOff, 0.09, zOff);
        group.add(wheel);
      }
    }

    super(group);
    this.direction = direction;
    this.speed = speed;
    this.bounds = bounds;
  }

  update(delta: number): void {
    this.mesh.position.x += this.direction * this.speed * delta;

    if (this.direction > 0 && this.mesh.position.x > this.bounds) {
      this.mesh.position.x = -this.bounds;
    } else if (this.direction < 0 && this.mesh.position.x < -this.bounds) {
      this.mesh.position.x = this.bounds;
    }
  }
}
