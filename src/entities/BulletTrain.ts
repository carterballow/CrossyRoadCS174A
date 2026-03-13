import * as THREE from 'three';
import { Entity } from './Entity';
import { getBulletTrainTexture, getWheelTexture } from '../scene/Textures';

export const BULLET_TRAIN_LENGTH = 5;
const BULLET_SPEED = 28;
const OFFSCREEN = 20;
const WAGON_SPACING = 1.9;

// Shared geometries
const leadGeo = new THREE.BoxGeometry(2.4, 0.85, 0.9);
const noseGeo = new THREE.BoxGeometry(0.8, 0.55, 0.7);
const noseTipGeo = new THREE.BoxGeometry(0.3, 0.35, 0.45);
const roofGeo = new THREE.BoxGeometry(2.2, 0.08, 0.85);
const stripeGeo = new THREE.BoxGeometry(2.2, 0.1, 0.02);
const underGeo = new THREE.BoxGeometry(2.5, 0.1, 0.92);
const headlightGeo = new THREE.BoxGeometry(0.06, 0.1, 0.3);
const wagonGeo = new THREE.BoxGeometry(1.8, 0.8, 0.85);
const wagonRoofGeo = new THREE.BoxGeometry(1.6, 0.08, 0.8);
const wagonUnderGeo = new THREE.BoxGeometry(1.85, 0.1, 0.88);
const connectorGeo = new THREE.BoxGeometry(0.3, 0.1, 0.15);
const windowGeo = new THREE.BoxGeometry(1.4, 0.12, 0.02);
const wheelGeo = new THREE.BoxGeometry(0.3, 0.18, 0.08);
const sigGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);

// Shared materials
const bulletTex = getBulletTrainTexture();
const wheelTex = getWheelTexture();

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, map: bulletTex, metalness: 0.4, roughness: 0.3 });
const noseMat = new THREE.MeshStandardMaterial({ color: 0xd8d8e8, map: bulletTex, metalness: 0.5, roughness: 0.25 });
const noseTipMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.5, roughness: 0.2 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0xc0c0cc, metalness: 0.3, roughness: 0.4 });
const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1155cc });
const underMat = new THREE.MeshStandardMaterial({ color: 0x222230 });
const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 4.0,
});
const wagonMat = new THREE.MeshStandardMaterial({ color: 0xdcdce8, map: bulletTex, metalness: 0.35, roughness: 0.35 });
const wagonRoofMat = new THREE.MeshStandardMaterial({ color: 0xb8b8c8, metalness: 0.25, roughness: 0.45 });
const connMat = new THREE.MeshStandardMaterial({ color: 0x18182a });
const winMat = new THREE.MeshStandardMaterial({
  color: 0x224466,
  emissive: 0x112233,
  emissiveIntensity: 0.4,
});
const bWheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, map: wheelTex });

export class BulletTrain extends Entity {
  private direction: number;
  private waitTimer: number;
  private readonly waitDuration: number;
  private crossing = false;

  readonly signalLight: THREE.Mesh;
  private signalMat: THREE.MeshStandardMaterial;

  constructor(direction: number) {
    const group = new THREE.Group();

    // === LEAD CAR ===

    // Main body
    const lead = new THREE.Mesh(leadGeo, bodyMat);
    lead.position.y = 0.525;
    lead.castShadow = true;
    group.add(lead);

    // Aerodynamic nose
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(direction * 1.5, 0.38, 0);
    nose.castShadow = true;
    group.add(nose);

    // Nose tip
    const noseTip = new THREE.Mesh(noseTipGeo, noseTipMat);
    noseTip.position.set(direction * 1.9, 0.28, 0);
    group.add(noseTip);

    // Roof
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 0.99, 0);
    group.add(roof);

    // Blue stripe on both sides
    for (const zOff of [-0.46, 0.46]) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.62, zOff);
      group.add(stripe);
    }

    // Undercarriage
    const under = new THREE.Mesh(underGeo, underMat);
    under.position.y = 0.05;
    group.add(under);

    // Headlight
    const headlight = new THREE.Mesh(headlightGeo, headlightMat);
    headlight.position.set(direction * 2.05, 0.3, 0);
    group.add(headlight);

    // === WAGONS ===

    for (let i = 1; i < BULLET_TRAIN_LENGTH; i++) {
      const wx = -direction * i * WAGON_SPACING;

      const w = new THREE.Mesh(wagonGeo, wagonMat);
      w.position.set(wx, 0.5, 0);
      w.castShadow = true;
      group.add(w);

      const wr = new THREE.Mesh(wagonRoofGeo, wagonRoofMat);
      wr.position.set(wx, 0.95, 0);
      group.add(wr);

      const wu = new THREE.Mesh(wagonUnderGeo, underMat);
      wu.position.set(wx, 0.05, 0);
      group.add(wu);

      // Connector
      const c = new THREE.Mesh(connectorGeo, connMat);
      c.position.set(wx + direction * (WAGON_SPACING / 2), 0.2, 0);
      group.add(c);

      // Blue stripe on wagons
      for (const zOff of [-0.435, 0.435]) {
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(wx, 0.58, zOff);
        group.add(stripe);
      }

      // Window strip
      for (const zOff of [-0.435, 0.435]) {
        const win = new THREE.Mesh(windowGeo, winMat);
        win.position.set(wx, 0.68, zOff);
        group.add(win);
      }
    }

    // === WHEELS ===
    for (let i = 0; i < BULLET_TRAIN_LENGTH; i++) {
      const cx = i === 0 ? 0 : -direction * i * WAGON_SPACING;
      for (const xOff of [-0.55, 0.55]) {
        for (const zOff of [-0.46, 0.46]) {
          const wheel = new THREE.Mesh(wheelGeo, bWheelMat);
          wheel.position.set(cx + xOff, 0.09, zOff);
          group.add(wheel);
        }
      }
    }

    super(group);

    this.direction = direction;
    this.waitDuration = 6;
    this.waitTimer = this.waitDuration * Math.random();

    this.mesh.position.x = -direction * OFFSCREEN;

    // signal light
    this.signalMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    this.signalLight = new THREE.Mesh(sigGeo, this.signalMat);
    this.signalLight.position.y = 0.4;
  }

  getState(): { x: number; isWarning: boolean; isCrossing: boolean } {
    return {
      x: this.mesh.position.x,
      isWarning: !this.crossing && this.waitTimer > this.waitDuration - 1,
      isCrossing: this.crossing,
    };
  }

  update(delta: number): void {
    if (this.crossing) {
      this.mesh.position.x += this.direction * BULLET_SPEED * delta;
      this.signalMat.color.setHex(0xf44336);
      this.signalMat.emissive.setHex(0xf44336);
      this.signalMat.emissiveIntensity = 0.8;

      const totalLen = BULLET_TRAIN_LENGTH * WAGON_SPACING + OFFSCREEN;
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
