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

    // === MATERIALS ===
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      emissive: 0x555555,
      emissiveIntensity: 0.4,
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfaf0e6,
      emissive: 0x444444,
      emissiveIntensity: 0.3,
    });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.15,
    });
    const combMat = new THREE.MeshStandardMaterial({
      color: 0xd32f2f,
      emissive: 0xd32f2f,
      emissiveIntensity: 0.25,
    });
    const wattleMat = new THREE.MeshStandardMaterial({
      color: 0xc62828,
      emissive: 0xc62828,
      emissiveIntensity: 0.2,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      emissive: 0x222222,
      emissiveIntensity: 0.2,
    });
    const wingTipMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x111111,
      emissiveIntensity: 0.15,
    });
    const feetMat = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      emissive: 0x332200,
      emissiveIntensity: 0.1,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      emissive: 0x333333,
      emissiveIntensity: 0.2,
    });

    // === BODY ===
    // Main torso — slightly wider than tall, rounded feel via stacked boxes
    const torsoGeo = new THREE.BoxGeometry(0.34, 0.30, 0.36);
    const torso = new THREE.Mesh(torsoGeo, whiteMat);
    torso.position.y = 0.21;
    torso.castShadow = true;
    model.add(torso);

    // Belly panel — lighter cream front
    const bellyGeo = new THREE.BoxGeometry(0.28, 0.22, 0.04);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, 0.20, 0.17);
    model.add(belly);

    // Chest puff — slight forward bulge
    const chestGeo = new THREE.BoxGeometry(0.24, 0.12, 0.06);
    const chest = new THREE.Mesh(chestGeo, whiteMat);
    chest.position.set(0, 0.30, 0.18);
    model.add(chest);

    // === HEAD ===
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const head = new THREE.Mesh(headGeo, whiteMat);
    head.position.y = 0.52;
    head.castShadow = true;
    model.add(head);

    // Cheeks — slight side bulges
    const cheekGeo = new THREE.BoxGeometry(0.06, 0.10, 0.12);
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xffcccc,
      emissive: 0x442222,
      emissiveIntensity: 0.15,
    });
    for (const xOff of [-0.15, 0.15]) {
      const cheek = new THREE.Mesh(cheekGeo, cheekMat);
      cheek.position.set(xOff, 0.47, 0.06);
      model.add(cheek);
    }

    // === EYES ===
    // Eye whites
    const eyeWhiteGeo = new THREE.BoxGeometry(0.08, 0.09, 0.04);
    for (const xOff of [-0.08, 0.08]) {
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.position.set(xOff, 0.56, 0.13);
      model.add(eyeWhite);
    }
    // Pupils — smaller, offset slightly down
    const pupilGeo = new THREE.BoxGeometry(0.04, 0.05, 0.02);
    for (const xOff of [-0.08, 0.08]) {
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(xOff, 0.55, 0.155);
      model.add(pupil);
    }

    // === BEAK ===
    // Upper beak
    const upperBeakGeo = new THREE.BoxGeometry(0.12, 0.05, 0.14);
    const upperBeak = new THREE.Mesh(upperBeakGeo, beakMat);
    upperBeak.position.set(0, 0.50, 0.19);
    model.add(upperBeak);
    // Lower beak — slightly smaller, slightly lower
    const lowerBeakGeo = new THREE.BoxGeometry(0.10, 0.03, 0.10);
    const lowerBeak = new THREE.Mesh(lowerBeakGeo, beakMat);
    lowerBeak.position.set(0, 0.46, 0.18);
    model.add(lowerBeak);

    // === COMB (on top of head) ===
    // Three-part jagged comb
    const combGeo1 = new THREE.BoxGeometry(0.06, 0.08, 0.08);
    const comb1 = new THREE.Mesh(combGeo1, combMat);
    comb1.position.set(0, 0.70, 0.02);
    model.add(comb1);
    const combGeo2 = new THREE.BoxGeometry(0.06, 0.10, 0.06);
    const comb2 = new THREE.Mesh(combGeo2, combMat);
    comb2.position.set(0, 0.71, -0.04);
    model.add(comb2);
    const combGeo3 = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const comb3 = new THREE.Mesh(combGeo3, combMat);
    comb3.position.set(0, 0.69, 0.08);
    model.add(comb3);

    // === WATTLE (under beak) ===
    const wattleGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
    const wattle = new THREE.Mesh(wattleGeo, wattleMat);
    wattle.position.set(0, 0.42, 0.16);
    model.add(wattle);

    // === WINGS ===
    // Each wing: upper arm + tip for a folded look
    for (const xOff of [-1, 1]) {
      // Upper wing
      const wingGeo = new THREE.BoxGeometry(0.06, 0.20, 0.18);
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(xOff * 0.20, 0.24, -0.02);
      wing.castShadow = true;
      model.add(wing);

      // Wing tip — slightly darker, angled down
      const tipGeo = new THREE.BoxGeometry(0.05, 0.10, 0.12);
      const tip = new THREE.Mesh(tipGeo, wingTipMat);
      tip.position.set(xOff * 0.22, 0.14, -0.06);
      model.add(tip);
    }

    // === TAIL ===
    // Fan of tail feathers at the back
    const tailGeo1 = new THREE.BoxGeometry(0.14, 0.12, 0.06);
    const tail1 = new THREE.Mesh(tailGeo1, tailMat);
    tail1.position.set(0, 0.32, -0.20);
    tail1.rotation.x = -0.3;
    model.add(tail1);
    const tailGeo2 = new THREE.BoxGeometry(0.10, 0.10, 0.04);
    const tail2 = new THREE.Mesh(tailGeo2, whiteMat);
    tail2.position.set(0, 0.38, -0.22);
    tail2.rotation.x = -0.4;
    model.add(tail2);
    const tailGeo3 = new THREE.BoxGeometry(0.06, 0.08, 0.04);
    const tail3 = new THREE.Mesh(tailGeo3, tailMat);
    tail3.position.set(0, 0.43, -0.21);
    tail3.rotation.x = -0.5;
    model.add(tail3);

    // === FEET / LEGS ===
    for (const xOff of [-0.08, 0.08]) {
      // Leg
      const legGeo = new THREE.BoxGeometry(0.04, 0.10, 0.04);
      const leg = new THREE.Mesh(legGeo, feetMat);
      leg.position.set(xOff, 0.05, 0.02);
      model.add(leg);

      // Foot — wider, three-toed look
      const footGeo = new THREE.BoxGeometry(0.10, 0.03, 0.14);
      const foot = new THREE.Mesh(footGeo, feetMat);
      foot.position.set(xOff, 0.015, 0.05);
      model.add(foot);

      // Front toe detail
      const toeGeo = new THREE.BoxGeometry(0.03, 0.02, 0.05);
      for (const tx of [-0.03, 0, 0.03]) {
        const toe = new THREE.Mesh(toeGeo, feetMat);
        toe.position.set(xOff + tx, 0.01, 0.10);
        model.add(toe);
      }
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

  private updateSquashDeath(t: number): void {
    if (t < 0.3) {
      const st = t / 0.3;
      const ease = st * st;
      this.modelGroup.scale.set(1 + ease * 1.2, Math.max(0.05, 1 - ease * 0.95), 1 + ease * 1.2);
      this.modelGroup.position.y = 0;
    } else if (t < 0.7) {
      const st = (t - 0.3) / 0.4;
      const bounce = Math.sin(st * Math.PI);
      this.modelGroup.position.y = bounce * 1.5;
      this.modelGroup.scale.set(0.6 + bounce * 0.3, 0.6 + bounce * 0.3, 0.6 + bounce * 0.3);
      this.mesh.rotation.y += 0.3;
      this.mesh.rotation.z = st * Math.PI * 2;
    } else {
      const st = (t - 0.7) / 0.3;
      const ease = st * st;
      this.modelGroup.position.y = (1 - ease) * 0.5;
      this.modelGroup.scale.set(1.8, 0.05, 1.8);
      this.mesh.rotation.z = Math.PI * 2;
    }
  }

  private updateDrownDeath(t: number): void {
    if (t < 0.15) {
      const st = t / 0.15;
      this.modelGroup.scale.set(1 - st * 0.3, 1 + st * 0.4, 1 - st * 0.3);
      this.modelGroup.position.y = st * 0.15;
    } else if (t < 0.4) {
      const st = (t - 0.15) / 0.25;
      const ease = st * st;
      this.modelGroup.position.y = 0.15 - ease * 0.55;
      this.modelGroup.scale.set(0.7 + st * 0.1, 1.4 - st * 0.6, 0.7 + st * 0.1);
      this.modelGroup.rotation.x = st * 0.3;
    } else if (t < 0.7) {
      const st = (t - 0.4) / 0.3;
      const bob = Math.sin(st * Math.PI) * 0.1;
      this.modelGroup.position.y = -0.4 + bob;
      this.modelGroup.scale.set(0.8, 0.8, 0.8);
      this.modelGroup.rotation.x = 0.3 + st * 0.2;
    } else {
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
