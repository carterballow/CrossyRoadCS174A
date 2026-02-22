import * as THREE from 'three';
import { Entity } from './Entity';

const STEP = 1;
const MOVE_DURATION = 0.12; // seconds to lerp one tile

export class Player extends Entity {
  private currentPos = new THREE.Vector3(0, 0, 0);
  private targetPos = new THREE.Vector3(0, 0, 0);
  private moveProgress = 1; // 1 = idle
  private targetRotationY = 0;

  constructor() {
    const group = new THREE.Group();

    // body — slight emissive so player is visible at night
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0x333333,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);

    // head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 0.8;
    head.castShadow = true;
    group.add(head);

    // eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    for (const xOff of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xOff, 0.85, 0.2);
      group.add(eye);
    }

    // beak
    const beakGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.15,
    });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0.75, 0.3);
    group.add(beak);

    // comb (red thing on top)
    const combGeo = new THREE.BoxGeometry(0.1, 0.15, 0.2);
    const combMat = new THREE.MeshStandardMaterial({
      color: 0xf44336,
      emissive: 0xf44336,
      emissiveIntensity: 0.2,
    });
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 1.05, 0);
    group.add(comb);

    super(group);
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
    // smoothly rotate toward last move direction
    const rot = this.mesh.rotation;
    const diff = this.targetRotationY - rot.y;
    const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
    rot.y += wrapped * Math.min(1, delta * 15);

    if (!this.isMoving) return;

    this.moveProgress = Math.min(1, this.moveProgress + delta / MOVE_DURATION);

    this.mesh.position.lerpVectors(
      this.currentPos,
      this.targetPos,
      this.easeOut(this.moveProgress),
    );

    if (this.moveProgress >= 1) {
      this.mesh.position.copy(this.targetPos);
    }
  }

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
