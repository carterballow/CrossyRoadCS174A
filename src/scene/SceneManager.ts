import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import buildingsBg from '../ui/buildings.webp';

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly dirLight: THREE.DirectionalLight;
  private composer: EffectComposer;

  constructor() {
    // Transparent canvas so CSS background shows through
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    this.renderer.setClearColor(0x000000, 0);
    document.body.appendChild(this.renderer.domElement);

    // City skyline as page background behind transparent canvas
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    const bgImg = document.createElement('img');
    bgImg.src = buildingsBg;
    Object.assign(bgImg.style, {
      position: 'fixed',
      left: '0',
      width: '100%',
      bottom: '50%',
      zIndex: '-1',
      pointerEvents: 'none',
    });
    document.body.appendChild(bgImg);
    document.body.style.backgroundColor = '#0e1820';

    this.scene = new THREE.Scene();
    // Linear fog — visible fade starts at 8 units, fully fogged at 25
    // Color matched to dark teal-black base of skyline image
    this.scene.fog = new THREE.Fog(0x0e1820, 8, 25);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );

    this.dirLight = this.setupLighting();
    this.createMoon();

    // Post-processing: Bloom for emissive glow
    const size = this.renderer.getSize(new THREE.Vector2());
    const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
    });
    this.composer = new EffectComposer(this.renderer, renderTarget);

    const renderPass = new RenderPass(this.scene, this.camera);
    renderPass.clearAlpha = 0;
    renderPass.clearColor = new THREE.Color(0x0e1820);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x / 2, size.y / 2),
      0.6,   // strength — moderate glow
      0.4,   // radius — how far the glow spreads
      0.85,  // threshold — only bright emissives bloom
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    window.addEventListener('resize', this.onResize);
  }

  private setupLighting(): THREE.DirectionalLight {
    // Ambient matched to building mid-shadow tones — steel blue-grey
    const ambient = new THREE.AmbientLight(0x1a2535, 1.6);
    this.scene.add(ambient);

    // Overhead warm fill — amber window-glow spill from the city
    const overheadDir = new THREE.DirectionalLight(0xcc8844, 0.35);
    overheadDir.position.set(0, 15, 0);
    this.scene.add(overheadDir);

    // Moonlight directional — teal-blue matched to skyline haze
    const dir = new THREE.DirectionalLight(0x6a8aaa, 1.8);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(512, 512);
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

    // Hemisphere: teal atmosphere haze from above, deep building shadow below
    const hemi = new THREE.HemisphereLight(0x2a3a4a, 0x0e1418, 1.4);
    this.scene.add(hemi);

    return dir;
  }

  private createMoon(): void {
    // Off-camera moonlight — shines from upper-left, teal-blue matched to skyline
    const moonLight = new THREE.DirectionalLight(0x8aaabe, 2.0);
    moonLight.position.set(-30, 40, 10);
    this.scene.add(moonLight);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    this.composer.render();
  }
}
