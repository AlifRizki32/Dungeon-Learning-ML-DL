import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  DUNGEON_3D_PALETTE,
  DUNGEON_3D_ZONES,
  Dungeon3DZoneId,
  detectSoftwareWebGL,
} from './sceneConfig';
import { buildDungeonSceneObjects } from './SceneObjects';
import { createDungeonParticleSystem } from './ParticleSystem';

export interface DungeonSceneManagerOptions {
  container: HTMLElement;
  initialZone?: Dungeon3DZoneId;
  reduceMotion?: boolean;
  onSelectZone?: (zoneId: Dungeon3DZoneId) => void;
  onHoverZone?: (zoneId: Dungeon3DZoneId | null) => void;
}

export interface DungeonSceneController {
  focusZone: (zoneId: Dungeon3DZoneId) => void;
  resetCamera: () => void;
  setAutoRotate: (enabled: boolean) => void;
  setReduceMotion: (reduce: boolean) => void;
  dispose: () => void;
}

const _pointer = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export function createDungeonSceneManager(
  options: DungeonSceneManagerOptions
): DungeonSceneController {
  const { container, onSelectZone, onHoverZone } = options;
  let reduceMotion = Boolean(options.reduceMotion);
  let autoRotate = !reduceMotion;

  const isSoftwareGl = detectSoftwareWebGL();
  const width = Math.max(container.clientWidth || window.innerWidth, 320);
  const height = Math.max(container.clientHeight || window.innerHeight, 320);

  // 1. Scene & Atmospheric Fog
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(DUNGEON_3D_PALETTE.bgAbyss);
  scene.fog = new THREE.FogExp2(DUNGEON_3D_PALETTE.bgAbyss, 0.025);

  // 2. Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
  const initialZoneInfo = DUNGEON_3D_ZONES[options.initialZone || 'overview'];
  camera.position.set(...initialZoneInfo.cameraPosition);

  // 3. Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.innerHTML = '';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  // 4. Environment IBL (RoomEnvironment for metallic & clearcoat reflections)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // 5. Three-Point Warm/Cool Dungeon Lighting Rig
  const hemiLight = new THREE.HemisphereLight(
    DUNGEON_3D_PALETTE.cyan,
    DUNGEON_3D_PALETTE.bgDungeon,
    0.75
  );
  hemiLight.position.set(0, 18, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffdfa0, 2.2);
  keyLight.position.set(9, 15, 10);
  keyLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 36;
    const d = 10;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(DUNGEON_3D_PALETTE.purple, 1.1);
  rimLight.position.set(-10, 8, -10);
  scene.add(rimLight);

  const portalPointLight = new THREE.PointLight(
    DUNGEON_3D_PALETTE.phosphorGreen,
    2.6,
    11,
    1.6
  );
  portalPointLight.position.set(0, 2.4, 0.6);
  scene.add(portalPointLight);

  const neuralPointLight = new THREE.PointLight(
    DUNGEON_3D_PALETTE.cyan,
    1.6,
    8,
    1.8
  );
  neuralPointLight.position.set(-4.5, 2.4, 1.2);
  scene.add(neuralPointLight);

  const dlPointLight = new THREE.PointLight(
    DUNGEON_3D_PALETTE.bossRed,
    1.7,
    8,
    1.8
  );
  dlPointLight.position.set(0, 3.8, -4.0);
  scene.add(dlPointLight);

  // 6. Build Composite 3D Dungeon Objects & Instanced Particle System
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const handles = buildDungeonSceneObjects(scene, maxAniso, isSoftwareGl);
  const particles = createDungeonParticleSystem(scene, isSoftwareGl ? 28 : 44);

  // 7. OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...initialZoneInfo.cameraTarget);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.minDistance = 4.5;
  controls.maxDistance = 26;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minPolarAngle = 0.15;
  controls.autoRotate = autoRotate && !reduceMotion;
  controls.autoRotateSpeed = 0.55;
  controls.update();

  // Camera transition state
  let isTransitioningCamera = false;
  _targetCamPos.set(...initialZoneInfo.cameraPosition);
  _targetLookAt.set(...initialZoneInfo.cameraTarget);

  const onUserControlStart = () => {
    isTransitioningCamera = false;
  };
  controls.addEventListener('start', onUserControlStart);

  // 8. Raycasting for Interactive Learning Monuments (Layer 1)
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);

  let pointerDownX = 0;
  let pointerDownY = 0;
  let lastHoverCheck = 0;
  let currentHoveredZone: Dungeon3DZoneId | null = null;

  const updatePointerCoords = (clientX: number, clientY: number) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return true;
  };

  const handlePointerDown = (e: PointerEvent) => {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
  };

  const handlePointerUp = (e: PointerEvent) => {
    const dx = e.clientX - pointerDownX;
    const dy = e.clientY - pointerDownY;
    // Ignore drag gestures
    if (dx * dx + dy * dy > 36) return;

    if (!updatePointerCoords(e.clientX, e.clientY)) return;
    raycaster.setFromCamera(_pointer, camera);
    const hits = raycaster.intersectObjects(handles.interactables, false);
    if (hits.length > 0) {
      const zoneId = hits[0].object.userData?.zoneId as Dungeon3DZoneId | undefined;
      if (zoneId && DUNGEON_3D_ZONES[zoneId]) {
        focusZone(zoneId);
        onSelectZone?.(zoneId);
      }
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - lastHoverCheck < 50) return;
    lastHoverCheck = now;

    if (!updatePointerCoords(e.clientX, e.clientY)) return;
    raycaster.setFromCamera(_pointer, camera);
    const hits = raycaster.intersectObjects(handles.interactables, false);
    const hitZone =
      hits.length > 0
        ? (hits[0].object.userData?.zoneId as Dungeon3DZoneId | undefined) ?? null
        : null;

    if (hitZone !== currentHoveredZone) {
      currentHoveredZone = hitZone;
      renderer.domElement.style.cursor = hitZone ? 'pointer' : 'grab';
      onHoverZone?.(hitZone);
    }
  };

  renderer.domElement.addEventListener('pointerdown', handlePointerDown);
  renderer.domElement.addEventListener('pointerup', handlePointerUp);
  renderer.domElement.addEventListener('pointermove', handlePointerMove);

  // 9. Resize handling
  const handleResize = () => {
    const newW = Math.max(container.clientWidth || window.innerWidth, 320);
    const newH = Math.max(container.clientHeight || window.innerHeight, 320);
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  };
  window.addEventListener('resize', handleResize);

  // 10. Frame pacing loop (Hardware rAF vs Software WebGL fenceSync)
  const gl = renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext;
  let disposed = false;
  let rafId = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let prevTime = performance.now() * 0.001;
  let elapsed = 0;

  const afterDraw = (cb: () => void) => {
    if (disposed) return;
    if ('fenceSync' in gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        if (!sync) {
          timeoutId = setTimeout(cb, 16);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          timeoutId = setTimeout(poll, 8);
          return;
        }
        gl.deleteSync(sync);
        timeoutId = setTimeout(cb, 0);
      };
      timeoutId = setTimeout(poll, 8);
    } else {
      timeoutId = setTimeout(cb, 32);
    }
  };

  const tick = () => {
    if (disposed) return;

    const now = performance.now() * 0.001;
    const dt = Math.min(now - prevTime, 0.1);
    prevTime = now;

    if (!document.hidden) {
      if (!reduceMotion) {
        elapsed += dt;
      }

      // Smooth exponential camera damping when focusing a zone preset
      if (isTransitioningCamera) {
        const lambda = reduceMotion || isSoftwareGl ? 18 : 6.0;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _targetCamPos.x,
          lambda,
          dt
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          _targetCamPos.y,
          lambda,
          dt
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          _targetCamPos.z,
          lambda,
          dt
        );

        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          _targetLookAt.x,
          lambda,
          dt
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          _targetLookAt.y,
          lambda,
          dt
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          _targetLookAt.z,
          lambda,
          dt
        );

        if (
          camera.position.distanceToSquared(_targetCamPos) < 0.008 &&
          controls.target.distanceToSquared(_targetLookAt) < 0.008
        ) {
          camera.position.copy(_targetCamPos);
          controls.target.copy(_targetLookAt);
          isTransitioningCamera = false;
        }
      }

      // Animate 3D monuments when motion is enabled
      if (!reduceMotion) {
        handles.portalRingOuter.rotation.z = elapsed * 0.45;
        handles.portalRingInner.rotation.z = -elapsed * 0.8;
        const vortexScale = 0.96 + Math.sin(elapsed * 2.4) * 0.05;
        handles.portalVortex.scale.set(vortexScale, vortexScale, 1);

        // Neural network signal pulses along synapse lines
        for (const p of handles.neuralPulseSpheres) {
          const t = (elapsed * p.speed + p.phase) % 1;
          p.mesh.position.lerpVectors(p.start, p.end, t);
        }

        // ML data cluster gentle rotation & decision plane shimmer
        handles.clusterPointsGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.28;
        handles.decisionPlane.position.y = Math.sin(elapsed * 1.6) * 0.06;

        // DL crown prism rotation & slab hover wave
        handles.dlCrownPrism.rotation.y = elapsed * 0.9;
        handles.dlCrownPrism.position.y = 3.55 + Math.sin(elapsed * 2.1) * 0.1;
        handles.dlLayerSlabs.forEach((slab, idx) => {
          slab.rotation.y = Math.sin(elapsed * 0.7 + idx * 0.6) * 0.08;
        });

        // Floating perimeter rune crystals
        for (const fc of handles.floatingCrystals) {
          fc.group.position.y =
            fc.baseY + Math.sin(elapsed * fc.speed + fc.phase) * 0.25;
          fc.group.rotation.y = elapsed * 0.55 + fc.phase;
        }

        particles.update(elapsed, reduceMotion);
      }

      controls.autoRotate = autoRotate && !reduceMotion && !isTransitioningCamera;
      controls.update();
      renderer.render(scene, camera);
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  // Start loop
  if (isSoftwareGl) {
    renderer.render(scene, camera);
    afterDraw(tick);
  } else {
    rafId = requestAnimationFrame(tick);
  }

  // Controller API
  const focusZone = (zoneId: Dungeon3DZoneId) => {
    const zone = DUNGEON_3D_ZONES[zoneId] || DUNGEON_3D_ZONES.overview;
    _targetCamPos.set(...zone.cameraPosition);
    _targetLookAt.set(...zone.cameraTarget);
    if (reduceMotion || isSoftwareGl) {
      camera.position.copy(_targetCamPos);
      controls.target.copy(_targetLookAt);
      controls.update();
      isTransitioningCamera = false;
      renderer.render(scene, camera);
    } else {
      isTransitioningCamera = true;
    }
  };

  const resetCamera = () => {
    focusZone('overview');
  };

  const setAutoRotate = (enabled: boolean) => {
    autoRotate = enabled;
    controls.autoRotate = autoRotate && !reduceMotion;
  };

  const setReduceMotion = (reduce: boolean) => {
    reduceMotion = reduce;
    controls.autoRotate = autoRotate && !reduceMotion;
  };

  const dispose = () => {
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (timeoutId) clearTimeout(timeoutId);

    window.removeEventListener('resize', handleResize);
    controls.removeEventListener('start', onUserControlStart);
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
    renderer.domElement.removeEventListener('pointerup', handlePointerUp);
    renderer.domElement.removeEventListener('pointermove', handlePointerMove);

    particles.dispose();
    controls.dispose();
    envRT.dispose();

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const m of materials) {
          const stdMat = m as THREE.MeshStandardMaterial;
          stdMat.map?.dispose();
          stdMat.bumpMap?.dispose();
          m.dispose();
        }
      }
    });

    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    focusZone,
    resetCamera,
    setAutoRotate,
    setReduceMotion,
    dispose,
  };
}
