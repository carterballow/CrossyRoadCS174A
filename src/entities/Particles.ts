import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  emitSplash(position: THREE.Vector3): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4488cc,
        emissive: 0x2244aa,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y = 0.1;
      this.scene.add(mesh);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        3 + Math.random() * 2,
        Math.sin(angle) * speed,
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  emitImpact(position: THREE.Vector3): void {
    const count = 15;
    const colors = [0xff4444, 0xff8800, 0xffcc00];
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 0.06 + Math.random() * 0.06;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.y = 0.3;
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 3,
        Math.sin(angle) * speed,
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      });
    }
  }

  update(delta: number): void {
    const gravity = -12;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.MeshStandardMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Fade out
      const t = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - t;

      // Spin
      p.mesh.rotation.x += delta * 5;
      p.mesh.rotation.z += delta * 3;

      // Floor collision
      if (p.mesh.position.y < 0) {
        p.mesh.position.y = 0;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.MeshStandardMaterial).dispose();
    }
    this.particles = [];
  }
}
