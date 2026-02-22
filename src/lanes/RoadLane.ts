import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Car } from '../entities/Car';
import {Player} from "../entities/Player";

export class RoadLane extends Lane {
  private cars: Car[] = [];

  constructor(zIndex: number, direction?: number, speed?: number, carCount?: number) {
    super('road', zIndex);

    const strip = this.createStrip(0x1a1a1a);
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

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const spd = speed ?? 1.5 + Math.random() * 2;
    const count = carCount ?? Math.floor(Math.random() * 2) + 2;
    const bounds = LANE_WIDTH / 2 + 1;
    const spacing = LANE_WIDTH / count;

    for (let i = 0; i < count; i++) {
      const car = new Car(dir, spd, bounds);
      car.mesh.position.set(-bounds + i * spacing, 0, 0);
      // face direction of travel
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
