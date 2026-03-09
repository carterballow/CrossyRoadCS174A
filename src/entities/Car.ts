import * as THREE from 'three';
import { Entity } from './Entity';
import { getCarBodyTexture, getCarCabinTexture, getWheelTexture } from '../scene/Textures';

export type CarVariant = 'normal' | 'police' | 'supercar';

const CAR_COLORS = [0xcc2233, 0x2266cc, 0xccaa22, 0x22aa44, 0xcc6622, 0x8833aa];
const SUPERCAR_COLORS = [0xccff00, 0xff3300, 0x00ccff, 0xffaa00, 0xff00ff];

// Shared regular car geometries
const bodyGeo = new THREE.BoxGeometry(1.8, 0.4, 0.75);
const cabinGeo = new THREE.BoxGeometry(0.8, 0.3, 0.7);
const hlGeo = new THREE.BoxGeometry(0.06, 0.1, 0.12);
const wheelGeo = new THREE.BoxGeometry(0.25, 0.18, 0.1);
const lightBarGeo = new THREE.BoxGeometry(0.12, 0.08, 0.6);

// Supercar geometries
const superBodyGeo = new THREE.BoxGeometry(2.4, 0.24, 0.84);
const superNoseGeo = new THREE.BoxGeometry(0.3, 0.16, 0.78);
const superCabinGeo = new THREE.BoxGeometry(0.55, 0.2, 0.7);
const superDeckGeo = new THREE.BoxGeometry(0.6, 0.1, 0.78);
const superSplitterGeo = new THREE.BoxGeometry(0.8, 0.025, 0.9);
const superSkirtGeo = new THREE.BoxGeometry(1.8, 0.05, 0.03);
const superSpoilerWingGeo = new THREE.BoxGeometry(0.85, 0.025, 0.84);
const superSpoilerStandGeo = new THREE.BoxGeometry(0.03, 0.15, 0.03);
const superScoopGeo = new THREE.BoxGeometry(0.25, 0.05, 0.18);
const superExhaustGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
const superIntakeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.03);
const superTailGeo = new THREE.BoxGeometry(0.04, 0.06, 0.6);
const underglowGeo = new THREE.BoxGeometry(1.8, 0.02, 0.7);

// Shared accent materials
const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.4 });
const exhaustMeshMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });

// Shared materials that don't vary per car
const cabinTex = getCarCabinTexture();
const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, map: cabinTex });
const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffdd,
  emissiveIntensity: 1.8,
});
const taillightMat = new THREE.MeshStandardMaterial({
  color: 0x880000,
  emissive: 0xff0000,
  emissiveIntensity: 2.5,
});
const wheelTex = getWheelTexture();
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, map: wheelTex });

export class Car extends Entity {
  readonly speed: number;
  readonly direction: number;
  private bounds: number;
  readonly variant: CarVariant;
  readonly collisionHalf: number;
  speedMult = 1.0;
  private sirenLeft: THREE.MeshStandardMaterial | null = null;
  private sirenRight: THREE.MeshStandardMaterial | null = null;
  private sirenTime = 0;

  constructor(direction: number, speed: number, bounds: number, variant: CarVariant = 'normal') {
    const group = new THREE.Group();

    let sLeft: THREE.MeshStandardMaterial | null = null;
    let sRight: THREE.MeshStandardMaterial | null = null;
    let colHalf = 0.9;

    if (variant === 'supercar') {
      colHalf = 1.2;
      const color = SUPERCAR_COLORS[Math.floor(Math.random() * SUPERCAR_COLORS.length)];

      const bodyTex = getCarBodyTexture();
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        map: bodyTex,
        metalness: 0.6,
        roughness: 0.15,
      });

      // Main body — long, low, wide
      const body = new THREE.Mesh(superBodyGeo, bodyMat);
      body.position.y = 0.12;
      body.castShadow = true;
      group.add(body);

      // Front nose — tapered extension
      const nose = new THREE.Mesh(superNoseGeo, bodyMat);
      nose.position.set(1.35, 0.08, 0);
      group.add(nose);

      // Low cabin — set back, sports car profile
      const cabin = new THREE.Mesh(superCabinGeo, cabinMat);
      cabin.position.set(0.1, 0.35, 0);
      cabin.castShadow = true;
      group.add(cabin);

      // Rear engine deck
      const deck = new THREE.Mesh(superDeckGeo, bodyMat);
      deck.position.set(-0.55, 0.3, 0);
      group.add(deck);

      // Front splitter (carbon fiber)
      const splitter = new THREE.Mesh(superSplitterGeo, carbonMat);
      splitter.position.set(1.2, 0.0, 0);
      group.add(splitter);

      // Side skirts (carbon fiber)
      for (const zOff of [-0.44, 0.44]) {
        const skirt = new THREE.Mesh(superSkirtGeo, carbonMat);
        skirt.position.set(0, 0.0, zOff);
        group.add(skirt);
      }

