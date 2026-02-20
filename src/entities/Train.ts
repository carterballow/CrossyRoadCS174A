import * as THREE from 'three';
import { Entity } from './Entity';

const TRAIN_LENGTH = 8;
const TRAIN_SPEED = 12;
const OFFSCREEN = 15;

/** Periodic train that crosses from one side, waits offscreen, repeats. */
export class Train extends Entity {
  private direction: number;
  private waitTimer: number;
  private readonly waitDuration: number;
  private crossing = false;

  /** Signal light mesh (shared ref for the lane to add) */
  readonly signalLight: THREE.Mesh;
  private signalMat: THREE.MeshStandardMaterial;

  constructor(direction: number, waitDuration: number) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x546e7a });

    // locomotive
    const locoGeo = new THREE.BoxGeometry(1.2, 0.7, 0.8);
    const loco = new THREE.Mesh(locoGeo, bodyMat);
    loco.position.y = 0.35;
    loco.castShadow = true;
    group.add(loco);

    // wagons
    const wagonMat = new THREE.MeshStandardMaterial({ color: 0x78909c });
    for (let i = 1; i < TRAIN_LENGTH; i++) {
      const wGeo = new THREE.BoxGeometry(1.0, 0.55, 0.75);
      const w = new THREE.Mesh(wGeo, wagonMat);
      w.position.set(-direction * i * 1.1, 0.275, 0);
      w.castShadow = true;
      group.add(w);
    }

    super(group);

    this.direction = direction;
    this.waitDuration = waitDuration;
    this.waitTimer = waitDuration * Math.random(); // stagger start

    // start offscreen
    this.mesh.position.x = -direction * OFFSCREEN;

    // signal light (lane will position it)
    this.signalMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const sigGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    this.signalLight = new THREE.Mesh(sigGeo, this.signalMat);
    this.signalLight.position.y = 0.3;
  }

  update(delta: number): void {
    if (this.crossing) {
      this.mesh.position.x += this.direction * TRAIN_SPEED * delta;
      this.signalMat.color.setHex(0xf44336);
      this.signalMat.emissive.setHex(0xf44336);
      this.signalMat.emissiveIntensity = 0.8;

      const totalLen = TRAIN_LENGTH * 1.1 + OFFSCREEN;
      if (Math.abs(this.mesh.position.x) > totalLen) {
        this.crossing = false;
        this.mesh.position.x = -this.direction * OFFSCREEN;
        this.waitTimer = 0;
      }
    } else {
      this.signalMat.emissiveIntensity = 0;
      this.signalMat.color.setHex(0x444444);
      this.waitTimer += delta;

      // flash warning 1s before crossing
      if (this.waitTimer > this.waitDuration - 1) {
        const flash = Math.sin(this.waitTimer * 12) > 0;
        this.signalMat.color.setHex(flash ? 0xffeb3b : 0x444444);
        this.signalMat.emissive.setHex(flash ? 0xffeb3b : 0x000000);
        this.signalMat.emissiveIntensity = flash ? 0.6 : 0;
      }

      if (this.waitTimer >= this.waitDuration) {
        this.crossing = true;
      }
    }
  }
}
