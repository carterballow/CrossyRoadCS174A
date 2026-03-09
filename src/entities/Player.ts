import * as THREE from 'three';
import { Entity } from './Entity';

const STEP = 1;
const MOVE_DURATION = 0.12;
const HOP_HEIGHT = 0.3;

export type DeathType = 'squash' | 'drown' | null;

export class Player extends Entity {
  private currentPos = new THREE.Vector3(0, 0, 0);
  private targetPos = new THREE.Vector3(0, 0, 0);
  private moveProgress = 1; // 1 = idle
  private targetRotationY = 0;
  private modelGroup: THREE.Group;

  // Death animation state
  private deathType: DeathType = null;
  private deathTimer = 0;
  private deathDuration = 0;

  constructor() {
    const group = new THREE.Group();
    const model = new THREE.Group();

    // body
    const bodyGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      emissive: 0x555555,
      emissiveIntensity: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.22;
    body.castShadow = true;
    model.add(body);

    // head
    const headGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 0.51;
    head.castShadow = true;
    model.add(head);

    // eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.04);
    for (const xOff of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xOff, 0.55, 0.13);
      model.add(eye);
    }

    // beak
    const beakGeo = new THREE.BoxGeometry(0.1, 0.07, 0.12);
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.15,
    });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.48, 0.19);
    model.add(beak);

    // comb
    const combGeo = new THREE.BoxGeometry(0.07, 0.1, 0.12);
    const combMat = new THREE.MeshStandardMaterial({
      color: 0xf44336,
      emissive: 0xf44336,
      emissiveIntensity: 0.2,
    });
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 0.69, 0);
    model.add(comb);

    // wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      emissive: 0x222222,
      emissiveIntensity: 0.2,
    });
    const wingGeo = new THREE.BoxGeometry(0.08, 0.22, 0.2);
    for (const xOff of [-0.2, 0.2]) {
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(xOff, 0.24, 0);
      wing.castShadow = true;
      model.add(wing);
    }

    // feet
    const feetMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
    const footGeo = new THREE.BoxGeometry(0.1, 0.04, 0.14);
    for (const xOff of [-0.08, 0.08]) {
      const foot = new THREE.Mesh(footGeo, feetMat);
      foot.position.set(xOff, 0.02, 0.03);
      model.add(foot);
    }

    group.add(model);
    super(group);
    this.modelGroup = model;
  }

  get isMoving(): boolean {
    return this.moveProgress < 1;
  }

  get isDying(): boolean {
    return this.deathType !== null;
  }

  get deathAnimDone(): boolean {
    return this.deathType !== null && this.deathTimer >= this.deathDuration;
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  move(dx: number, dz: number): void {
    if (this.isMoving || this.isDying) return;

    this.currentPos.copy(this.mesh.position);
    this.targetPos.set(
      this.currentPos.x + dx * STEP,
      this.currentPos.y,
      this.currentPos.z + dz * STEP,
    );
    this.moveProgress = 0;

    this.targetRotationY = Math.atan2(dx, dz);
  }

  playDeath(type: 'squash' | 'drown'): void {
    this.deathType = type;
    this.deathTimer = 0;
    this.deathDuration = type === 'squash' ? 0.4 : 0.8;
  }

  update(delta: number): void {
    if (this.isDying) {
      this.deathTimer = Math.min(this.deathTimer + delta, this.deathDuration);
      const t = this.deathTimer / this.deathDuration;

      if (this.deathType === 'squash') {
        this.updateSquashDeath(t);
      } else {
        this.updateDrownDeath(t);
      }
      return;
    }

    const rot = this.mesh.rotation;
    const diff = this.targetRotationY - rot.y;
    const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
    rot.y += wrapped * Math.min(1, delta * 15);

    if (!this.isMoving) {
      this.modelGroup.position.y = 0;
      this.modelGroup.scale.set(1, 1, 1);
      return;
    }

    this.moveProgress = Math.min(1, this.moveProgress + delta / MOVE_DURATION);
    const t = this.easeOut(this.moveProgress);

    this.mesh.position.lerpVectors(this.currentPos, this.targetPos, t);

    const hopT = 4 * this.moveProgress * (1 - this.moveProgress);
    this.modelGroup.position.y = hopT * HOP_HEIGHT;

    const squash = 1 + hopT * 0.15;
    const stretch = 1 - hopT * 0.08;
    this.modelGroup.scale.set(stretch, squash, stretch);

    if (this.moveProgress >= 1) {
      this.mesh.position.copy(this.targetPos);
      this.modelGroup.position.y = 0;
      this.modelGroup.scale.set(1, 1, 1);
    }
  }

  // Hit by car/train — pancake flat, pop up, spin, settle
  private updateSquashDeath(t: number): void {
    if (t < 0.3) {
      // Slam down flat
      const st = t / 0.3;
      const ease = st * st;
      this.modelGroup.scale.set(1 + ease * 1.2, Math.max(0.05, 1 - ease * 0.95), 1 + ease * 1.2);
      this.modelGroup.position.y = 0;
    } else if (t < 0.7) {
      // Pop up and spin
      const st = (t - 0.3) / 0.4;
      const bounce = Math.sin(st * Math.PI);
      this.modelGroup.position.y = bounce * 1.5;
      this.modelGroup.scale.set(0.6 + bounce * 0.3, 0.6 + bounce * 0.3, 0.6 + bounce * 0.3);
      this.mesh.rotation.y += 0.3;
      this.mesh.rotation.z = st * Math.PI * 2;
    } else {
      // Fall back down, stay flat
      const st = (t - 0.7) / 0.3;
      const ease = st * st;
      this.modelGroup.position.y = (1 - ease) * 0.5;
      this.modelGroup.scale.set(1.8, 0.05, 1.8);
      this.mesh.rotation.z = Math.PI * 2;
    }
  }

  // Fell in water — sink and bob
  private updateDrownDeath(t: number): void {
    if (t < 0.15) {
      // Quick splash stretch upward
      const st = t / 0.15;
      this.modelGroup.scale.set(1 - st * 0.3, 1 + st * 0.4, 1 - st * 0.3);
      this.modelGroup.position.y = st * 0.15;
    } else if (t < 0.4) {
      // Sink down
      const st = (t - 0.15) / 0.25;
      const ease = st * st;
      this.modelGroup.position.y = 0.15 - ease * 0.55;
      this.modelGroup.scale.set(0.7 + st * 0.1, 1.4 - st * 0.6, 0.7 + st * 0.1);
      // Tilt forward as if face-planting into water
      this.modelGroup.rotation.x = st * 0.3;
    } else if (t < 0.7) {
      // Bob back up slightly
      const st = (t - 0.4) / 0.3;
      const bob = Math.sin(st * Math.PI) * 0.1;
      this.modelGroup.position.y = -0.4 + bob;
      this.modelGroup.scale.set(0.8, 0.8, 0.8);
      this.modelGroup.rotation.x = 0.3 + st * 0.2;
    } else {
      // Final sink below surface
      const st = (t - 0.7) / 0.3;
      const ease = st * st;
      this.modelGroup.position.y = -0.3 - ease * 0.4;
      this.modelGroup.scale.set(0.8 - st * 0.3, 0.8 - st * 0.3, 0.8 - st * 0.3);
      this.modelGroup.rotation.x = 0.5;
    }
  }

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
