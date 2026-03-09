import * as THREE from 'three';

const puddleVertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const puddleFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uLightDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uLightDir);

  // Dark wet ground — always starts very dark, never white
  vec3 color = vec3(0.01, 0.015, 0.02);

  // === RAIN SPLASH RIPPLES ===
  float ripple = 0.0;
  vec2 rippleGrad = vec2(0.0);

  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 cellSz = vec2(0.6 + fi * 0.25);
    vec2 cellId = floor(vWorldPos.xz / cellSz + fi * 5.1);
    vec2 cellOff = vec2(hash(cellId), hash(cellId + 31.7));
    vec2 center = (cellId + 0.3 + cellOff * 0.4) * cellSz;
    vec2 toFrag = vWorldPos.xz - center;
    float dist = length(toFrag);

    float period = 0.8 + hash(cellId + 13.0) * 0.5;
    float t = mod(uTime + hash(cellId + 5.0) * period, period) / period;

    // Expanding ring — wider and more visible
    float radius = t * 0.3;
    float ringW = 0.015 + t * 0.012;
    float ring = smoothstep(radius - ringW, radius, dist)
               * smoothstep(radius + ringW, radius, dist);
    float fade = (1.0 - t) * (1.0 - t);

    ripple += ring * fade;

    // Splash dot at impact center when fresh
    float dot_size = 0.02 * (1.0 - t * 3.0);
    float splash_dot = smoothstep(dot_size, 0.0, dist) * step(t, 0.33) * (1.0 - t * 3.0);
    ripple += splash_dot * 0.8;

    // Normal perturbation for shimmering specular
    if (dist > 0.001) {
      rippleGrad += normalize(toFrag) * ring * fade * 0.2;
    }
  }

  // Visible ripple rings — bright enough to clearly see on dark surface
  color += vec3(0.06, 0.08, 0.12) * ripple;

  // === REFLECTION ===
  // Perturb normal with ripple gradient so specular shimmers
  N = normalize(N + vec3(rippleGrad.x, 0.0, rippleGrad.y));

  // Fake sky/environment reflection — brighter at glancing angles
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  color += vec3(0.02, 0.03, 0.05) * fresnel;

  // Moonlight specular — controlled, not overwhelming
  vec3 R = reflect(-L, N);
  float specAngle = max(dot(R, V), 0.0);
  float spec = pow(specAngle, 80.0) * 0.6;
  color += vec3(0.15, 0.17, 0.2) * spec;

  // === EDGE FADE ===
  float edgeDist = length(vUv - 0.5) * 2.0;
  float edgeFade = smoothstep(1.0, 0.4, edgeDist);

  float alpha = (0.7 + fresnel * 0.2) * edgeFade;

  gl_FragColor = vec4(color, alpha);
}
`;

// Shared puddle geometries — low-segment circles for organic shapes
const puddleGeos = [
  new THREE.CircleGeometry(1, 6),
  new THREE.CircleGeometry(1, 7),
  new THREE.CircleGeometry(1, 8),
];

export function createPuddleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uLightDir: { value: new THREE.Vector3(10, 20, 10).normalize() },
    },
    vertexShader: puddleVertexShader,
    fragmentShader: puddleFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/**
 * Scatter puddles onto a lane group. Returns the shared material for time updates,
 * or null if no puddles were placed.
 */
export function scatterPuddles(parent: THREE.Group): THREE.ShaderMaterial | null {
  if (Math.random() > 0.45) return null;

  const count = Math.floor(Math.random() * 2) + 1;
  const mat = createPuddleMaterial();

  for (let i = 0; i < count; i++) {
    const geo = puddleGeos[Math.floor(Math.random() * puddleGeos.length)];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    const size = 0.3 + Math.random() * 0.5;
    mesh.scale.set(size * (0.7 + Math.random() * 0.6), size, 1);
    mesh.position.set(
      (Math.random() - 0.5) * 12,
      0.006,
      (Math.random() - 0.5) * 0.6,
    );
    mesh.renderOrder = 2;
    parent.add(mesh);
  }

  return mat;
}
