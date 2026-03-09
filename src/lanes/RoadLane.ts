import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Car } from '../entities/Car';
import { Player } from '../entities/Player';
import { createRoadTexture } from '../scene/Textures';

export class RoadLane extends Lane {
  private cars: Car[] = [];

  constructor(zIndex: number, direction?: number, speed?: number, carCount?: number) {
    super('road', zIndex);

    const tex = createRoadTexture();
    tex.repeat.set(LANE_WIDTH / 4, 1);
    const strip = this.createStrip(0x222222, tex);
    this.mesh.add(strip);

    // dashed center line
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const dashGeo = new THREE.PlaneGeometry(0.3, 0.06);
    for (let x = -LANE_WIDTH / 2; x < LANE_WIDTH / 2; x += 0.8) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.011, 0);
      this.mesh.add(dash);
    }

    // Streetlights along road edges — bright sodium-vapor glow
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.4 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      emissive: 0xffdd88,
      emissiveIntensity: 2.0,
    });
    const poleGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08);
    const lampGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    for (let x = -6; x <= 6; x += 4) {
      const side = (x / 4) % 2 === 0 ? -0.6 : 0.6;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.7, side);
      this.mesh.add(pole);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, 1.42, side);
      this.mesh.add(lamp);

      // Bright warm pool of light
      const light = new THREE.PointLight(0xffcc66, 2.5, 8, 1.5);
      light.position.set(x, 1.4, side);
      this.mesh.add(light);
    }

    // Ground light splash — warm spot on the road surface
    const splashMat = new THREE.MeshStandardMaterial({
      color: 0x332200,
      emissive: 0xffaa33,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.3,
    });
    const splashGeo = new THREE.PlaneGeometry(2.5, 0.8);
    for (let x = -6; x <= 6; x += 4) {
      const splash = new THREE.Mesh(splashGeo, splashMat);
      splash.rotation.x = -Math.PI / 2;
      splash.position.set(x, 0.012, 0);
      this.mesh.add(splash);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const spd = speed ?? 1.5 + Math.random() * 2;
    const count = carCount ?? Math.floor(Math.random() * 2) + 2;
    const bounds = LANE_WIDTH / 2 + 1;
    const spacing = LANE_WIDTH / count;

    for (let i = 0; i < count; i++) {
      const car = new Car(dir, spd, bounds);
      car.mesh.position.set(-bounds + i * spacing, 0, 0);
      car.mesh.rotation.y = dir > 0 ? 0 : Math.PI;
      this.mesh.add(car.mesh);
      this.cars.push(car);
    }
  }
  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;
    const px = player.position.x;

    const player_half = 0.35; //change later
    const car_half = 1.0;

    for (const car of this.cars) {
      const cx = car.mesh.position.x; 
      if (Math.abs(px - cx) <= (player_half + car_half)) {
        return true;
      }
    }

    return false;
  }

  update(delta: number): void {
    for (const car of this.cars) {
      car.update(delta);
    }
  }
}
