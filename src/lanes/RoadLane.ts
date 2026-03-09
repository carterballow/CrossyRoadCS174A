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
    const strip = this.createStrip(0x1a1a1a, tex);
    this.mesh.add(strip);

    // dashed center line
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const dashGeo = new THREE.PlaneGeometry(0.3, 0.06);
    for (let x = -LANE_WIDTH / 2; x < LANE_WIDTH / 2; x += 0.8) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.011, 0);
      this.mesh.add(dash);
    }

    // Streetlights along the road edges
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      emissive: 0xffcc66,
      emissiveIntensity: 0.9,
    });
    const poleGeo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
    const lampGeo = new THREE.BoxGeometry(0.15, 0.08, 0.15);
    for (let x = -6; x <= 6; x += 6) {
      for (const zSide of [-0.6, 0.6]) {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 0.6, zSide);
        this.mesh.add(pole);
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(x, 1.22, zSide);
        this.mesh.add(lamp);

        const light = new THREE.PointLight(0xffcc66, 0.6, 5, 2);
        light.position.set(x, 1.2, zSide);
        this.mesh.add(light);
      }
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
