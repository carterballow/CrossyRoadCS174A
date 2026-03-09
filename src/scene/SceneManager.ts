import * as THREE from 'three';

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly dirLight: THREE.DirectionalLight;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    // Dark night sky
    this.scene.background = new THREE.Color(0x0a0a1a);
    // Exponential fog for distance fade into darkness
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.025);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );

    this.dirLight = this.setupLighting();
    this.createMoon();
    this.createSkyline();

    window.addEventListener('resize', this.onResize);
  }

  private setupLighting(): THREE.DirectionalLight {
    // Warmer, brighter ambient for grimy streetlit feel
    const ambient = new THREE.AmbientLight(0x2a2035, 1.4);
    this.scene.add(ambient);

    // Slightly warm directional to simulate city glow bounce
    const dir = new THREE.DirectionalLight(0x6677aa, 1.0);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.bias = -0.001;
    dir.shadow.normalBias = 0.02;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 25;
    dir.shadow.camera.bottom = -10;
    this.scene.add(dir);
    this.scene.add(dir.target);

    // Hemisphere: warm sodium-vapor sky tint, dark ground
    const hemi = new THREE.HemisphereLight(0x332a1a, 0x0a0a0a, 0.6);
    this.scene.add(hemi);

    return dir;
  }

  private createMoon(): void {
    const moonGeo = new THREE.SphereGeometry(8, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xdde8ff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-40, 60, 120);
    this.scene.add(moon);

    // Subtle moon glow
    const glowGeo = new THREE.SphereGeometry(12, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8899bb,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(moon.position);
    this.scene.add(glow);
  }

  private createSkyline(): void {
    const skylineGroup = new THREE.Group();

    // Shared materials — MeshBasicMaterial bypasses lighting entirely
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x080810 });
    const windowColors = [0xffeeaa, 0xffd866, 0xaaddff, 0xffffff];

    // Generate rows of buildings at different depths
    for (const baseZ of [80, 95, 115]) {
      const density = baseZ < 100 ? 5 : 7;
      for (let x = -130; x <= 130; x += density + Math.random() * 3) {
        const width = 2.5 + Math.random() * 6;
        const height = 8 + Math.random() * (baseZ < 100 ? 45 : 25);
        const depth = 2 + Math.random() * 3;
        const bz = baseZ + Math.random() * 10;

        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeo, darkMat);
        building.position.set(x, height / 2, bz);
        skylineGroup.add(building);

        // Window strips — a few lit rows per building
        const wColor = windowColors[Math.floor(Math.random() * windowColors.length)];
        const wMat = new THREE.MeshBasicMaterial({
          color: wColor,
          transparent: true,
          opacity: 0.5 + Math.random() * 0.4,
        });
        const stripCount = Math.floor(height / 5) + 1;
        for (let s = 0; s < stripCount; s++) {
          if (Math.random() < 0.3) continue;
          const sy = 2 + s * (height / stripCount);
          if (sy > height - 1) continue;
          const sw = width * (0.5 + Math.random() * 0.4);
          const sh = 0.6 + Math.random() * 0.8;
          const stripGeo = new THREE.PlaneGeometry(sw, sh);
          const strip = new THREE.Mesh(stripGeo, wMat);
          strip.position.set(x, sy, bz - depth / 2 - 0.01);
          skylineGroup.add(strip);
        }
      }
    }

    this.scene.add(skylineGroup);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
