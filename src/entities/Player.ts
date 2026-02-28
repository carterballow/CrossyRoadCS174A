import * as THREE from 'three';
import { Entity } from './Entity';

const STEP = 1;
const MOVE_DURATION = 0.12;
const HOP_HEIGHT = 0.3;

export class Player extends Entity {
  private currentPos = new THREE.Vector3(0, 0, 0);
  private targetPos = new THREE.Vector3(0, 0, 0);
  private moveProgress = 1; // 1 = idle
  private targetRotationY = 0;
  private modelGroup: THREE.Group;

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

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  move(dx: number, dz: number): void {
    if (this.isMoving) return;

    this.currentPos.copy(this.mesh.position);
    this.targetPos.set(
      this.currentPos.x + dx * STEP,
      this.currentPos.y,
      this.currentPos.z + dz * STEP,
    );
    this.moveProgress = 0;

    this.targetRotationY = Math.atan2(dx, dz);
  }

  update(delta: number): void {
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

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
