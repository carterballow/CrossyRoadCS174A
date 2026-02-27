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
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.035);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );

    this.dirLight = this.setupLighting();

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
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.bias = -0.001;
    dir.shadow.normalBias = 0.02;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 25;
    dir.shadow.camera.bottom = -10;
    this.scene.add(dir);
    this.scene.add(dir.target);

    // Hemisphere: warm sodium-vapor sky tint, dark ground
    const hemi = new THREE.HemisphereLight(0x332a1a, 0x0a0a0a, 0.6);
    this.scene.add(hemi);

    return dir;
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
