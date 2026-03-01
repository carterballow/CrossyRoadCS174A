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

    // dashed center line — only in play area for performance
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const dashGeo = new THREE.PlaneGeometry(0.3, 0.06);
    for (let x = -12; x < 12; x += 0.8) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.011, 0);
      this.mesh.add(dash);
    }

    // Streetlights — clean pole + arm + lamp head
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffe8c0,
      emissiveIntensity: 1.2,
    });
    for (let x = -8; x <= 8; x += 4) {
      const side = (Math.round(x / 4) % 2 === 0) ? -0.55 : 0.55;

      // vertical pole
      const poleGeo = new THREE.BoxGeometry(0.06, 1.5, 0.06);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.75, side);
      this.mesh.add(pole);

      // horizontal arm toward road center
      const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.35);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(x, 1.5, side * 0.6);
      this.mesh.add(arm);

      // lamp head (small box under arm tip)
      const headGeo = new THREE.BoxGeometry(0.12, 0.06, 0.12);
      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(x, 1.47, side * 0.35);
      this.mesh.add(head);

      // point light — clean warm white
      const light = new THREE.PointLight(0xffe8c0, 2.0, 6, 1.8);
      light.position.set(x, 1.45, side * 0.35);
      this.mesh.add(light);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const spd = speed ?? 1.5 + Math.random() * 2;
    const count = carCount ?? Math.floor(Math.random() * 3) + 3;
    const bounds = LANE_WIDTH / 2 + 1;
    const spacing = LANE_WIDTH / count;

    for (let i = 0; i < count; i++) {
      const car = new Car(dir, spd, bounds);
      car.mesh.position.set(-bounds + i * spacing, 0, 0);
      // dir > 0 faces +x (default), dir < 0 flips 180 so model faces -x
      car.mesh.rotation.y = dir > 0 ? 0 : Math.PI;
      this.mesh.add(car.mesh);
      this.cars.push(car);
    }
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;
    const px = player.position.x;

    const player_half = 0.18;
    const car_half = 0.9;

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
