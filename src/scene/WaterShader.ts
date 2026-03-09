import * as THREE from 'three';

const waterVertexShader = /* glsl */ `
uniform float uTime;
uniform float uFlowDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vLocalPos;

float waveHeight(vec2 p, float t) {
  float h = 0.0;
  h += sin(p.x * 2.0 + t * 1.2 + p.y * 0.5) * 0.025;
  h += sin(p.x * 3.5 - t * 0.8 + p.y * 2.0) * 0.015;
  h += sin(p.x * 7.0 + t * 2.5 + p.y * 4.0) * 0.008;
  h += sin(p.x * 12.0 - t * 3.0 + p.y * 8.0) * 0.004;

  float d1 = length(p - vec2(1.5, 0.2));
  h += sin(d1 * 10.0 - t * 3.0) * 0.005 / (1.0 + d1 * 2.0);

  float d2 = length(p - vec2(-2.0, -0.1));
  h += sin(d2 * 8.0 - t * 2.5) * 0.004 / (1.0 + d2 * 2.0);

  return h;
}

void main() {
  vUv = uv;

  vec3 pos = position;
  vec2 flowPos = vec2(pos.x + uFlowDir * uTime * 0.3, pos.y);

  float h = waveHeight(flowPos, uTime);
  pos.z += h;

  float eps = 0.05;
  float hx = waveHeight(flowPos + vec2(eps, 0.0), uTime);
  float hy = waveHeight(flowPos + vec2(0.0, eps), uTime);
  vec3 localNormal = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));

  vNormal = normalize(normalMatrix * localNormal);
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  vLocalPos = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uLightDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);

  // Fresnel
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  // Very dark base — near-black water
  vec3 baseColor = vec3(0.008, 0.015, 0.03);

  // Faint moonlight contribution from directional light
  vec3 L = normalize(uLightDir);
  vec3 H = normalize(L + V);
  float moonDiff = max(dot(N, L), 0.0) * 0.06;
  float moonSpec = pow(max(dot(N, H), 0.0), 80.0) * 0.15;
  vec3 moonColor = vec3(0.4, 0.5, 0.7);

  // Streetlight point light contributions
  // Lights are at local x = -8, 0, 8 — height ~1.5 above water
  vec3 totalLight = vec3(0.0);
  vec3 warmLight = vec3(1.0, 0.9, 0.65);

  for (int i = 0; i < 3; i++) {
    float lx = -8.0 + float(i) * 8.0;
    // Light position in local space (above the water plane)
    vec3 lightPos = vec3(lx, 1.5, 0.0);

    // Vector from fragment to light in local-ish space
    vec3 toLight = vec3(lightPos.x - vLocalPos.x, lightPos.y, lightPos.z - vLocalPos.y);
    float dist = length(toLight);
    vec3 Lp = normalize(toLight);

    // Attenuation — tight falloff so light pools are localized
    float atten = 1.0 / (1.0 + dist * 0.5 + dist * dist * 0.3);

    // Diffuse from this point light
    float pDiff = max(dot(N, Lp), 0.0);

    // Specular from this point light — this is where the shimmer happens
    vec3 Hp = normalize(Lp + V);
    float pSpec = pow(max(dot(N, Hp), 0.0), 60.0);

    // Softer broader specular for the glow spread
    float pSheen = pow(max(dot(N, Hp), 0.0), 8.0);

    totalLight += warmLight * atten * (pDiff * 0.4 + pSpec * 1.2 + pSheen * 0.12);
  }

  // Combine everything
  vec3 finalColor = baseColor
    + moonColor * (moonDiff + moonSpec)
    + totalLight;

  // Slight iridescent tint in the light pools — shifts with view angle for that oily look
  float iriAngle = dot(N, V);
  vec3 iriColor = vec3(
    0.5 + 0.5 * sin(iriAngle * 6.0 + 0.0),
    0.5 + 0.5 * sin(iriAngle * 6.0 + 2.1),
    0.5 + 0.5 * sin(iriAngle * 6.0 + 4.2)
  );
  float iriStrength = length(totalLight) * 0.08;
  finalColor += iriColor * iriStrength;

  // Opacity — dark areas more transparent, lit areas more opaque
  float lightIntensity = length(totalLight);
  float alpha = mix(0.45, 0.9, clamp(fresnel * 0.5 + lightIntensity * 0.6, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function createWaterMaterial(flowDir: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uFlowDir: { value: flowDir },
      uLightDir: { value: new THREE.Vector3(0.3, 1.0, 0.5).normalize() },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
