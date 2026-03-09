import * as THREE from 'three';

const waterVertexShader = /* glsl */ `
uniform float uTime;
uniform float uFlowDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

// Layered sine wave displacement — returns height at (x,z)
float waveHeight(vec2 p, float t) {
  float h = 0.0;

  // Primary wave — broad, slow
  h += sin(p.x * 2.0 + t * 1.2 + p.y * 0.5) * 0.025;

  // Secondary wave — diagonal flow
  h += sin(p.x * 3.5 - t * 0.8 + p.y * 2.0) * 0.015;

  // Tertiary — finer cross-ripples
  h += sin(p.x * 7.0 + t * 2.5 + p.y * 4.0) * 0.008;

  // Fine detail — small chop
  h += sin(p.x * 12.0 - t * 3.0 + p.y * 8.0) * 0.004;

  // Circular ripple rings
  float d1 = length(p - vec2(1.5, 0.2));
  h += sin(d1 * 10.0 - t * 3.0) * 0.005 / (1.0 + d1 * 2.0);

  float d2 = length(p - vec2(-2.0, -0.1));
  h += sin(d2 * 8.0 - t * 2.5) * 0.004 / (1.0 + d2 * 2.0);

  return h;
}

void main() {
  vUv = uv;

  // Flow-shifted coordinates
  vec3 pos = position;
  vec2 flowPos = vec2(pos.x + uFlowDir * uTime * 0.3, pos.y);

  // Displace vertex along Z (up, since plane is XY before rotation)
  float h = waveHeight(flowPos, uTime);
  pos.z += h;

  // Compute analytical normal via partial derivatives (finite diff)
  float eps = 0.05;
  float hx = waveHeight(flowPos + vec2(eps, 0.0), uTime);
  float hy = waveHeight(flowPos + vec2(0.0, eps), uTime);
  vec3 localNormal = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));

  vNormal = normalize(normalMatrix * localNormal);
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uSpecColor;
uniform float uOpacity;
uniform vec3 uLightDir;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + V);

  // Fresnel — strong rim glow at glancing angles
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);

  // Blend deep/shallow color based on viewing angle
  vec3 baseColor = mix(uShallowColor, uDeepColor, fresnel * 0.5 + 0.3);

  // Diffuse — lower ambient floor for more dramatic light contrast
  float diff = max(dot(N, L), 0.0) * 0.6 + 0.3;
  vec3 diffuse = baseColor * diff;

  // Primary specular — tight bright highlight
  float spec = pow(max(dot(N, H), 0.0), 120.0);
  vec3 specular = uSpecColor * spec * 1.5;

  // Broad sheen — wider soft glow
  float spec2 = pow(max(dot(N, H), 0.0), 12.0);
  vec3 sheen = uSpecColor * spec2 * 0.25;

  // Rim specular from a secondary overhead fill light
  vec3 L2 = normalize(vec3(0.0, 1.0, 0.0));
  vec3 H2 = normalize(L2 + V);
  float rimSpec = pow(max(dot(N, H2), 0.0), 40.0);
  vec3 rimHighlight = vec3(0.6, 0.75, 1.0) * rimSpec * 0.4;

  // Animated caustic-like pattern — brighter, more visible
  float caustic = sin(vWorldPos.x * 8.0 + uTime * 1.5)
                * sin(vWorldPos.z * 6.0 + uTime * 1.2) * 0.5 + 0.5;
  caustic = pow(caustic, 2.5) * 0.12;
  vec3 causticColor = vec3(0.3, 0.6, 0.8) * caustic;

  // Fake streetlight reflections — bright vertical streaks on water
  float streetReflect = 0.0;
  for (float i = -8.0; i <= 8.0; i += 4.0) {
    float dx = vWorldPos.x - i;
    float streak = exp(-dx * dx * 1.5);
    // Animate the streak with wave motion
    streak *= (0.7 + 0.3 * sin(vWorldPos.z * 3.0 + uTime * 2.0 + i));
    streetReflect += streak;
  }
  vec3 streetColor = vec3(1.0, 0.9, 0.7) * streetReflect * 0.15;

  // Fresnel edge glow — simulates ambient city light catching edges
  vec3 edgeGlow = vec3(0.15, 0.2, 0.35) * fresnel * 0.5;

  vec3 finalColor = diffuse + specular + sheen + rimHighlight + causticColor + streetColor + edgeGlow;

  // Opacity: more opaque where light interacts, transparent at flat angles
  float alpha = mix(uOpacity * 0.6, uOpacity, fresnel + spec * 0.3);
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export function createWaterMaterial(flowDir: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uFlowDir: { value: flowDir },
      uDeepColor: { value: new THREE.Color(0x06182e) },
      uShallowColor: { value: new THREE.Color(0x1a5070) },
      uSpecColor: { value: new THREE.Color(0xbbddff) },
      uOpacity: { value: 0.72 },
      uLightDir: { value: new THREE.Vector3(0.3, 1.0, 0.5).normalize() },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
