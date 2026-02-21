import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { Lane } from '../lanes/Lane';
import { GrassLane } from '../lanes/GrassLane';
import { RoadLane } from '../lanes/RoadLane';
import { RailwayLane } from '../lanes/RailwayLane';
import { RiverLane } from '../lanes/RiverLane';
import { HUD } from '../ui/HUD';

const CAM_OFFSET = new THREE.Vector3(0, 6, -8);
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 1, 4);

const LANES_AHEAD = 20;
const LANES_BEHIND = 8;

type GameState = 'menu' | 'playing' | 'dead';

export class Game {
  private sceneMgr: SceneManager;
  private input: InputManager;
  private player: Player;
  private laneMap = new Map<number, Lane>();
  private clock = new THREE.Clock();
  private hud: HUD;

  private state: GameState = 'menu';
  private score = 0;
  private highScore = 0;
  private maxZ = 0;

  // Procedural generation state
  private nextLaneZ = 0;
  private lastLaneType = 'grass';
  private consecutiveCount = 0;

  constructor() {
    this.sceneMgr = new SceneManager();
    this.input = new InputManager();
    this.hud = new HUD();

    this.highScore = this.loadHighScore();

    this.initLanes();

    this.player = new Player();
    this.sceneMgr.scene.add(this.player.mesh);

    this.hud.showStart();
    this.hud.setHighScore(this.highScore);
  }

  private initLanes(): void {
    this.nextLaneZ = -LANES_BEHIND;
    this.lastLaneType = 'grass';
    this.consecutiveCount = 0;
    this.generateLanesUpTo(LANES_AHEAD);
  }

  private generateLanesUpTo(targetZ: number): void {
    while (this.nextLaneZ <= targetZ) {
      const z = this.nextLaneZ;
      const type = this.pickLaneType(z);
      const lane = this.createLane(type, z);
      this.laneMap.set(z, lane);
      this.sceneMgr.scene.add(lane.mesh);

      this.lastLaneType = type;
      this.nextLaneZ++;
    }
  }

  private pickLaneType(z: number): string {
    // Safe starting area
    if (z >= -2 && z <= 2) return 'grass';

    // After a road/railway run, force at least 1 grass
    if (this.lastLaneType !== 'grass' && this.consecutiveCount >= 1) {
      // Chance to keep going or force grass
      if (this.consecutiveCount >= 4 || Math.random() < 0.4) {
        this.consecutiveCount = 1;
        return 'grass';
      }
    }

    // If we've had grass for a while, pick something else
    if (this.lastLaneType === 'grass' && this.consecutiveCount >= 2) {
      const r = Math.random();
      if (r < 0.45) {
        this.consecutiveCount = 1;
        return 'road';
      } else if (r < 0.7) {
        this.consecutiveCount = 1;
        return 'river';
      } else if (r < 0.9) {
        this.consecutiveCount = 1;
        return 'railway';
      }
    }

    // Default weighted random
    const r = Math.random();
    if (r < 0.3) {
      if (this.lastLaneType !== 'grass') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'grass';
    } else if (r < 0.6) {
      if (this.lastLaneType !== 'road') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'road';
    } else if (r < 0.82) {
      if (this.lastLaneType !== 'river') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'river';
    } else {
      if (this.lastLaneType !== 'railway') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'railway';
    }
  }

  private pruneLanesBehind(playerZ: number): void {
    const minZ = playerZ - LANES_BEHIND;
    for (const [z, lane] of this.laneMap) {
      if (z < minZ) {
        this.sceneMgr.scene.remove(lane.mesh);
        lane.dispose();
        this.laneMap.delete(z);
      }
    }
  }

  private clearLanes(): void {
    for (const [, lane] of this.laneMap) {
      this.sceneMgr.scene.remove(lane.mesh);
      lane.dispose();
    }
    this.laneMap.clear();
  }

  private createLane(type: string, z: number): Lane {
    switch (type) {
      case 'road':
        return new RoadLane(z);
      case 'railway':
        return new RailwayLane(z);
      case 'river':
        return new RiverLane(z);
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

    if (this.state === 'menu') {
      this.handleMenuInput();
      for (const [, lane] of this.laneMap) lane.update(delta);
      this.updateCamera();
      this.sceneMgr.render();
      return;
    }

    if (this.state === 'dead') {
      this.handleDeadInput();
      this.updateCamera();
      this.sceneMgr.render();
      return;
    }

    // Playing state
    this.handleInput();
    this.player.update(delta);
    this.handleLogRiding(delta);

    for (const [, lane] of this.laneMap) {
      lane.update(delta);
    }

    this.updateScore();
    this.manageLanes();
    this.checkDeathCollisions();

    this.updateCamera();
    this.sceneMgr.render();
  };

  private manageLanes(): void {
    const playerZ = Math.round(this.player.position.z);
    this.generateLanesUpTo(playerZ + LANES_AHEAD);
    this.pruneLanesBehind(playerZ);
  }

  private handleMenuInput(): void {
    if (this.input.anyJustPressed()) {
      this.state = 'playing';
      this.hud.showPlaying();
    }
  }

  private handleDeadInput(): void {
    if (this.input.anyJustPressed()) {
      this.restart();
    }
  }

  private restart(): void {
    this.clearLanes();
    this.initLanes();

    this.sceneMgr.scene.remove(this.player.mesh);
    this.player = new Player();
    this.sceneMgr.scene.add(this.player.mesh);

    this.score = 0;
    this.maxZ = 0;
    this.hud.setScore(0);
    this.state = 'playing';
    this.hud.showPlaying();
  }

  private updateScore(): void {
    const currentZ = Math.round(this.player.position.z);
    if (currentZ > this.maxZ) {
      this.maxZ = currentZ;
      this.score = this.maxZ;
      this.hud.setScore(this.score);
    }
  }

  private die(): void {
    this.state = 'dead';

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore(this.highScore);
    }

    this.hud.showDeath(this.score, this.highScore);
  }

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
    const lane = this.laneMap.get(targetZ);
    if (lane && lane.type === 'grass') {
      const oldPos = this.player.position.clone();
      this.player.position.set(targetX, oldPos.y, targetZ);

      const blocked = lane.checkCollision(this.player);

      this.player.position.copy(oldPos);

      if (blocked) return;
    }
    this.player.move(dx, dz);
  }

  private handleLogRiding(delta: number): void {
    if (this.player.isMoving) return;
    const currentZ = Math.round(this.player.position.z);
    const lane = this.laneMap.get(currentZ);
    if (lane && lane.type === 'river') {
      const riverLane = lane as RiverLane;
      if (riverLane.isOnLog(this.player)) {
        this.player.position.x += riverLane.getLogVelocity() * delta;
      }
    }
  }

  private checkDeathCollisions(): void {
    const currentZ = Math.round(this.player.position.z);
    const lane = this.laneMap.get(currentZ);
    if (!lane) return;
    if (lane.type === 'road' || lane.type === 'railway') {
      if (lane.checkCollision(this.player)) {
        this.die();
      }
    }
    if (lane.type === 'river') {
      if (lane.checkCollision(this.player)) {
        this.die();
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

  private loadHighScore(): number {
    const stored = localStorage.getItem('crossy-road-highscore');
    return stored ? parseInt(stored, 10) : 0;
  }

  private saveHighScore(score: number): void {
    localStorage.setItem('crossy-road-highscore', String(score));
  }
}
