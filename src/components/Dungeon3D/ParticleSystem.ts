import * as THREE from 'three';
import { DUNGEON_3D_PALETTE } from './sceneConfig';

export interface DungeonParticleSystem {
  mesh: THREE.InstancedMesh;
  update: (elapsedTime: number, reduceMotion: boolean) => void;
  dispose: () => void;
}

interface ParticleSeed {
  radius: number;
  baseAngle: number;
  baseY: number;
  orbitSpeed: number;
  bobSpeed: number;
  bobAmp: number;
  scale: number;
  rotSpeed: number;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export function createDungeonParticleSystem(
  scene: THREE.Scene,
  count = 40
): DungeonParticleSystem {
  const geo = new THREE.OctahedronGeometry(0.11, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: DUNGEON_3D_PALETTE.phosphorGreen,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.35,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const seeds: ParticleSeed[] = [];
  const paletteColors = [
    DUNGEON_3D_PALETTE.phosphorGreen,
    DUNGEON_3D_PALETTE.gold,
    DUNGEON_3D_PALETTE.cyan,
    DUNGEON_3D_PALETTE.purple,
  ];

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const radius = 3.2 + ((i * 7) % 11) * 0.62;
    const baseAngle = t * Math.PI * 2 + (i % 3) * 0.4;
    const baseY = 0.8 + ((i * 5) % 9) * 0.52;
    const orbitSpeed = (0.08 + (i % 5) * 0.025) * (i % 2 === 0 ? 1 : -1);
    const bobSpeed = 0.9 + (i % 4) * 0.3;
    const bobAmp = 0.18 + (i % 3) * 0.08;
    // Scale jitter +/- 15%
    const scale = 0.85 + ((i * 13) % 31) / 100;
    const rotSpeed = 0.6 + (i % 5) * 0.25;

    seeds.push({
      radius,
      baseAngle,
      baseY,
      orbitSpeed,
      bobSpeed,
      bobAmp,
      scale,
      rotSpeed,
    });

    const x = Math.cos(baseAngle) * radius;
    const z = Math.sin(baseAngle) * radius;
    _dummy.position.set(x, baseY, z);
    _dummy.rotation.set(i * 0.3, i * 0.5, 0);
    _dummy.scale.setScalar(scale);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);

    _color.setHex(paletteColors[i % paletteColors.length]);
    mesh.setColorAt(i, _color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  mesh.computeBoundingSphere();
  scene.add(mesh);

  const update = (elapsedTime: number, reduceMotion: boolean) => {
    if (reduceMotion) return;

    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const angle = s.baseAngle + elapsedTime * s.orbitSpeed;
      const x = Math.cos(angle) * s.radius;
      const z = Math.sin(angle) * s.radius;
      const y = s.baseY + Math.sin(elapsedTime * s.bobSpeed + i) * s.bobAmp;

      _dummy.position.set(x, y, z);
      _dummy.rotation.set(
        elapsedTime * s.rotSpeed,
        elapsedTime * s.rotSpeed * 0.7,
        0
      );
      _dummy.scale.setScalar(s.scale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    scene.remove(mesh);
    geo.dispose();
    mat.dispose();
  };

  return { mesh, update, dispose };
}
