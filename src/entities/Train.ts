import * as THREE from 'three';
import { Entity } from './Entity';

const TRAIN_LENGTH = 8;
const TRAIN_SPEED = 12;
const OFFSCREEN = 20;
const WAGON_SPACING = 1.9;

export class Train extends Entity {
  private direction: number;
  private waitTimer: number;
  private readonly waitDuration: number;
  private crossing = false;

  readonly signalLight: THREE.Mesh;
  private signalMat: THREE.MeshStandardMaterial;

  constructor(direction: number, waitDuration: number) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.4, roughness: 0.5 });

    // locomotive — big and boxy
    const locoGeo = new THREE.BoxGeometry(2.2, 1.0, 0.85);
    const loco = new THREE.Mesh(locoGeo, bodyMat);
    loco.position.y = 0.5;
    loco.castShadow = true;
    group.add(loco);

    // loco roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.3, roughness: 0.5 });
    const roofGeo = new THREE.BoxGeometry(1.8, 0.15, 0.75);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.08;
    roof.castShadow = true;
    group.add(roof);

    // loco front face / headlight
    const locoLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffffaa,
      emissiveIntensity: 1.5,
    });
    const locoLightGeo = new THREE.BoxGeometry(0.08, 0.2, 0.3);
    const locoLight = new THREE.Mesh(locoLightGeo, locoLightMat);
    locoLight.position.set(direction * 1.12, 0.5, 0);
    group.add(locoLight);

    // wagons
    const wagonMat = new THREE.MeshStandardMaterial({ color: 0x12121e, metalness: 0.3, roughness: 0.6 });
    const wagonRoofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, metalness: 0.2, roughness: 0.6 });
    for (let i = 1; i < TRAIN_LENGTH; i++) {
      const wGeo = new THREE.BoxGeometry(1.7, 0.85, 0.8);
      const w = new THREE.Mesh(wGeo, wagonMat);
      w.position.set(-direction * i * WAGON_SPACING, 0.425, 0);
      w.castShadow = true;
      group.add(w);

      const wrGeo = new THREE.BoxGeometry(1.5, 0.1, 0.7);
      const wr = new THREE.Mesh(wrGeo, wagonRoofMat);
      wr.position.set(-direction * i * WAGON_SPACING, 0.9, 0);
      group.add(wr);
    }

    // wheels on locomotive + wagons
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const wheelGeo = new THREE.BoxGeometry(0.3, 0.15, 0.08);
    for (let i = 0; i < TRAIN_LENGTH; i++) {
      const cx = i === 0 ? 0 : -direction * i * WAGON_SPACING;
      for (const xOff of [-0.5, 0.5]) {
        for (const zOff of [-0.42, 0.42]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(cx + xOff, 0.08, zOff);
          group.add(wheel);
        }
      }
    }

    super(group);

    this.direction = direction;
    this.waitDuration = waitDuration;
    this.waitTimer = waitDuration * Math.random();

    this.mesh.position.x = -direction * OFFSCREEN;

    // signal light
    this.signalMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const sigGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    this.signalLight = new THREE.Mesh(sigGeo, this.signalMat);
    this.signalLight.position.y = 0.4;
  }

  update(delta: number): void {
    if (this.crossing) {
      this.mesh.position.x += this.direction * TRAIN_SPEED * delta;
      this.signalMat.color.setHex(0xf44336);
      this.signalMat.emissive.setHex(0xf44336);
      this.signalMat.emissiveIntensity = 0.8;

      const totalLen = TRAIN_LENGTH * WAGON_SPACING + OFFSCREEN;
      if (Math.abs(this.mesh.position.x) > totalLen) {
        this.crossing = false;
        this.mesh.position.x = -this.direction * OFFSCREEN;
        this.waitTimer = 0;
      }
    } else {
      this.signalMat.emissiveIntensity = 0;
      this.signalMat.color.setHex(0x444444);
      this.waitTimer += delta;

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
