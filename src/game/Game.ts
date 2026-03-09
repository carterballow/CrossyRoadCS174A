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
import { ParticleSystem } from '../entities/Particles';
import { Rain } from '../entities/Rain';

const CAM_OFFSET = new THREE.Vector3(0, 3.5, -4.0);
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 0.5, 4);
const CAM_LERP_SPEED = 5;
const WATER_LIGHT_DIR = new THREE.Vector3(10, 20, 10).normalize();

const LANES_AHEAD = 15;
const LANES_BEHIND = 5;

type GameState = 'menu' | 'playing' | 'dying' | 'dead';

export class Game {
  private sceneMgr: SceneManager;
  private input: InputManager;
  private player: Player;
  private laneMap = new Map<number, Lane>();
  private clock = new THREE.Clock();
  private hud: HUD;
  private particles: ParticleSystem;
  private rain: Rain;

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
    this.particles = new ParticleSystem(this.sceneMgr.scene);
    this.rain = new Rain();
    this.sceneMgr.scene.add(this.rain.group);

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

    // Weighted random — grass decreases with distance, hazards increase
    const diff = this.getDifficulty(z);
    const grassWeight = Math.max(0.1, 0.35 - (diff - 1) * 0.1);
    const r = Math.random();
    if (r < grassWeight) {
      if (this.lastLaneType !== 'grass') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'grass';
    } else if (r < grassWeight + 0.3) {
      if (this.lastLaneType !== 'road') this.consecutiveCount = 1;
      else this.consecutiveCount++;
      return 'road';
    } else if (r < grassWeight + 0.52) {
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
    const minZ = playerZ - 10;
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

  private getDifficulty(z: number): number {
    // Ramps from 1.0 at z=0 to ~2.0 around z=100, capping at 2.5
    return Math.min(2.5, 1 + Math.max(0, z) * 0.012);
  }

  private createLane(type: string, z: number): Lane {
    const diff = this.getDifficulty(z);
    switch (type) {
      case 'road': {
        const spd = (1.5 + Math.random() * 2) * diff;
        return new RoadLane(z, undefined, spd);
      }
      case 'railway': {
        const wait = Math.max(1.5, (3 + Math.random() * 3) / diff);
        return new RailwayLane(z, undefined, wait);
      }
      case 'river': {
        const spd = (0.8 + Math.random() * 1.2) * diff;
        return new RiverLane(z, undefined, spd);
      }
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
      this.rain.update(delta, this.sceneMgr.camera.position);
      this.updateCamera(delta);
      this.sceneMgr.render();
      return;
    }

    if (this.state === 'dying') {
      this.player.update(delta);
      this.particles.update(delta);
      for (const [, lane] of this.laneMap) lane.update(delta);
      this.rain.update(delta, this.sceneMgr.camera.position);
      if (this.player.deathAnimDone) {
        this.finishDeath();
      }
      this.updateCamera(delta);
      this.sceneMgr.render();
      return;
    }

    if (this.state === 'dead') {
      this.handleDeadInput();
      this.particles.update(delta);
      this.rain.update(delta, this.sceneMgr.camera.position);
      this.updateCamera(delta);
      this.sceneMgr.render();
      return;
    }

    // Playing state
    this.handleInput();
    this.player.update(delta);
    this.handleLogRiding(delta);

    for (const [, lane] of this.laneMap) {
      if (lane.type === 'river') (lane as RiverLane).setLightDir(WATER_LIGHT_DIR);
      lane.update(delta);
    }

    this.updateScore();
    this.manageLanes();
    this.checkDeathCollisions();
    this.checkOutOfBounds();

    this.rain.update(delta, this.sceneMgr.camera.position);
    this.updateCamera(delta);
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
    this.particles.clear();
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

  private die(type: 'squash' | 'drown'): void {
    this.state = 'dying';
    this.player.playDeath(type);
  }

  private finishDeath(): void {
    this.state = 'dead';

    const isNewBest = this.score > this.highScore;
    if (isNewBest) {
      this.highScore = this.score;
      this.saveHighScore(this.highScore);
    }

    this.hud.showDeath(this.score, this.highScore, isNewBest);
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

    // Limit backward movement
    if (dz < 0 && targetZ < this.maxZ - 5) return;
    // Limit lateral bounds
    if (Math.abs(targetX) > 8) return;
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
        this.particles.emitImpact(this.player.position);
        this.die('squash');
      }
    }
    if (lane.type === 'river') {
      if (lane.checkCollision(this.player)) {
        this.particles.emitSplash(this.player.position);
        this.die('drown');
      }
    }
  }

  private checkOutOfBounds(): void {
    if (Math.abs(this.player.position.x) > 9.5) {
      this.particles.emitSplash(this.player.position);
      this.die('drown');
    }
  }

  private updateCamera(delta?: number): void {
    const cam = this.sceneMgr.camera;
    const p = this.player.position;

    const targetPos = new THREE.Vector3(
      p.x + CAM_OFFSET.x,
      p.y + CAM_OFFSET.y,
      p.z + CAM_OFFSET.z,
    );

    // Smooth camera follow
    if (delta && delta > 0) {
      const t = 1 - Math.exp(-CAM_LERP_SPEED * delta);
      cam.position.lerp(targetPos, t);
    } else {
      cam.position.copy(targetPos);
    }

    cam.lookAt(
      p.x + CAM_LOOK_OFFSET.x,
      p.y + CAM_LOOK_OFFSET.y,
      p.z + CAM_LOOK_OFFSET.z,
    );

    // Move shadow-casting light to follow player
    const dir = this.sceneMgr.dirLight;
    dir.position.set(p.x + 10, 20, p.z + 10);
    dir.target.position.set(p.x, 0, p.z);
    dir.target.updateMatrixWorld();
  }

  private loadHighScore(): number {
    const stored = localStorage.getItem('crossy-road-highscore');
    return stored ? parseInt(stored, 10) : 0;
  }

  private saveHighScore(score: number): void {
    localStorage.setItem('crossy-road-highscore', String(score));
  }
}
