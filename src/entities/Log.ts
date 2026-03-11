import * as THREE from 'three';
import { Entity } from './Entity';
import { getLogTexture, getLogRingTexture } from '../scene/Textures';

// Shared materials — created once
const logTex = getLogTexture();
const logBodyMat = new THREE.MeshStandardMaterial({ color: 0x3e2518, map: logTex });
const ringTex = getLogRingTexture();
const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a1508, map: ringTex });
const ringGeo = new THREE.BoxGeometry(0.08, 0.32, 0.72);

export class Log extends Entity {
  readonly speed: number;
  private direction: number;
  private bounds: number;
  readonly length: number;
  private phaseOffset: number;

  constructor(direction: number, speed: number, bounds: number, length: number) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(length, 0.3, 0.7);
    const body = new THREE.Mesh(bodyGeo, logBodyMat);
    body.position.y = 0.05;
    body.castShadow = true;
    group.add(body);

    // bark detail rings
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
    // Random phase so logs don't all bob in sync
    this.phaseOffset = Math.random() * Math.PI * 2;
  }

  update(delta: number, time?: number): void {
    this.mesh.position.x += this.direction * this.speed * delta;

    if (this.direction > 0 && this.mesh.position.x > this.bounds + this.length) {
      this.mesh.position.x = -this.bounds - this.length;
    } else if (this.direction < 0 && this.mesh.position.x < -this.bounds - this.length) {
      this.mesh.position.x = this.bounds + this.length;
    }

    // Bob up/down and rock with the water
    if (time !== undefined) {
      const t = time + this.phaseOffset;
      const x = this.mesh.position.x;

      // Match the water shader's primary wave layers
      const bob =
        Math.sin(x * 1.5 + t * 0.8) * 0.035 +
        Math.sin(x * 2.5 - t * 1.1) * 0.022 +
        Math.sin(x * 4.5 + t * 2.0) * 0.012;

      this.mesh.position.y = bob;

      // Gentle roll (rotation around movement axis)
      this.mesh.rotation.z = Math.sin(t * 1.3 + this.phaseOffset) * 0.04;
      // Slight pitch (nose dipping)
      this.mesh.rotation.x = Math.sin(t * 0.9 + this.phaseOffset * 0.7) * 0.03;
    }
  }
}
