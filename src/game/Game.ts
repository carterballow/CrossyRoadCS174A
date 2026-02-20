import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { Ground } from '../entities/Ground';

const CAM_OFFSET = new THREE.Vector3(0, 6, -8);
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 1, 4);

export class Game {
  private sceneMgr: SceneManager;
  private input: InputManager;
  private player: Player;
  private ground: Ground;
  private clock = new THREE.Clock();

  constructor() {
    this.sceneMgr = new SceneManager();
    this.input = new InputManager();

    this.ground = new Ground();
    this.sceneMgr.scene.add(this.ground.mesh);

    this.player = new Player();
    this.sceneMgr.scene.add(this.player.mesh);
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
    this.ground.update(delta);
    this.updateCamera();

    this.sceneMgr.render();
  };

  private handleInput(): void {
    if (this.input.justPressed('w')) this.player.tryMove(0, 1);
    else if (this.input.justPressed('s')) this.player.tryMove(0, -1);
    else if (this.input.justPressed('a')) this.player.tryMove(1, 0);
    else if (this.input.justPressed('d')) this.player.tryMove(-1, 0);
  }

  private updateCamera(): void {
    const cam = this.sceneMgr.camera;
    const p = this.player.position;

    // Camera always behind player in the -Z direction (fixed forward orientation)
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
