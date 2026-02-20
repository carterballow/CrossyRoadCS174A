import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { Lane } from '../lanes/Lane';
import { GrassLane } from '../lanes/GrassLane';
import { RoadLane } from '../lanes/RoadLane';
import { RailwayLane } from '../lanes/RailwayLane';

const CAM_OFFSET = new THREE.Vector3(0, 6, -8);
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 1, 4);


const LANE_PATTERN: [string, number][] = [
  ['grass', 3],
  ['road', 3],
  ['grass', 2],
  ['railway', 1],
  ['grass', 2],
  ['road', 4],
  ['grass', 1],
  ['railway', 1],
  ['grass', 2],
  ['road', 2],
  ['grass', 3],
  ['railway', 1],
  ['road', 3],
  ['grass', 2],
  ['road', 2],
  ['grass', 1],
  ['railway', 1],
  ['grass', 3],
];

export class Game {
  private sceneMgr: SceneManager;
  private input: InputManager;
  private player: Player;
  private lanes: Lane[] = [];
  private clock = new THREE.Clock();

  constructor() {
    this.sceneMgr = new SceneManager();
    this.input = new InputManager();

    this.buildLanes();

    this.player = new Player();
    this.sceneMgr.scene.add(this.player.mesh);
  }

  private buildLanes(): void {
    let z = -5; // start a few lanes behind the player spawn
    for (const [type, count] of LANE_PATTERN) {
      for (let i = 0; i < count; i++) {
        const lane = this.createLane(type, z);
        this.lanes.push(lane);
        this.sceneMgr.scene.add(lane.mesh);
        z++;
      }
    }
  }

  private createLane(type: string, z: number): Lane {
    switch (type) {
      case 'road':
        return new RoadLane(z);
      case 'railway':
        return new RailwayLane(z);
      case 'grass':
      default:
        return new GrassLane(z);
    }
  }

  start(): void {
    this.clock.start();
    this.loop();
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const delta = this.clock.getDelta();

    this.handleInput();
    this.player.update(delta);

    for (const lane of this.lanes) {
      lane.update(delta);
    }

    this.checkDeathCollisions();

    this.updateCamera();
    this.sceneMgr.render();
  };

  private handleInput(): void {
  if (this.input.justPressed('w') || this.input.justPressed('ArrowUp')) {
    this.tryMovePlayer(0, 1);
  }
  else if (this.input.justPressed('s') || this.input.justPressed('ArrowDown')) {
    this.tryMovePlayer(0, -1);
  }
  else if (this.input.justPressed('a') || this.input.justPressed('ArrowLeft')) {
    this.tryMovePlayer(1, 0);
  }
  else if (this.input.justPressed('d') || this.input.justPressed('ArrowRight')) {
    this.tryMovePlayer(-1, 0);
  }
}
  private tryMovePlayer(dx: number, dz: number): void {
    const targetX = Math.round(this.player.position.x) + dx;
    const targetZ = Math.round(this.player.position.z) + dz;
    const lane = this.getLaneAtZ(targetZ);
    if (lane && lane.type === 'grass') {
      const oldPos = this.player.position.clone();
      this.player.position.set(targetX, oldPos.y, targetZ);

      const blocked = lane.checkCollision(this.player);

      // 
      this.player.position.copy(oldPos);

      if (blocked) return; 
    }
    this.player.move(dx, dz);
  }

  private getLaneAtZ(z: number): Lane | undefined {
    return this.lanes.find((l) => l.zIndex === z);
  }

  private checkDeathCollisions(): void {
    const currentZ = Math.round(this.player.position.z);
    const lane = this.getLaneAtZ(currentZ);
    if (!lane) return;
    if (lane.type === 'road' || lane.type === 'railway') {
      if (lane.checkCollision(this.player)) {
        this.player.position.set(0, this.player.position.y, 0);
      }
    }
  }

  private updateCamera(): void {
    const cam = this.sceneMgr.camera;
    const p = this.player.position;

    cam.position.set(
      p.x + CAM_OFFSET.x,
      p.y + CAM_OFFSET.y,
      p.z + CAM_OFFSET.z,
    );

    cam.lookAt(
      p.x + CAM_LOOK_OFFSET.x,
      p.y + CAM_LOOK_OFFSET.y,
      p.z + CAM_LOOK_OFFSET.z,
    );
  }
}
