import * as THREE from 'three';
import { DUNGEON_3D_PALETTE, Dungeon3DZoneId } from './sceneConfig';

export interface AnimatedDungeonHandles {
  portalRingOuter: THREE.Mesh;
  portalRingInner: THREE.Mesh;
  portalVortex: THREE.Mesh;
  neuralPulseSpheres: {
    mesh: THREE.Mesh;
    start: THREE.Vector3;
    end: THREE.Vector3;
    speed: number;
    phase: number;
  }[];
  clusterPointsGroup: THREE.Group;
  decisionPlane: THREE.Mesh;
  dlCrownPrism: THREE.Mesh;
  dlLayerSlabs: THREE.Mesh[];
  floatingCrystals: {
    group: THREE.Group;
    baseY: number;
    speed: number;
    phase: number;
  }[];
  interactables: THREE.Object3D[];
}

/**
 * Generates a procedural pixel-art cobblestone albedo + bump CanvasTexture
 * with zero external file dependencies.
 */
export function createPixelCobbleTextures(maxAnisotropy: number): {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 128;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base dark abyssal mortar
  aCtx.fillStyle = '#120d26';
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#222222';
  bCtx.fillRect(0, 0, size, size);

  const brickColors = ['#1f193d', '#2b2352', '#241b3d', '#32285e'];
  const tileW = 16;
  const tileH = 16;

  for (let row = 0; row < size / tileH; row++) {
    const offset = (row % 2) * (tileW / 2);
    for (let col = -1; col < size / tileW + 1; col++) {
      const x = col * tileW + offset;
      const y = row * tileH;
      const colorIdx = Math.abs((row * 7 + col * 13) % brickColors.length);

      aCtx.fillStyle = brickColors[colorIdx];
      aCtx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

      // Pixel highlight top-left edge
      aCtx.fillStyle = '#5c4e99';
      aCtx.fillRect(x + 1, y + 1, tileW - 3, 2);
      aCtx.fillRect(x + 1, y + 1, 2, tileH - 3);

      // Subtle rune gold speck on select tiles
      if ((row + col) % 7 === 0) {
        aCtx.fillStyle = '#f5b935';
        aCtx.fillRect(x + 6, y + 6, 3, 3);
      }

      // Bump height
      bCtx.fillStyle = '#cccccc';
      bCtx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);
    }
  }

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(6, 6);
  albedoMap.magFilter = THREE.NearestFilter;
  albedoMap.minFilter = THREE.NearestMipmapLinearFilter;
  albedoMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);
  bumpMap.anisotropy = maxAnisotropy;

  return { albedoMap, bumpMap };
}

function createContactShadow(radius: number, yOffset = 0.02): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x05030a,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = yOffset;
  return mesh;
}

function attachRaycastProxy(
  parent: THREE.Group,
  zoneId: Dungeon3DZoneId,
  size: [number, number, number],
  centerY: number,
  interactables: THREE.Object3D[]
) {
  const proxyGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const proxyMat = new THREE.MeshBasicMaterial({
    visible: false,
  });
  const proxy = new THREE.Mesh(proxyGeo, proxyMat);
  proxy.position.set(0, centerY, 0);
  proxy.layers.enable(1);
  proxy.userData.zoneId = zoneId;
  parent.add(proxy);
  interactables.push(proxy);
}

/**
 * Builds the complete composite 3D Dungeon Environment:
 * 1. Floating multi-tier voxel/low-poly dungeon island with underside rocky spires & corner braziers
 * 2. Central Glowing Portal (Composite 8-part monument)
 * 3. West Wing: Neural Network 3D Sculpture (Input -> Hidden -> Output + animated signal pulses)
 * 4. East Wing: Machine Learning Data Cluster & Decision Boundary Holotable
 * 5. North Wing: Deep Learning Multi-Layer Tensor & Attention Tower
 * 6. Orbiting Rune Crystals
 */
