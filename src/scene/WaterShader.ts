import * as THREE from 'three';

const waterVertexShader = /* glsl */ `
uniform float uTime;
uniform float uFlowDir;

varying vec3 vWorldPos;
varying vec3 vNormal;

float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += sin(p.x * 2.0 + t * 1.2 + p.y * 0.5) * 0.025;
  h += sin(p.x * 3.5 - t * 0.8 + p.y * 2.0) * 0.015;
  h += sin(p.x * 7.0 + t * 2.5 + p.y * 4.0) * 0.008;
  h += sin(p.x * 12.0 - t * 3.0 + p.y * 8.0) * 0.004;
  return h;
}

void main() {
  vec3 pos = position;
  vec2 flowPos = vec2(pos.x + uFlowDir * uTime * 0.3, pos.y);

  float h = waveHeight(flowPos, uTime);
  pos.z += h;

  // Analytical normal via finite differences
  float eps = 0.05;
  float hx = waveHeight(flowPos + vec2(eps, 0.0), uTime);
  float hy = waveHeight(flowPos + vec2(0.0, eps), uTime);
  vec3 localNormal = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));

  vNormal = normalize(normalMatrix * localNormal);
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// Phong illumination model with alpha compositing
const waterFragmentShader = /* glsl */ `
uniform vec3 uLightDir;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uAlpha;

varying vec3 vWorldPos;
varying vec3 vNormal;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 R = reflect(-L, N);

  // Phong illumination
  // Ambient
  vec3 ambient = uAmbientColor;

  // Diffuse (Lambertian)
  float NdotL = max(dot(N, L), 0.0);
  vec3 diffuse = uDiffuseColor * NdotL;

  // Specular (Phong reflection)
  float RdotV = max(dot(R, V), 0.0);
  float spec = pow(RdotV, uShininess);
  vec3 specular = uSpecularColor * spec;

  vec3 phongColor = ambient + diffuse + specular;

  // Alpha compositing — partial transparency lets river bed show through
  gl_FragColor = vec4(phongColor, uAlpha);
}
`;

export function createWaterMaterial(flowDir: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uFlowDir: { value: flowDir },
      uLightDir: { value: new THREE.Vector3(0.3, 1.0, 0.5).normalize() },
      uAmbientColor: { value: new THREE.Color(0x0a1525) },
      uDiffuseColor: { value: new THREE.Color(0x0c2a3a) },
      uSpecularColor: { value: new THREE.Color(0x445566) },
      uShininess: { value: 64.0 },
      uAlpha: { value: 0.55 },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
