import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Car } from '../entities/Car';
import { Player } from '../entities/Player';
import { createRoadTexture } from '../scene/Textures';

// Shared geometry/materials across all road lanes
const dashMat = new THREE.MeshStandardMaterial({
  color: 0x888888,
  roughness: 0.3,
  emissive: 0x333322,
  emissiveIntensity: 0.15,
});
const dashGeo = new THREE.PlaneGeometry(0.3, 0.06);
const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
const lampMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffe8c0,
  emissiveIntensity: 3.0,
});
const poleGeo = new THREE.BoxGeometry(0.06, 1.5, 0.06);
const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.35);
const headGeo = new THREE.BoxGeometry(0.12, 0.06, 0.12);

export class RoadLane extends Lane {
  private cars: Car[] = [];

  constructor(zIndex: number, direction?: number, speed?: number, carCount?: number) {
    super('road', zIndex);

    const tex = createRoadTexture();
    tex.repeat.set(LANE_WIDTH / 3, 1);
    const strip = this.createStrip(0x555555, tex);
    const roadMat = strip.material as THREE.MeshStandardMaterial;
    roadMat.roughness = 0.75;
    roadMat.metalness = 0.05;
    this.mesh.add(strip);

    // dashed center line — InstancedMesh instead of individual meshes
    const dashCount = Math.ceil((12 - (-12)) / 0.8);
    const dashInstanced = new THREE.InstancedMesh(dashGeo, dashMat, dashCount);
    const tmpPos = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const tmpScale = new THREE.Vector3(1, 1, 1);
    const matrix = new THREE.Matrix4();
    let idx = 0;
    for (let x = -12; x < 12; x += 0.8) {
      tmpPos.set(x, 0.011, 0);
      matrix.compose(tmpPos, tmpQuat, tmpScale);
      dashInstanced.setMatrixAt(idx++, matrix);
    }
    dashInstanced.instanceMatrix.needsUpdate = true;
    dashInstanced.count = idx;
    this.mesh.add(dashInstanced);

    // Streetlights — randomly placed, 1-2 per lane
    const lightCount = Math.random() > 0.4 ? 2 : 1;
    for (let i = 0; i < lightCount; i++) {
      const x = Math.floor(Math.random() * 14 - 7) + Math.random() * 0.5;
      const side = Math.random() > 0.5 ? -0.55 : 0.55;

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.75, side);
      this.mesh.add(pole);

      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(x, 1.5, side * 0.6);
      this.mesh.add(arm);

      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(x, 1.47, side * 0.35);
      this.mesh.add(head);
    }

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const spd = speed ?? 1.5 + Math.random() * 2;
    const bounds = LANE_WIDTH / 2 + 1;

    // 30% chance of emergency chase lane
    const isEmergencyLane = Math.random() < 0.15;

    if (isEmergencyLane) {
      const chaseDir = Math.random() > 0.5 ? 1 : -1;
      const chaseSpeed = spd * 1.9;
      const policeCount = Math.random() > 0.5 ? 2 : 1;

      // Supercar — slightly faster so it pulls ahead
      const superX = -bounds + Math.random() * LANE_WIDTH;
      const supercar = new Car(chaseDir, chaseSpeed * (1.0 + Math.random() * 0.1), bounds, 'supercar');
      supercar.mesh.position.set(superX, 0, 0);
      supercar.mesh.rotation.y = chaseDir > 0 ? 0 : Math.PI;
      this.mesh.add(supercar.mesh);
      this.cars.push(supercar);

      // Police cars — placed behind the supercar in chase direction
      for (let i = 0; i < policeCount; i++) {
        const gap = 2.5 + i * 2.5 + Math.random() * 1.5;
        let policeX = superX - chaseDir * gap;
        // Wrap within bounds
        if (policeX > bounds) policeX -= bounds * 2;
        else if (policeX < -bounds) policeX += bounds * 2;
        const police = new Car(chaseDir, chaseSpeed * (0.9 + Math.random() * 0.1), bounds, 'police');
        police.mesh.position.set(policeX, 0, 0);
        police.mesh.rotation.y = chaseDir > 0 ? 0 : Math.PI;
        this.mesh.add(police.mesh);
        this.cars.push(police);
      }
    } else {
      const count = carCount ?? Math.floor(Math.random() * 3) + 3;
      const spacing = LANE_WIDTH / count;

      for (let i = 0; i < count; i++) {
        const carSpeed = spd * (0.85 + Math.random() * 0.3);
        const car = new Car(dir, carSpeed, bounds);
        car.mesh.position.set(-bounds + i * spacing, 0, 0);
        car.mesh.rotation.y = dir > 0 ? 0 : Math.PI;
        this.mesh.add(car.mesh);
        this.cars.push(car);
      }
    }
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;
    const px = player.position.x;

    const player_half = 0.18;

    for (const car of this.cars) {
      const cx = car.mesh.position.x;
      if (Math.abs(px - cx) <= (player_half + car.collisionHalf)) {
        return true;
      }
    }

    return false;
  }

  update(delta: number): void {
    // Proximity-based speed modulation — cars slow when close to the car ahead
    const totalWidth = LANE_WIDTH + 2;
    const threshold = 3.0;
    const minMult = 0.15;

    for (const car of this.cars) {
      let minAheadDist = Infinity;
      const cx = car.mesh.position.x;

      for (const other of this.cars) {
        if (other === car) continue;
        if (other.direction !== car.direction) continue;

        let dx: number;
        if (car.direction > 0) {
          dx = other.mesh.position.x - cx;
          if (dx < 0) dx += totalWidth;
        } else {
          dx = cx - other.mesh.position.x;
          if (dx < 0) dx += totalWidth;
        }
        if (dx < minAheadDist) minAheadDist = dx;
      }

      if (minAheadDist < threshold) {
        const t = minAheadDist / threshold;
        car.speedMult = minMult + (1 - minMult) * t * t;
      } else {
        car.speedMult = 1.0;
      }
    }

    for (const car of this.cars) {
      car.update(delta);
    }
  }
}