export function buildDungeonSceneObjects(
  scene: THREE.Scene,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): AnimatedDungeonHandles {
  const interactables: THREE.Object3D[] = [];
  const { albedoMap, bumpMap } = createPixelCobbleTextures(maxAnisotropy);

  // Shared PBR Materials with varied roughness/metalness (>= 0.25 delta across parts)
  const stoneDeckMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: albedoMap,
    bumpMap,
    bumpScale: 0.06,
    roughness: 0.82,
    metalness: 0.12,
  });

  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: DUNGEON_3D_PALETTE.stoneDark,
    roughness: 0.88,
    metalness: 0.1,
  });

  const carvedStoneMat = new THREE.MeshStandardMaterial({
    color: DUNGEON_3D_PALETTE.stoneMid,
    roughness: 0.6,
    metalness: 0.22,
  });

  const goldTrimMat = new THREE.MeshPhysicalMaterial({
    color: DUNGEON_3D_PALETTE.gold,
    roughness: 0.22,
    metalness: 0.88,
    clearcoat: 0.6,
  });

  const phosphorGreenMat = new THREE.MeshStandardMaterial({
    color: DUNGEON_3D_PALETTE.phosphorGreen,
    emissive: DUNGEON_3D_PALETTE.phosphorGreen,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.3,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: DUNGEON_3D_PALETTE.cyan,
    emissive: DUNGEON_3D_PALETTE.cyan,
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.35,
  });

  const bossRedGlowMat = new THREE.MeshStandardMaterial({
    color: DUNGEON_3D_PALETTE.bossRed,
    emissive: DUNGEON_3D_PALETTE.bossRed,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.4,
  });

  // ==========================================================================
  // 1. FLOATING DUNGEON ISLAND (Multi-Part Composite Group)
  // ==========================================================================
  const islandGroup = new THREE.Group();
  islandGroup.position.set(0, 0, 0);

  // Primary deck platform (octagonal extruded slab with bevels)
  const deckShape = new THREE.Shape();
  const r = 8.4;
  const cut = 2.4;
  deckShape.moveTo(-r + cut, -r);
  deckShape.lineTo(r - cut, -r);
  deckShape.lineTo(r, -r + cut);
  deckShape.lineTo(r, r - cut);
  deckShape.lineTo(r - cut, r);
  deckShape.lineTo(-r + cut, r);
  deckShape.lineTo(-r, r - cut);
  deckShape.lineTo(-r, -r + cut);
  deckShape.closePath();

  const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.9,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 2,
  });
  deckGeo.rotateX(Math.PI / 2);
  const deckMesh = new THREE.Mesh(deckGeo, stoneDeckMat);
  deckMesh.position.y = 0;
  deckMesh.receiveShadow = !isSoftwareGl;
  islandGroup.add(deckMesh);

  // Gold runic border rim around the island deck (offset on Y to avoid Z-fighting)
  const rimGeo = new THREE.RingGeometry(7.2, 7.55, 8);
  rimGeo.rotateX(-Math.PI / 2);
  rimGeo.rotateY(Math.PI / 8);
  const rimMesh = new THREE.Mesh(rimGeo, goldTrimMat);
  rimMesh.position.y = 0.03;
  islandGroup.add(rimMesh);

  // Tapered rocky underside spires (5-part stalactite cluster so island feels grounded in space)
  const spireConfigs: [number, number, number, number, number][] = [
    [0, -3.2, 0, 6.2, 4.8],
    [-3.2, -2.4, -2.6, 2.5, 3.4],
    [3.4, -2.5, -2.2, 2.4, 3.6],
    [-2.8, -2.2, 2.9, 2.2, 3.1],
    [3.0, -2.3, 2.7, 2.3, 3.3],
  ];
  for (const [sx, sy, sz, rad, h] of spireConfigs) {
    const coneGeo = new THREE.ConeGeometry(rad, h, 7);
    coneGeo.rotateX(Math.PI);
    const coneMesh = new THREE.Mesh(coneGeo, darkStoneMat);
    coneMesh.position.set(sx, sy, sz);
    islandGroup.add(coneMesh);
  }

  // 4 Corner Voxel Runic Pillars with Braziers
  const cornerCoords: [number, number][] = [
    [-5.8, -5.8],
    [5.8, -5.8],
    [-5.8, 5.8],
    [5.8, 5.8],
  ];
  for (const [cx, cz] of cornerCoords) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(cx, 0, cz);

    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.3), carvedStoneMat);
    baseMesh.position.y = 0.2;
    pillarGroup.add(baseMesh);

    const shaftMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.9), darkStoneMat);
    shaftMesh.position.y = 1.6;
    shaftMesh.castShadow = !isSoftwareGl;
    pillarGroup.add(shaftMesh);

    const capMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), goldTrimMat);
    capMesh.position.y = 2.95;
    pillarGroup.add(capMesh);

    const flameMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), phosphorGreenMat);
    flameMesh.position.y = 3.45;
    pillarGroup.add(flameMesh);

    pillarGroup.add(createContactShadow(0.95, 0.02));
    islandGroup.add(pillarGroup);
  }

  scene.add(islandGroup);

  // ==========================================================================
  // 2. CENTRAL GLOWING PORTAL (Composite 8-Part Hero Structure)
  // ==========================================================================
  const portalGroup = new THREE.Group();
  portalGroup.position.set(0, 0, 0);

  // Stepped dais plinth (2 steps)
  const daisStep1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.28, 8), carvedStoneMat);
  daisStep1.position.y = 0.14;
  daisStep1.receiveShadow = !isSoftwareGl;
  portalGroup.add(daisStep1);

  const daisStep2 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.26, 8), darkStoneMat);
  daisStep2.position.y = 0.41;
  portalGroup.add(daisStep2);

  // Left & Right Stone Jamb Pillars
  const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.4, 0.65), carvedStoneMat);
  leftJamb.position.set(-1.75, 2.1, 0);
  leftJamb.castShadow = !isSoftwareGl;
  portalGroup.add(leftJamb);

  const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.4, 0.65), carvedStoneMat);
  rightJamb.position.set(1.75, 2.1, 0);
  rightJamb.castShadow = !isSoftwareGl;
  portalGroup.add(rightJamb);

  // Arch lintel & keystone
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 0.8), darkStoneMat);
  lintel.position.set(0, 3.95, 0);
  portalGroup.add(lintel);

  const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldTrimMat);
  keystone.position.set(0, 4.35, 0);
  portalGroup.add(keystone);

  // Outer rotating gold rune torus
  const portalRingOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.11, 10, 24),
    goldTrimMat
  );
  portalRingOuter.position.set(0, 2.25, 0);
  portalGroup.add(portalRingOuter);

  // Inner counter-rotating cyan energy ring
  const portalRingInner = new THREE.Mesh(
    new THREE.TorusGeometry(1.16, 0.06, 8, 20),
    cyanGlowMat
  );
  portalRingInner.position.set(0, 2.25, 0);
  portalGroup.add(portalRingInner);

  // Glowing Portal Vortex Disc
  const vortexMat = new THREE.MeshPhysicalMaterial({
    color: DUNGEON_3D_PALETTE.phosphorGreen,
    emissive: DUNGEON_3D_PALETTE.phosphorGreen,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portalVortex = new THREE.Mesh(new THREE.CircleGeometry(1.12, 24), vortexMat);
  portalVortex.position.set(0, 2.25, 0);
  portalVortex.renderOrder = 2;
  portalGroup.add(portalVortex);

  portalGroup.add(createContactShadow(3.15, 0.02));
  attachRaycastProxy(portalGroup, 'portal', [4.4, 4.6, 2.2], 2.3, interactables);
  scene.add(portalGroup);

  // ==========================================================================
  // 3. WEST MONUMENT: NEURAL NETWORK 3D SCULPTURE (Input -> Hidden -> Output)
  // ==========================================================================
  const neuralGroup = new THREE.Group();
  neuralGroup.position.set(-4.5, 0, 0.8);

  const nnPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.45, 2.6),
    carvedStoneMat
  );
  nnPedestal.position.y = 0.225;
  neuralGroup.add(nnPedestal);

  const nnTrim = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.08, 2.7),
    goldTrimMat
  );
  nnTrim.position.y = 0.47;
  neuralGroup.add(nnTrim);

  // Layer X offsets relative to neuralGroup: Input (-1.1), Hidden (0), Output (+1.1)
  const layerConfigs: { x: number; ys: number[]; mat: THREE.Material }[] = [
    { x: -1.1, ys: [1.1, 1.85, 2.6], mat: cyanGlowMat },
    { x: 0.0, ys: [0.95, 1.55, 2.15, 2.75], mat: goldTrimMat },
    { x: 1.1, ys: [1.35, 2.25], mat: phosphorGreenMat },
  ];

  const layerPositions: THREE.Vector3[][] = [];
  const nodeGeo = new THREE.IcosahedronGeometry(0.2, 1);

  for (const layer of layerConfigs) {
    const pts: THREE.Vector3[] = [];
    for (const yVal of layer.ys) {
      const pos = new THREE.Vector3(layer.x, yVal, 0);
      pts.push(pos);
      const nodeMesh = new THREE.Mesh(nodeGeo, layer.mat);
      nodeMesh.position.copy(pos);
      neuralGroup.add(nodeMesh);
    }
    layerPositions.push(pts);
  }

  // Synapse connections + animated signal pulse spheres
  const linePoints: THREE.Vector3[] = [];
  const neuralPulseSpheres: AnimatedDungeonHandles['neuralPulseSpheres'] = [];
  const pulseGeo = new THREE.SphereGeometry(0.075, 8, 8);

  for (let l = 0; l < layerPositions.length - 1; l++) {
    const fromLayer = layerPositions[l];
    const toLayer = layerPositions[l + 1];
    fromLayer.forEach((startPos, i) => {
      toLayer.forEach((endPos, j) => {
        linePoints.push(startPos, endPos);
        if ((i + j) % 2 === 0) {
          const pulseMesh = new THREE.Mesh(pulseGeo, phosphorGreenMat);
          pulseMesh.position.copy(startPos);
          neuralGroup.add(pulseMesh);
          neuralPulseSpheres.push({
            mesh: pulseMesh,
            start: startPos.clone(),
            end: endPos.clone(),
            speed: 0.65 + ((i * 3 + j) % 4) * 0.15,
            phase: (i * 0.27 + j * 0.41) % 1,
          });
        }
      });
    });
  }

  const synapseGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const synapseMat = new THREE.LineBasicMaterial({
    color: DUNGEON_3D_PALETTE.cyan,
    transparent: true,
    opacity: 0.55,
  });
  const synapseLines = new THREE.LineSegments(synapseGeo, synapseMat);
  neuralGroup.add(synapseLines);

  neuralGroup.add(createContactShadow(2.1, 0.02));
  attachRaycastProxy(neuralGroup, 'neural', [3.4, 3.2, 2.6], 1.6, interactables);
  scene.add(neuralGroup);

  // ==========================================================================
  // 4. EAST MONUMENT: MACHINE LEARNING DATA CLUSTERS & DECISION BOUNDARY
  // ==========================================================================
  const mlGroup = new THREE.Group();
  mlGroup.position.set(4.5, 0, 0.8);

  const mlTableBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.8, 0.5, 8),
    carvedStoneMat
  );
  mlTableBase.position.y = 0.25;
  mlGroup.add(mlTableBase);

  const mlTableRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.52, 0.07, 8, 16),
    goldTrimMat
  );
  mlTableRim.rotateX(Math.PI / 2);
  mlTableRim.position.y = 0.52;
  mlGroup.add(mlTableRim);

  const clusterPointsGroup = new THREE.Group();
  clusterPointsGroup.position.set(0, 1.75, 0);

  // Class A (Phosphor Green Octahedrons - negative X/Y offset)
  const classAGeo = new THREE.OctahedronGeometry(0.16, 0);
  const classAOffsets: [number, number, number][] = [
    [-0.75, -0.35, 0.3],
    [-0.55, 0.15, -0.35],
    [-0.9, 0.25, 0.15],
    [-0.4, -0.45, -0.2],
    [-0.68, -0.1, 0.55],
    [-0.35, 0.4, 0.25],
  ];
  for (const [ox, oy, oz] of classAOffsets) {
    const m = new THREE.Mesh(classAGeo, phosphorGreenMat);
    m.position.set(ox, oy, oz);
    clusterPointsGroup.add(m);
  }

  // Class B (Gold Cubes - positive X/Y offset)
  const classBGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const classBOffsets: [number, number, number][] = [
    [0.75, 0.35, -0.25],
    [0.55, -0.15, 0.4],
    [0.9, -0.2, -0.15],
    [0.42, 0.48, 0.2],
    [0.68, 0.1, -0.5],
    [0.38, -0.42, -0.3],
  ];
  for (const [ox, oy, oz] of classBOffsets) {
    const m = new THREE.Mesh(classBGeo, goldTrimMat);
    m.position.set(ox, oy, oz);
    clusterPointsGroup.add(m);
  }

  // Glowing Translucent Decision Boundary Plane separating Class A and Class B
  const boundaryMat = new THREE.MeshPhysicalMaterial({
    color: DUNGEON_3D_PALETTE.cyan,
    emissive: DUNGEON_3D_PALETTE.cyan,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const decisionPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.6), boundaryMat);
  decisionPlane.rotation.set(0.2, Math.PI / 3.2, 0.35);
  decisionPlane.renderOrder = 3;
  clusterPointsGroup.add(decisionPlane);

  mlGroup.add(clusterPointsGroup);
  mlGroup.add(createContactShadow(2.0, 0.02));
  attachRaycastProxy(mlGroup, 'clusters', [3.2, 3.2, 3.0], 1.6, interactables);
  scene.add(mlGroup);

  // ==========================================================================
  // 5. NORTH MONUMENT: DEEP LEARNING MULTI-LAYER TENSOR & ATTENTION TOWER
  // ==========================================================================
  const dlGroup = new THREE.Group();
  dlGroup.position.set(0, 0, -4.4);

  const dlPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.45, 2.2),
    carvedStoneMat
  );
  dlPedestal.position.y = 0.225;
  dlGroup.add(dlPedestal);

  const dlLayerSlabs: THREE.Mesh[] = [];
  const slabSizes: [number, number, number][] = [
    [2.2, 0.24, 1.6],
    [1.85, 0.24, 1.35],
    [1.5, 0.24, 1.1],
    [1.15, 0.24, 0.85],
  ];
  const slabMats = [carvedStoneMat, cyanGlowMat, goldTrimMat, phosphorGreenMat];

  slabSizes.forEach(([w, h, d], idx) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), slabMats[idx]);
    slab.position.set(0, 0.85 + idx * 0.62, 0);
    slab.castShadow = !isSoftwareGl;
    dlGroup.add(slab);
    dlLayerSlabs.push(slab);
  });

  // Residual Skip-Connection Curved Tube bridging Layer 1 to Layer 4
  const skipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.1, 0.85, 0),
    new THREE.Vector3(-1.55, 1.78, 0),
    new THREE.Vector3(-0.6, 2.71, 0),
  ]);
  const skipTube = new THREE.Mesh(
    new THREE.TubeGeometry(skipCurve, 20, 0.06, 8, false),
    goldTrimMat
  );
  dlGroup.add(skipTube);

  // Attention Crown Prism at the top of the DL Tower
  const dlCrownPrism = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    bossRedGlowMat
  );
  dlCrownPrism.position.set(0, 3.55, 0);
  dlGroup.add(dlCrownPrism);

  dlGroup.add(createContactShadow(1.95, 0.02));
  attachRaycastProxy(dlGroup, 'deeplearning', [3.2, 4.0, 2.6], 2.0, interactables);
  scene.add(dlGroup);

  // ==========================================================================
  // 6. FLOATING RUNE CRYSTALS & STONES AROUND THE ISLAND PERIMETER
  // ==========================================================================
  const floatingCrystals: AnimatedDungeonHandles['floatingCrystals'] = [];
  const crystalPositions: [number, number, number, boolean][] = [
    [-7.2, 2.2, -3.2, true],
    [7.2, 2.5, -3.0, false],
    [-6.6, 1.9, 4.4, false],
    [6.8, 2.3, 4.2, true],
  ];

  for (let i = 0; i < crystalPositions.length; i++) {
    const [fx, fy, fz, isGold] = crystalPositions[i];
    const cGroup = new THREE.Group();
    cGroup.position.set(fx, fy, fz);

    const coreCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      isGold ? goldTrimMat : cyanGlowMat
    );
    coreCrystal.scale.set(1, 1.6, 1);
    cGroup.add(coreCrystal);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.04, 6, 16),
      darkStoneMat
    );
    ring.rotation.x = Math.PI / 3;
    cGroup.add(ring);

    scene.add(cGroup);
    floatingCrystals.push({
      group: cGroup,
      baseY: fy,
      speed: 1.1 + i * 0.2,
      phase: i * 1.3,
    });
  }

  return {
    portalRingOuter,
    portalRingInner,
    portalVortex,
    neuralPulseSpheres,
    clusterPointsGroup,
    decisionPlane,
    dlCrownPrism,
    dlLayerSlabs,
    floatingCrystals,
    interactables,
  };
}
