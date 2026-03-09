import * as THREE from 'three';
import { Entity } from './Entity';
import { getTrainBodyTexture, getTrainWagonTexture, getWheelTexture } from '../scene/Textures';

const TRAIN_LENGTH = 8;
const TRAIN_SPEED = 12;
const OFFSCREEN = 20;
const WAGON_SPACING = 1.9;

// Shared geometries — created once
const locoGeo = new THREE.BoxGeometry(2.2, 0.9, 0.85);
const cabinGeo = new THREE.BoxGeometry(0.9, 0.5, 0.8);
const cabinRoofGeo = new THREE.BoxGeometry(1.0, 0.08, 0.85);
const noseGeo = new THREE.BoxGeometry(0.5, 0.6, 0.8);
const stackGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
const locoLightGeo = new THREE.BoxGeometry(0.08, 0.15, 0.2);
const plowGeo = new THREE.BoxGeometry(0.12, 0.3, 0.9);
const stripeGeo = new THREE.BoxGeometry(2.0, 0.06, 0.02);
const underGeo = new THREE.BoxGeometry(2.4, 0.12, 0.9);
const wGeo = new THREE.BoxGeometry(1.7, 0.8, 0.78);
const wrGeo = new THREE.BoxGeometry(1.5, 0.08, 0.72);
const wuGeo = new THREE.BoxGeometry(1.75, 0.1, 0.82);
const cGeo = new THREE.BoxGeometry(0.3, 0.1, 0.15);
const winGeo = new THREE.BoxGeometry(1.2, 0.15, 0.02);
const wheelGeo = new THREE.BoxGeometry(0.3, 0.18, 0.08);
const sigGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);

// Shared materials with pixelated textures
const trainBodyTex = getTrainBodyTexture();
const trainWagonTex = getTrainWagonTexture();
const wheelTex = getWheelTexture();

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, map: trainBodyTex, metalness: 0.5, roughness: 0.4 });
const trainCabinMat = new THREE.MeshStandardMaterial({ color: 0x222238, map: trainBodyTex, metalness: 0.4, roughness: 0.4 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.3, roughness: 0.5 });
const noseMat = new THREE.MeshStandardMaterial({ color: 0x1e1e30, map: trainBodyTex, metalness: 0.5, roughness: 0.35 });
const stackMat = new THREE.MeshStandardMaterial({ color: 0x333340 });
const locoLightMat = new THREE.MeshStandardMaterial({
  color: 0xffffaa,
  emissive: 0xffffaa,
  emissiveIntensity: 3.0,
});
const plowMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, metalness: 0.6, roughness: 0.3 });
const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc8833 });
const underMat = new THREE.MeshStandardMaterial({ color: 0x0a0a12 });
const wagonMat = new THREE.MeshStandardMaterial({ color: 0x12121e, map: trainWagonTex, metalness: 0.3, roughness: 0.6 });
const wagonRoofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a28, metalness: 0.2, roughness: 0.6 });
const connectorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10 });
const winMat = new THREE.MeshStandardMaterial({
  color: 0x334455,
  emissive: 0x222233,
  emissiveIntensity: 0.3,
});
const trainWheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, map: wheelTex });

export class Train extends Entity {
  private direction: number;
  private waitTimer: number;
  private readonly waitDuration: number;
  private crossing = false;

  readonly signalLight: THREE.Mesh;
  private signalMat: THREE.MeshStandardMaterial;

  constructor(direction: number, waitDuration: number) {
    const group = new THREE.Group();

    // === LOCOMOTIVE ===

    // Main body
    const loco = new THREE.Mesh(locoGeo, bodyMat);
    loco.position.y = 0.55;
    loco.castShadow = true;
    group.add(loco);

    // Cabin (raised section at rear)
    const cabin = new THREE.Mesh(cabinGeo, trainCabinMat);
    cabin.position.set(-direction * 0.55, 1.25, 0);
    cabin.castShadow = true;
    group.add(cabin);

    // Cabin roof
    const cabinRoof = new THREE.Mesh(cabinRoofGeo, roofMat);
    cabinRoof.position.set(-direction * 0.55, 1.54, 0);
    group.add(cabinRoof);

    // Nose / front slope
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(direction * 1.3, 0.4, 0);
    group.add(nose);

    // Smokestack / horn
    const stack = new THREE.Mesh(stackGeo, stackMat);
    stack.position.set(direction * 0.4, 1.15, 0);
    group.add(stack);

    // Front headlight — high emissive for bloom
    const locoLight = new THREE.Mesh(locoLightGeo, locoLightMat);
    locoLight.position.set(direction * 1.56, 0.45, 0);
    group.add(locoLight);

    // Front cowcatcher / plow
    const plow = new THREE.Mesh(plowGeo, plowMat);
    plow.position.set(direction * 1.55, 0.2, 0);
    group.add(plow);

    // Side stripe on loco
    for (const zOff of [-0.44, 0.44]) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.7, zOff);
      group.add(stripe);
    }

    // Loco undercarriage
    const under = new THREE.Mesh(underGeo, underMat);
    under.position.y = 0.06;
    group.add(under);

    // === WAGONS ===

    for (let i = 1; i < TRAIN_LENGTH; i++) {
      const wx = -direction * i * WAGON_SPACING;

      // Wagon body
      const w = new THREE.Mesh(wGeo, wagonMat);
      w.position.set(wx, 0.5, 0);
      w.castShadow = true;
      group.add(w);

      // Wagon roof
      const wr = new THREE.Mesh(wrGeo, wagonRoofMat);
      wr.position.set(wx, 0.95, 0);
      group.add(wr);

      // Wagon undercarriage
      const wu = new THREE.Mesh(wuGeo, underMat);
      wu.position.set(wx, 0.06, 0);
      group.add(wu);

      // Connector between wagons
      const c = new THREE.Mesh(cGeo, connectorMat);
      c.position.set(wx + direction * (WAGON_SPACING / 2), 0.2, 0);
      group.add(c);

      // Window strip on wagons
      for (const zOff of [-0.4, 0.4]) {
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(wx, 0.65, zOff);
        group.add(win);
      }
    }

    // === WHEELS ===
    for (let i = 0; i < TRAIN_LENGTH; i++) {
      const cx = i === 0 ? 0 : -direction * i * WAGON_SPACING;
      for (const xOff of [-0.55, 0.55]) {
        for (const zOff of [-0.44, 0.44]) {
          const wheel = new THREE.Mesh(wheelGeo, trainWheelMat);
          wheel.position.set(cx + xOff, 0.09, zOff);
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
