import * as THREE from 'three';

const waterVertexShader = /* glsl */ `
uniform float uTime;
uniform float uFlowDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vWaveHeight;

float waveHeight(vec2 p, float t) {
  float h = 0.0;
  // Primary swell — slow, large
  h += sin(p.x * 1.5 + t * 0.8 + p.y * 0.3) * 0.035;
  // Secondary cross-wave
  h += sin(p.x * 2.5 - t * 1.1 + p.y * 1.8) * 0.022;
  // Medium ripples flowing with current
  h += sin(p.x * 4.5 + t * 2.0 + p.y * 3.0) * 0.012;
  // Fast small chop
  h += sin(p.x * 8.0 - t * 3.2 + p.y * 5.0) * 0.007;
  // Tiny surface noise
  h += sin(p.x * 14.0 + t * 4.5 + p.y * 10.0) * 0.003;
  h += sin(p.x * 20.0 - t * 5.0 + p.y * 15.0) * 0.0015;
  return h;
}

void main() {
  vec3 pos = position;
  float flowSpeed = 0.4;
  vec2 flowPos = vec2(pos.x + uFlowDir * uTime * flowSpeed, pos.y);

  float h = waveHeight(flowPos, uTime);
  pos.z += h;
  vWaveHeight = h;

  // Analytical normal via finite differences
  float eps = 0.03;
  float hx = waveHeight(flowPos + vec2(eps, 0.0), uTime);
  float hy = waveHeight(flowPos + vec2(0.0, eps), uTime);
  vec3 localNormal = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));

  vNormal = normalize(normalMatrix * localNormal);
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = /* glsl */ `
uniform vec3 uLightDir;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uSpecularColor;
uniform vec3 uFoamColor;
uniform float uShininess;
uniform float uAlpha;
uniform float uTime;
uniform float uFlowDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vWaveHeight;

// Simple hash-based noise for foam/caustics
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 R = reflect(-L, N);
  vec3 H = normalize(L + V);

  // Fresnel — brighter at glancing angles
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  // Depth-based color — wave peaks are shallow (lighter), troughs are deep (darker)
  float depthMix = smoothstep(-0.03, 0.04, vWaveHeight);
  vec3 baseColor = mix(uDeepColor, uShallowColor, depthMix);

  // Flowing caustic pattern on the surface
  vec2 flowUv = vWorldPos.xz * 3.0 + vec2(uFlowDir * uTime * 0.5, uTime * 0.2);
  float caustic1 = noise(flowUv);
  float caustic2 = noise(flowUv * 1.7 + vec2(uTime * 0.3, -uTime * 0.15));
  float causticPattern = smoothstep(0.35, 0.65, caustic1 * caustic2 * 4.0);
  baseColor += causticPattern * vec3(0.008, 0.015, 0.02);

  // Phong illumination
  float NdotL = max(dot(N, L), 0.0);
  vec3 diffuse = baseColor * (0.3 + 0.7 * NdotL);

  // Blinn-Phong specular — sharp highlights on wave peaks
  float NdotH = max(dot(N, H), 0.0);
  float spec = pow(NdotH, uShininess);
  // Secondary broader specular
  float spec2 = pow(NdotH, uShininess * 0.2) * 0.3;
  vec3 specular = uSpecularColor * (spec + spec2);

  // Foam on wave crests
  float foamNoise = noise(vWorldPos.xz * 6.0 + vec2(uFlowDir * uTime * 0.8, uTime * 0.3));
  float foamMask = smoothstep(0.02, 0.04, vWaveHeight) * smoothstep(0.3, 0.7, foamNoise);
  vec3 foam = uFoamColor * foamMask * 0.2;

  // Edge foam near shores (top/bottom of UV)
  float edgeDist = min(vUv.y, 1.0 - vUv.y);
  float edgeFoam = smoothstep(0.08, 0.0, edgeDist) * noise(vWorldPos.xz * 8.0 + uTime * 0.5) * 0.2;
  foam += uFoamColor * edgeFoam;

  // Combine
  vec3 color = diffuse + specular + foam;
  color += fresnel * vec3(0.01, 0.02, 0.03);

  // Alpha — slightly more opaque at wave peaks, more transparent in troughs
  float alpha = uAlpha + depthMix * 0.1 + fresnel * 0.15;

  gl_FragColor = vec4(color, alpha);
}
`;

export function createWaterMaterial(flowDir: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uFlowDir: { value: flowDir },
      uLightDir: { value: new THREE.Vector3(0.3, 1.0, 0.5).normalize() },
      uDeepColor: { value: new THREE.Color(0x020608) },
      uShallowColor: { value: new THREE.Color(0x06141e) },
      uSpecularColor: { value: new THREE.Color(0x1a2530) },
      uFoamColor: { value: new THREE.Color(0x151e25) },
      uShininess: { value: 120.0 },
      uAlpha: { value: 0.6 },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