      // Side air intakes
      for (const zOff of [-0.44, 0.44]) {
        const intake = new THREE.Mesh(superIntakeGeo, carbonMat);
        intake.position.set(-0.3, 0.14, zOff);
        group.add(intake);
      }

      // Hood scoop
      const scoop = new THREE.Mesh(superScoopGeo, bodyMat);
      scoop.position.set(0.55, 0.26, 0);
      group.add(scoop);

      // Rear spoiler — dramatic wing on stands
      for (const zOff of [-0.32, 0.32]) {
        const stand = new THREE.Mesh(superSpoilerStandGeo, carbonMat);
        stand.position.set(-1.05, 0.32, zOff);
        group.add(stand);
      }
      const wing = new THREE.Mesh(superSpoilerWingGeo, carbonMat);
      wing.position.set(-1.05, 0.41, 0);
      group.add(wing);

      // Dual exhaust tips
      for (const zOff of [-0.15, 0.15]) {
        const exh = new THREE.Mesh(superExhaustGeo, exhaustMeshMat);
        exh.position.set(-1.2, 0.06, zOff);
        group.add(exh);
      }

      // Wide LED taillight strip
      const tail = new THREE.Mesh(superTailGeo, taillightMat);
      tail.position.set(-1.2, 0.16, 0);
      group.add(tail);

      // Aggressive headlights
      for (const zOff of [-0.34, 0.34]) {
        const hl = new THREE.Mesh(hlGeo, headlightMat);
        hl.position.set(1.5, 0.1, zOff);
        group.add(hl);
      }

      // Wheels — wide stance
      for (const xOff of [-0.8, 0.8]) {
        for (const zOff of [-0.43, 0.43]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(xOff, 0.09, zOff);
          group.add(wheel);
        }
      }

      // Underglow — emissive strip matching body color
      const underglowMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.6,
      });
      const underglow = new THREE.Mesh(underglowGeo, underglowMat);
      underglow.position.set(0, -0.01, 0);
      group.add(underglow);
    } else {
      // Normal or police car
      const isPolice = variant === 'police';
      const color = isPolice ? 0xeeeeee : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];

      const bodyTex = getCarBodyTexture();
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        map: bodyTex,
        metalness: isPolice ? 0.3 : 0.15,
        roughness: isPolice ? 0.4 : 0.6,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.2;
      body.castShadow = true;
      group.add(body);

      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(-0.15, 0.55, 0);
      cabin.castShadow = true;
      group.add(cabin);

      // headlights
      for (const zOff of [-0.28, 0.28]) {
        const hl = new THREE.Mesh(hlGeo, headlightMat);
        hl.position.set(0.91, 0.18, zOff);
        group.add(hl);
      }

      // taillights
      for (const zOff of [-0.28, 0.28]) {
        const tl = new THREE.Mesh(hlGeo, taillightMat);
        tl.position.set(-0.91, 0.18, zOff);
        group.add(tl);
      }

      // wheels
      for (const xOff of [-0.6, 0.6]) {
        for (const zOff of [-0.38, 0.38]) {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(xOff, 0.09, zOff);
          group.add(wheel);
        }
      }

      // Police light bar on roof
      if (isPolice) {
        const barBaseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const barBaseGeo = new THREE.BoxGeometry(0.3, 0.05, 0.65);
        const barBase = new THREE.Mesh(barBaseGeo, barBaseMat);
        barBase.position.set(-0.15, 0.73, 0);
        group.add(barBase);

        sLeft = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0,
        });
        const redLight = new THREE.Mesh(lightBarGeo, sLeft);
        redLight.position.set(-0.15, 0.78, -0.15);
        group.add(redLight);

        sRight = new THREE.MeshStandardMaterial({
          color: 0x0044ff,
          emissive: 0x0044ff,
          emissiveIntensity: 0,
        });
        const blueLight = new THREE.Mesh(lightBarGeo, sRight);
        blueLight.position.set(-0.15, 0.78, 0.15);
        group.add(blueLight);
      }
    }

    super(group);
    this.direction = direction;
    this.speed = speed;
    this.bounds = bounds;
    this.variant = variant;
    this.collisionHalf = colHalf;
    this.sirenLeft = sLeft;
    this.sirenRight = sRight;
    this.sirenTime = Math.random() * Math.PI * 2;
  }

  update(delta: number): void {
    this.mesh.position.x += this.direction * this.speed * this.speedMult * delta;

    if (this.direction > 0 && this.mesh.position.x > this.bounds) {
      this.mesh.position.x = -this.bounds;
    } else if (this.direction < 0 && this.mesh.position.x < -this.bounds) {
      this.mesh.position.x = this.bounds;
    }

    // Flash siren lights (police only)
    if (this.variant === 'police' && this.sirenLeft && this.sirenRight) {
      this.sirenTime += delta;
      // Alternate at ~4Hz
      const flash = Math.sin(this.sirenTime * 25) > 0;
      this.sirenLeft.emissiveIntensity = flash ? 4.0 : 0.2;
      this.sirenRight.emissiveIntensity = flash ? 0.2 : 4.0;
    }
  }
}
