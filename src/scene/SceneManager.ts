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
    this.renderer.toneMappingExposure = 0.8;
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    // Dark night sky
    this.scene.background = new THREE.Color(0x0a0a1a);
    // Exponential fog for distance fade into darkness
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.045);

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
    // Dim blue-tinted ambient for moonlight feel
    const ambient = new THREE.AmbientLight(0x1a1a3a, 0.8);
    this.scene.add(ambient);

    // Cool-toned directional "moonlight"
    const dir = new THREE.DirectionalLight(0x4466aa, 0.6);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 20;
    dir.shadow.camera.bottom = -20;
    this.scene.add(dir);
    this.scene.add(dir.target);

    // Faint warm hemisphere light (sky/ground)
    const hemi = new THREE.HemisphereLight(0x1a1a3a, 0x0a0a0a, 0.3);
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
