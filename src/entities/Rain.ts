import * as THREE from 'three';

const RAIN_COUNT = 800;
const RAIN_AREA = 16;
const RAIN_HEIGHT = 8;
const FALL_SPEED = 12;

const SPLASH_POOL = 50;
const SPLASH_LIFE = 0.35;

// Rain drop geometry — thin elongated box (streak)
const dropGeo = new THREE.BoxGeometry(0.008, 0.15, 0.008);
const dropMat = new THREE.MeshBasicMaterial({
  color: 0x8899bb,
  transparent: true,
  opacity: 0.25,
});

// Splash ring geometry — flat ring that expands on impact
const splashGeo = new THREE.RingGeometry(0.02, 0.06, 6);
const splashMat = new THREE.MeshBasicMaterial({
  color: 0x8899bb,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});

export class Rain {
  readonly group: THREE.Group;
  private drops: THREE.InstancedMesh;
  private offsets: Float32Array;
  private speeds: Float32Array;
  private matrix = new THREE.Matrix4();

  // Splash system
  private splashes: THREE.InstancedMesh;
  private splashAge: Float32Array;
  private splashPos: Float32Array;
  private nextSplashIdx = 0;
  private splashQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  private tmpPos = new THREE.Vector3();
  private tmpScale = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();

    // Rain drops
    this.drops = new THREE.InstancedMesh(dropGeo, dropMat, RAIN_COUNT);
    this.drops.frustumCulled = false;

    this.offsets = new Float32Array(RAIN_COUNT * 3);
    this.speeds = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
      this.offsets[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
      this.offsets[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
      this.offsets[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
      this.speeds[i] = FALL_SPEED + Math.random() * 4;

      this.matrix.makeTranslation(
        this.offsets[i * 3],
        this.offsets[i * 3 + 1],
        this.offsets[i * 3 + 2],
      );
      this.drops.setMatrixAt(i, this.matrix);
    }
    this.drops.instanceMatrix.needsUpdate = true;
    this.group.add(this.drops);

    // Splash rings
    this.splashes = new THREE.InstancedMesh(splashGeo, splashMat, SPLASH_POOL);
    this.splashes.frustumCulled = false;
    this.splashAge = new Float32Array(SPLASH_POOL).fill(-1);
    this.splashPos = new Float32Array(SPLASH_POOL * 2);

    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < SPLASH_POOL; i++) {
      this.splashes.setMatrixAt(i, zeroMatrix);
    }
    this.splashes.instanceMatrix.needsUpdate = true;
    this.group.add(this.splashes);
  }

  private spawnSplash(localX: number, localZ: number): void {
    const idx = this.nextSplashIdx;
    this.nextSplashIdx = (this.nextSplashIdx + 1) % SPLASH_POOL;
    this.splashAge[idx] = 0;
    this.splashPos[idx * 2] = localX;
    this.splashPos[idx * 2 + 1] = localZ;
  }

  update(delta: number, cameraPos: THREE.Vector3): void {
    // Center rain volume on camera
    this.group.position.set(cameraPos.x, 0, cameraPos.z);

    for (let i = 0; i < RAIN_COUNT; i++) {
      this.offsets[i * 3 + 1] -= this.speeds[i] * delta;

      // Reset to top when below ground
      if (this.offsets[i * 3 + 1] < -0.5) {
        // Spawn splash at impact point
        this.spawnSplash(this.offsets[i * 3], this.offsets[i * 3 + 2]);

        this.offsets[i * 3 + 1] = RAIN_HEIGHT;
        this.offsets[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
        this.offsets[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
      }

      this.matrix.makeTranslation(
        this.offsets[i * 3],
        this.offsets[i * 3 + 1],
        this.offsets[i * 3 + 2],
      );
      this.drops.setMatrixAt(i, this.matrix);
    }
    this.drops.instanceMatrix.needsUpdate = true;

    // Update splash rings
    for (let i = 0; i < SPLASH_POOL; i++) {
      if (this.splashAge[i] < 0) continue;
      this.splashAge[i] += delta;

      if (this.splashAge[i] >= SPLASH_LIFE) {
        this.splashAge[i] = -1;
        this.matrix.makeScale(0, 0, 0);
        this.splashes.setMatrixAt(i, this.matrix);
        continue;
      }

      const t = this.splashAge[i] / SPLASH_LIFE;
      const scale = 1 + t * 4;
      this.tmpPos.set(this.splashPos[i * 2], 0.01, this.splashPos[i * 2 + 1]);
      this.tmpScale.set(scale, scale, scale);
      this.matrix.compose(this.tmpPos, this.splashQuat, this.tmpScale);
      this.splashes.setMatrixAt(i, this.matrix);
    }
    this.splashes.instanceMatrix.needsUpdate = true;
  }
}
