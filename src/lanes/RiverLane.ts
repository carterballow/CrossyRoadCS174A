import * as THREE from 'three';
import { Lane, LANE_WIDTH } from './Lane';
import { Log } from '../entities/Log';
import { Player } from '../entities/Player';
import { createWaterMaterial } from '../scene/WaterShader';

export class RiverLane extends Lane {
  private logs: Log[] = [];
  private direction: number;
  private waterMat: THREE.ShaderMaterial;

  constructor(zIndex: number, direction?: number, speed?: number, logCount?: number) {
    super('river', zIndex);

    // River bed (dark bottom visible through translucent water)
    const bedGeo = new THREE.PlaneGeometry(LANE_WIDTH, 1);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x040810 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.position.y = -0.25;
    this.mesh.add(bed);

    const dir = direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.direction = dir;

    // Water surface — custom shader with vertex-displaced waves
    const waterGeo = new THREE.PlaneGeometry(LANE_WIDTH, 1, 120, 12);
    this.waterMat = createWaterMaterial(dir);
    const water = new THREE.Mesh(waterGeo, this.waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.08;
    water.renderOrder = 1;
    this.mesh.add(water);

    // Shore edges
    const shoreMat = new THREE.MeshStandardMaterial({ color: 0x1a1a10 });
    const shoreGeo = new THREE.BoxGeometry(LANE_WIDTH, 0.08, 0.08);
    for (const zOff of [-0.5, 0.5]) {
      const shore = new THREE.Mesh(shoreGeo, shoreMat);
      shore.position.set(0, -0.06, zOff);
      this.mesh.add(shore);
    }

    // Streetlights along the shore
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffe8c0,
      emissiveIntensity: 1.2,
    });
    for (let x = -8; x <= 8; x += 8) {
      const side = (Math.round(x / 8) % 2 === 0) ? -0.55 : 0.55;

      const poleGeo = new THREE.BoxGeometry(0.06, 1.5, 0.06);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.75, side);
      this.mesh.add(pole);

      const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.35);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(x, 1.5, side * 0.6);
      this.mesh.add(arm);

      const headGeo = new THREE.BoxGeometry(0.12, 0.06, 0.12);
      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(x, 1.47, side * 0.35);
      this.mesh.add(head);

      const light = new THREE.PointLight(0xffe8c0, 2.0, 6, 1.8);
      light.position.set(x, 1.45, side * 0.35);
      this.mesh.add(light);
    }

    const spd = speed ?? 0.8 + Math.random() * 1.2;
    const count = logCount ?? Math.floor(Math.random() * 3) + 4;
    const bounds = LANE_WIDTH / 2;
    const logLength = 1.5 + Math.random() * 1.5;
    const spacing = LANE_WIDTH / count;

    for (let i = 0; i < count; i++) {
      const log = new Log(dir, spd, bounds, logLength);
      log.mesh.position.set(-bounds + i * spacing + spacing / 2, 0, 0);
      this.mesh.add(log.mesh);
      this.logs.push(log);
    }
  }

  checkCollision(player: Player): boolean {
    const pz = Math.round(player.position.z);
    if (pz !== this.zIndex) return false;
    return !this.isOnLog(player);
  }

  isOnLog(player: Player): boolean {
    const px = player.position.x;
    const playerHalf = 0.18;

    for (const log of this.logs) {
      const lx = log.mesh.position.x;
      const logHalf = log.length / 2;
      if (Math.abs(px - lx) < logHalf + playerHalf) {
        return true;
      }
    }
    return false;
  }

  getLogVelocity(): number {
    if (this.logs.length === 0) return 0;
    return this.direction * this.logs[0].speed;
  }

  setLightDir(dir: THREE.Vector3): void {
    this.waterMat.uniforms.uLightDir.value.copy(dir);
  }

  update(delta: number): void {
    for (const log of this.logs) {
      log.update(delta);
    }

    // Drive the shader time uniform
    this.waterMat.uniforms.uTime.value += delta;
  }
}
