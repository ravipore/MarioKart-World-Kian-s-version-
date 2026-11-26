import * as THREE from 'three';
import { WorldTextures } from './textures';
import {
  BATTLE_ARENA_RADIUS,
  BATTLE_BOOST_PADS,
  BATTLE_ITEM_SPOTS,
  BATTLE_PILLARS,
  BoostPadSpec,
  createTrackMath,
  CURB_WIDTH,
  ROAD_HALF_WIDTH,
  TRACK_SAMPLES,
  TrackSample,
} from './trackMath';
import { CourseId, getCourseSpec } from './types';

export { CURB_WIDTH, ROAD_HALF_WIDTH, TRACK_SAMPLES };
export type { TrackSample };

export interface ItemBoxNode {
  id: number;
  t: number;
  lateral: number;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  innerMesh: THREE.Mesh;
  respawnTimer: number;
}

export type BoostPadNode = BoostPadSpec;

export interface TrackData {
  rootGroup: THREE.Group;
  courseId: CourseId;
  isBattle: boolean;
  isStraight: boolean;
  skyHex: number;
  fogHex: number;
  curve: THREE.CatmullRomCurve3;
  totalLength: number;
  samples: TrackSample[];
  itemBoxes: ItemBoxNode[];
  boostPads: BoostPadNode[];
  minimapPath: Array<{ x: number; z: number }>;
  minimapBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  sampleAt: (t: number, outPos: THREE.Vector3, outTan: THREE.Vector3, outRight: THREE.Vector3) => void;
  closestPoint: (
    x: number,
    z: number,
    hintT?: number,
  ) => { t: number; distSq: number; lateral: number; point: THREE.Vector3; tangent: THREE.Vector3; right: THREE.Vector3 };
}

export function disposeTrackData(scene: THREE.Scene, track: TrackData): void {
  scene.remove(track.rootGroup);
  track.rootGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    }
  });
}

function createBattleArenaData(scene: THREE.Scene, textures: WorldTextures, courseId: CourseId): TrackData {
  const math = createTrackMath(courseId);
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // Circular / Octagonal Battle Stadium Floor
  const floorGeo = new THREE.CircleGeometry(BATTLE_ARENA_RADIUS, 48);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    color: 0x334155,
    roughness: 0.78,
    metalness: 0.1,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  rootGroup.add(floorMesh);

  // Center emblem ring
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xbe123c,
    emissiveIntensity: 0.25,
    roughness: 0.4,
  });
  const centerRing = new THREE.Mesh(new THREE.RingGeometry(11, 13.5, 40), ringMat);
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.y = 0.03;
  rootGroup.add(centerRing);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(BATTLE_ARENA_RADIUS - 2.6, BATTLE_ARENA_RADIUS, 48),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 }),
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.03;
  rootGroup.add(outerRing);

  // Perimeter Stadium Wall & Bollards
  const wallMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(BATTLE_ARENA_RADIUS + 1.8, BATTLE_ARENA_RADIUS + 2.2, 3.2, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.25,
      side: THREE.DoubleSide,
    }),
  );
  wallMesh.position.y = 1.6;
  rootGroup.add(wallMesh);

  const bollardGeo = new THREE.CylinderGeometry(0.45, 0.52, 2.0, 8);
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const bollards = new THREE.InstancedMesh(bollardGeo, bollardMat, 48);
  const dummy = new THREE.Object3D();
  const bColor = new THREE.Color();
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    dummy.position.set(
      Math.cos(a) * (BATTLE_ARENA_RADIUS + 0.6),
      1.0,
      Math.sin(a) * (BATTLE_ARENA_RADIUS + 0.6),
    );
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    bollards.setMatrixAt(i, dummy.matrix);
    bColor.setHex(i % 2 === 0 ? 0xf43f5e : 0xfacc15);
    bollards.setColorAt(i, bColor);
  }
  bollards.instanceMatrix.needsUpdate = true;
  if (bollards.instanceColor) bollards.instanceColor.needsUpdate = true;
  rootGroup.add(bollards);

  // Outer Stadium Grass Surround
  const surroundGeo = new THREE.RingGeometry(BATTLE_ARENA_RADIUS + 2, 340, 48);
  surroundGeo.rotateX(-Math.PI / 2);
  const surroundMat = new THREE.MeshStandardMaterial({
    map: textures.grass,
    roughness: 0.92,
  });
  const surroundMesh = new THREE.Mesh(surroundGeo, surroundMat);
  surroundMesh.position.y = -0.15;
  surroundMesh.receiveShadow = true;
  rootGroup.add(surroundMesh);

  // 4 Arena Cover Pillars
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.55,
    metalness: 0.2,
  });
  const pillarCapMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.45,
    roughness: 0.28,
  });
  for (const p of BATTLE_PILLARS) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(p.radius, p.radius + 0.4, 9.5, 16), pillarMat);
    col.position.set(p.x, 4.75, p.z);
    col.castShadow = true;
    col.receiveShadow = true;
    rootGroup.add(col);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(p.radius + 0.15, p.radius + 0.15, 1.1, 16), pillarCapMat);
    band.position.set(p.x, 2.4, p.z);
    rootGroup.add(band);
  }

  // 4 Cross Boost Pads
  const boostGeo = new THREE.PlaneGeometry(5.8, 8.6);
  boostGeo.rotateX(-Math.PI / 2);
  const boostMat = new THREE.MeshStandardMaterial({
    map: textures.boostPad,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.5,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  for (const pad of BATTLE_BOOST_PADS) {
    const padMesh = new THREE.Mesh(boostGeo, boostMat);
    padMesh.position.set(pad.x, 0.05, pad.z);
    padMesh.rotation.y = pad.heading;
    rootGroup.add(padMesh);
  }

  // 12 Battle Item Boxes
  const itemBoxes: ItemBoxNode[] = [];
  const outerBoxGeo = new THREE.BoxGeometry(2.1, 2.1, 2.1);
  const outerBoxMat = new THREE.MeshStandardMaterial({
    map: textures.itemBox,
    roughness: 0.18,
    metalness: 0.25,
    transparent: true,
    opacity: 0.9,
  });
  const innerCoreGeo = new THREE.OctahedronGeometry(0.85, 0);
  const innerCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.6,
  });
  for (const spot of BATTLE_ITEM_SPOTS) {
    const mesh = new THREE.Mesh(outerBoxGeo, outerBoxMat);
    mesh.position.copy(spot.position);
    mesh.castShadow = true;
    const innerMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    mesh.add(innerMesh);
    rootGroup.add(mesh);

    itemBoxes.push({
      id: spot.id,
      t: 0,
      lateral: 0,
      position: spot.position.clone(),
      mesh,
      innerMesh,
      respawnTimer: 0,
    });
  }

  // Circular Minimap Path
  const minimapPath: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    minimapPath.push({
      x: 50 + Math.cos(a) * 42,
      z: 50 + Math.sin(a) * 42,
    });
  }

  const arenaSpan = BATTLE_ARENA_RADIUS + 14;
  return {
    rootGroup,
    courseId,
    isBattle: true,
    isStraight: false,
    skyHex: 0x0f172a,
    fogHex: 0x1e293b,
    curve: math.curve,
    totalLength: math.totalLength,
    samples: math.samples,
    itemBoxes,
    boostPads: [],
    minimapPath,
    minimapBounds: {
      minX: -arenaSpan,
      maxX: arenaSpan,
      minZ: -arenaSpan,
      maxZ: arenaSpan,
    },
    sampleAt: math.sampleAt,
    closestPoint: math.closestPoint,
  };
}

export function createTrackData(
  scene: THREE.Scene,
  textures: WorldTextures,
  courseId: CourseId = 'mario_bros_circuit',
  isBattle = false,
): TrackData {
  if (isBattle) {
    return createBattleArenaData(scene, textures, courseId);
  }

  const courseSpec = getCourseSpec(courseId);
  const math = createTrackMath(courseId);
  const { curve, totalLength, samples, boostPads, itemBoxSpecs, minimapPath, minimapBounds, sampleAt, closestPoint } = math;

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const isStraight = math.isStraight;

  // Build Road Ribbon & Curbs
  const roadSegs = isStraight ? 180 : 450;
  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const curbPositions: number[] = [];
  const curbNormals: number[] = [];
  const curbUvs: number[] = [];
  const curbIndices: number[] = [];

  const uvTileLength = isStraight ? 20 : 22;
  const curbTileLength = 8;

  for (let i = 0; i <= roadSegs; i++) {
    let px = 0;
    let py = 0.2;
    let pz = 0;
    let rxDir = -1;
    let rzDir = 0;
    let distAlong = 0;

    if (isStraight) {
      const spanLen = totalLength * 3;
      const frac = i / roadSegs;
      pz = -totalLength * 1.5 + frac * spanLen;
      distAlong = frac * spanLen;
    } else {
      const t = (i % roadSegs) / roadSegs;
      const s = samples[Math.floor(t * TRACK_SAMPLES) % TRACK_SAMPLES];
      px = s.point.x;
      py = s.point.y;
      pz = s.point.z;
      rxDir = s.right.x;
      rzDir = s.right.z;
      distAlong = (i / roadSegs) * totalLength;
    }

    const lx = px - rxDir * ROAD_HALF_WIDTH;
    const ly = py;
    const lz = pz - rzDir * ROAD_HALF_WIDTH;

    const rx = px + rxDir * ROAD_HALF_WIDTH;
    const ry = py;
    const rz = pz + rzDir * ROAD_HALF_WIDTH;

    roadPositions.push(lx, ly, lz, rx, ry, rz);
    roadNormals.push(0, 1, 0, 0, 1, 0);
    roadUvs.push(0, distAlong / uvTileLength, 1, distAlong / uvTileLength);

    if (i < roadSegs) {
      const base = i * 2;
      roadIndices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }

    const lox = px - rxDir * (ROAD_HALF_WIDTH + CURB_WIDTH);
    const loz = pz - rzDir * (ROAD_HALF_WIDTH + CURB_WIDTH);
    const rox = px + rxDir * (ROAD_HALF_WIDTH + CURB_WIDTH);
    const roz = pz + rzDir * (ROAD_HALF_WIDTH + CURB_WIDTH);

    curbPositions.push(
      lox, ly + 0.03, loz,
      lx, ly + 0.03, lz,
      rx, ry + 0.03, rz,
      rox, ry + 0.03, roz,
    );
    curbNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    const cv = distAlong / curbTileLength;
    curbUvs.push(0, cv, 1, cv, 0, cv, 1, cv);

    if (i < roadSegs) {
      const cb = i * 4;
      curbIndices.push(cb, cb + 4, cb + 1, cb + 1, cb + 4, cb + 5);
      curbIndices.push(cb + 2, cb + 6, cb + 3, cb + 3, cb + 6, cb + 7);
    }
  }

  const isRainbow = courseSpec.theme === 'rainbow';
  const roadColors: number[] = [];
  const rbColor = new THREE.Color();
  if (isRainbow) {
    for (let i = 0; i <= roadSegs; i++) {
      const hue = ((i / roadSegs) * 2.5) % 1;
      rbColor.setHSL(hue, 0.92, 0.58);
      roadColors.push(rbColor.r, rbColor.g, rbColor.b, rbColor.r, rbColor.g, rbColor.b);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  if (isRainbow) {
    roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
  }
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadColor =
    isRainbow || courseSpec.theme === 'valley' || courseSpec.theme === 'city' || courseSpec.theme === 'night'
      ? 0xffffff
      : new THREE.Color(courseSpec.roadTintHex).lerp(new THREE.Color(0xffffff), 0.38);

  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    color: roadColor,
    vertexColors: isRainbow,
    emissive: isRainbow ? new THREE.Color(0x38bdf8) : new THREE.Color(0x000000),
    emissiveIntensity: isRainbow ? 0.25 : 0,
    roughness: isRainbow || courseSpec.theme === 'snow' ? 0.45 : courseSpec.theme === 'stadium' ? 0.94 : 0.8,
    metalness: isRainbow || courseSpec.theme === 'space' ? 0.35 : 0.08,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  rootGroup.add(roadMesh);

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
  curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNormals, 3));
  curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    map: textures.curb,
    roughness: 0.65,
    metalness: 0.05,
  });
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.receiveShadow = true;
  rootGroup.add(curbMesh);

  // Start/Finish Checkered Line & Grand Prix Gantry Arch
  const startT = 0.06;
  const startSample = samples[Math.floor(startT * TRACK_SAMPLES)];
  const finishGroup = new THREE.Group();
  finishGroup.position.copy(startSample.point);
  const startAngle = Math.atan2(startSample.tangent.x, startSample.tangent.z);
  finishGroup.rotation.y = startAngle;

  const stripGeo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, 4.2);
  stripGeo.rotateX(-Math.PI / 2);
  const stripMat = new THREE.MeshStandardMaterial({
    map: textures.checker,
    roughness: 0.5,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const stripMesh = new THREE.Mesh(stripGeo, stripMat);
  stripMesh.position.y = 0.04;
  stripMesh.receiveShadow = true;
  finishGroup.add(stripMesh);

  const pillarGeo = new THREE.CylinderGeometry(0.65, 0.85, 11.5, 12);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 });
  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-(ROAD_HALF_WIDTH + 1.8), 5.75, 0);
  leftPillar.castShadow = true;
  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.set(ROAD_HALF_WIDTH + 1.8, 5.75, 0);
  rightPillar.castShadow = true;

  const archBeamGeo = new THREE.BoxGeometry(ROAD_HALF_WIDTH * 2 + 5.2, 2.8, 1.4);
  const archBeamMat = new THREE.MeshStandardMaterial({
    map: textures.checker,
    roughness: 0.35,
    metalness: 0.2,
  });
  const archBeam = new THREE.Mesh(archBeamGeo, archBeamMat);
  archBeam.position.set(0, 11.0, 0);
  archBeam.castShadow = true;

  const archTrimGeo = new THREE.BoxGeometry(ROAD_HALF_WIDTH * 2 + 5.6, 0.45, 1.6);
  const archTrimMat = new THREE.MeshStandardMaterial({
    color: courseSpec.curbAccentHex,
    roughness: 0.3,
    metalness: 0.4,
  });
  const archTrimTop = new THREE.Mesh(archTrimGeo, archTrimMat);
  archTrimTop.position.set(0, 12.5, 0);
  const archTrimBot = new THREE.Mesh(archTrimGeo, archTrimMat);
  archTrimBot.position.set(0, 9.5, 0);

  finishGroup.add(leftPillar, rightPillar, archBeam, archTrimTop, archTrimBot);
  rootGroup.add(finishGroup);
  if (isStraight) {
    for (const zShift of [-totalLength, totalLength]) {
      const copyArch = finishGroup.clone();
      copyArch.position.z += zShift;
      rootGroup.add(copyArch);
    }
  }

  // Extended Sculpted Terrain
  const terrainGeo = isStraight
    ? new THREE.PlaneGeometry(760, 1320, 60, 90)
    : new THREE.PlaneGeometry(920, 920, 110, 110);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i) + (isStraight ? 0 : 60);
    const vz = tPos.getZ(i) + (isStraight ? 0 : -45);
    tPos.setX(i, vx);
    tPos.setZ(i, vz);

    if (isStraight) {
      const dist = Math.abs(vx);
      if (dist < ROAD_HALF_WIDTH + 6) {
        tPos.setY(i, -0.12);
      } else {
        const bowl = THREE.MathUtils.smoothstep(dist, ROAD_HALF_WIDTH + 6, 95) * 14;
        tPos.setY(i, -0.12 + bowl);
      }
      continue;
    }

    let bestDistSq = Infinity;
    let bestY = 0;
    for (let j = 0; j < TRACK_SAMPLES; j += 4) {
      const sp = samples[j].point;
      const dx = vx - sp.x;
      const dz = vz - sp.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestY = sp.y;
      }
    }
    const dist = Math.sqrt(bestDistSq);
    const hillNoise =
      Math.sin(vx * 0.022) * Math.cos(vz * 0.024) * 9.5 +
      Math.sin(vx * 0.055 + 1.2) * Math.sin(vz * 0.048) * 3.8;

    if (dist < ROAD_HALF_WIDTH + 5) {
      tPos.setY(i, bestY - 0.32);
    } else {
      const blend = THREE.MathUtils.smoothstep(dist, ROAD_HALF_WIDTH + 5, ROAD_HALF_WIDTH + 34);
      const outerHeight = Math.max(-1.5, hillNoise + 1.2);
      tPos.setY(i, THREE.MathUtils.lerp(bestY - 0.32, outerHeight, blend));
    }
  }
  if (!isRainbow) {
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: textures.grass,
      color: new THREE.Color(courseSpec.grassHex),
      roughness: courseSpec.theme === 'space' ? 0.55 : 0.92,
      metalness: courseSpec.theme === 'space' ? 0.25 : 0.0,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);
  } else {
    terrainGeo.dispose();
  }

  // Shimmering Water or Molten Lava Plane
  if (
    courseSpec.theme === 'beach' ||
    courseSpec.theme === 'oasis' ||
    courseSpec.theme === 'shipyard' ||
    courseSpec.theme === 'lava'
  ) {
    const isLava = courseSpec.theme === 'lava';
    const waterGeo = new THREE.PlaneGeometry(920, 920);
    waterGeo.rotateX(-Math.PI / 2);
    const waterHex = isLava
      ? 0xea580c
      : courseSpec.theme === 'beach'
        ? 0x06b6d4
        : courseSpec.theme === 'oasis'
          ? 0x0ea5e9
          : 0x0f766e;
    const waterMat = new THREE.MeshStandardMaterial({
      color: waterHex,
      emissive: isLava ? 0xdc2626 : waterHex,
      emissiveIntensity: isLava ? 0.72 : 0.14,
      roughness: isLava ? 0.35 : 0.15,
      metalness: isLava ? 0.1 : 0.35,
      transparent: !isLava,
      opacity: isLava ? 1 : 0.78,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(60, -0.65, -45);
    rootGroup.add(waterMesh);
  }

  // Guardrail Bollards
  const bollardCount = isStraight ? 90 : 150;
  const bollardGeo = new THREE.CylinderGeometry(0.28, 0.34, 1.35, 8);
  const bollardMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
    metalness: 0.35,
  });
  const bollards = new THREE.InstancedMesh(bollardGeo, bollardMat, bollardCount * 2);
  bollards.castShadow = true;
  const dummy = new THREE.Object3D();
  const bColor = new THREE.Color();
  for (let i = 0; i < bollardCount; i++) {
    const offset = ROAD_HALF_WIDTH + CURB_WIDTH + 0.65;
    if (isStraight) {
      const zPos = -totalLength * 1.5 + (i / bollardCount) * (totalLength * 3);
      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? -1 : 1;
        dummy.position.set(offset * sign, 0.85, zPos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const idx = i * 2 + side;
        bollards.setMatrixAt(idx, dummy.matrix);
        bColor.setHex(i % 2 === 0 ? courseSpec.curbAccentHex : 0xf8fafc);
        bollards.setColorAt(idx, bColor);
      }
      continue;
    }

    const s = samples[Math.floor((i / bollardCount) * TRACK_SAMPLES)];
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      dummy.position.set(
        s.point.x + s.right.x * offset * sign,
        s.point.y + 0.65,
        s.point.z + s.right.z * offset * sign,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      const idx = i * 2 + side;
      bollards.setMatrixAt(idx, dummy.matrix);
      bColor.setHex(i % 2 === 0 ? courseSpec.curbAccentHex : 0xf8fafc);
      bollards.setColorAt(idx, bColor);
    }
  }
  bollards.instanceMatrix.needsUpdate = true;
  if (bollards.instanceColor) bollards.instanceColor.needsUpdate = true;
  bollards.computeBoundingSphere();
  rootGroup.add(bollards);

  if (isStraight) {
    // Seamless Straight Bung Stadium Grandstands & Floodlight Towers
    const bayStep = 45;
    const bayCount = Math.round((totalLength * 3) / bayStep);
    const standGeo = new THREE.BoxGeometry(8.5, 9.5, 38);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.25,
    });
    const tierGeo = new THREE.BoxGeometry(5.5, 4.5, 38);
    const tierMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x78350f,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.3,
    });
    const poleGeo = new THREE.CylinderGeometry(0.45, 0.65, 22, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.25 });
    const lightGeo = new THREE.BoxGeometry(2.2, 2.6, 7.5);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 0.95,
      roughness: 0.15,
    });

    const stands = new THREE.InstancedMesh(standGeo, standMat, bayCount * 2);
    const tiers = new THREE.InstancedMesh(tierGeo, tierMat, bayCount * 2);
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, bayCount * 2);
    const lights = new THREE.InstancedMesh(lightGeo, lightMat, bayCount * 2);

    for (let b = 0; b < bayCount; b++) {
      const zCenter = -totalLength * 1.5 + (b + 0.5) * bayStep;
      for (let side = 0; side < 2; side++) {
        const sign = side === 0 ? -1 : 1;
        const idx = b * 2 + side;

        dummy.position.set(sign * 27, 4.75, zCenter);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stands.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(sign * 21.5, 2.25, zCenter);
        dummy.updateMatrix();
        tiers.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(sign * 32, 11, zCenter);
        dummy.updateMatrix();
        poles.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(sign * 30.5, 22, zCenter);
        dummy.rotation.set(0, 0, sign * 0.28);
        dummy.updateMatrix();
        lights.setMatrixAt(idx, dummy.matrix);
      }
    }
    stands.instanceMatrix.needsUpdate = true;
    tiers.instanceMatrix.needsUpdate = true;
    poles.instanceMatrix.needsUpdate = true;
    lights.instanceMatrix.needsUpdate = true;
    rootGroup.add(stands, tiers, poles, lights);
  }

  // Theme-Specific Trackside Landmarks & Foliage
  const theme = courseSpec.theme;
  const propCount = 110;
  const isUrbanOrTech =
    theme === 'city' ||
    theme === 'space' ||
    theme === 'stadium' ||
    theme === 'stadium_royal' ||
    theme === 'fortress' ||
    theme === 'bazaar' ||
    theme === 'cinema' ||
    theme === 'factory' ||
    theme === 'airport' ||
    theme === 'ruins' ||
    theme === 'lava';
  const isSundae = theme === 'sundae';
  const isPalm = theme === 'beach' || theme === 'oasis' || theme === 'desert' || theme === 'jungle';

  const trunkGeo = isRainbow
    ? new THREE.OctahedronGeometry(2.6, 0)
    : isUrbanOrTech
      ? new THREE.BoxGeometry(3.2, 14, 3.2)
      : isSundae
        ? new THREE.ConeGeometry(2.4, 7.5, 10)
        : isPalm
          ? new THREE.CylinderGeometry(0.32, 0.55, 6.2, 7)
          : new THREE.CylinderGeometry(0.45, 0.72, 4.6, 7);

  if (isSundae) {
    trunkGeo.rotateX(Math.PI);
  }

  const trunkMat = new THREE.MeshStandardMaterial({
    color: isRainbow
      ? 0x38bdf8
      : isUrbanOrTech
        ? theme === 'space' || theme === 'cinema'
          ? 0x1e293b
          : theme === 'fortress' || theme === 'lava'
            ? 0x27272a
            : theme === 'bazaar' || theme === 'factory'
              ? 0x92400e
              : theme === 'ruins'
                ? 0x78716c
                : 0x334155
        : isSundae
          ? 0xf59e0b
          : 0x784824,
    emissive: isRainbow ? new THREE.Color(0x6366f1) : new THREE.Color(0x000000),
    emissiveIntensity: isRainbow ? 0.5 : 0,
    roughness: isUrbanOrTech || isRainbow ? 0.4 : 0.88,
    metalness: isUrbanOrTech || isRainbow ? 0.35 : 0.05,
  });

  const canopyGeo = isRainbow
    ? new THREE.OctahedronGeometry(2.2, 0)
    : theme === 'ruins'
      ? new THREE.BoxGeometry(3.8, 3.8, 3.8)
      : isUrbanOrTech
        ? new THREE.BoxGeometry(2.4, 2.2, 2.4)
        : isSundae
          ? new THREE.SphereGeometry(2.5, 12, 10)
          : isPalm
            ? new THREE.ConeGeometry(3.6, 2.2, 7)
            : new THREE.ConeGeometry(2.8, 6.2, 7);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive:
      isUrbanOrTech || isRainbow
        ? new THREE.Color(courseSpec.accentHex)
        : new THREE.Color(0x000000),
    emissiveIntensity: isUrbanOrTech || isRainbow ? 0.58 : 0,
    roughness: isUrbanOrTech || isRainbow ? 0.25 : 0.76,
  });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, propCount);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, propCount);
  trunks.castShadow = true;
  canopies.castShadow = true;

  const placedTrees: Array<{ x: number; z: number; y: number }> = [];
  let attempts = 0;
  while (placedTrees.length < propCount && attempts < 2200) {
    attempts++;
    const seed = attempts * 13.37;
    const rx = (Math.sin(seed * 1.7) * 0.5 + 0.5) * 680 - 280;
    const rz = (Math.cos(seed * 2.3) * 0.5 + 0.5) * 680 - 385;

    let minDistSq = Infinity;
    if (isStraight) {
      minDistSq = rx * rx;
    } else {
      for (let j = 0; j < TRACK_SAMPLES; j += 6) {
        const sp = samples[j].point;
        const d2 = (rx - sp.x) ** 2 + (rz - sp.z) ** 2;
        if (d2 < minDistSq) minDistSq = d2;
      }
    }
    const minClearance = isStraight ? 44 : ROAD_HALF_WIDTH + 15;
    if (minDistSq > minClearance ** 2) {
      const hillY = isRainbow
        ? Math.sin(rx * 0.03) * 8.0 + 4.0
        : isStraight
          ? THREE.MathUtils.smoothstep(Math.abs(rx), ROAD_HALF_WIDTH + 6, 95) * 14
          : Math.sin(rx * 0.022) * Math.cos(rz * 0.024) * 9.5 +
            Math.sin(rx * 0.055 + 1.2) * Math.sin(rz * 0.048) * 3.8 +
            1.2;
      placedTrees.push({ x: rx, z: rz, y: isRainbow ? hillY : Math.max(-1.0, hillY) });
    }
  }

  for (let i = 0; i < placedTrees.length; i++) {
    const pt = placedTrees[i];
    const sc = 0.82 + ((i * 37) % 100) * 0.005;
    const baseHeight = isRainbow ? 4.0 : isUrbanOrTech ? 7.0 : isSundae ? 3.8 : isPalm ? 3.0 : 2.1;
    const topHeight = isRainbow ? 10.5 : isUrbanOrTech ? 14.8 : isSundae ? 8.2 : isPalm ? 6.2 : 6.4;

    dummy.position.set(pt.x, pt.y + baseHeight * sc, pt.z);
    dummy.rotation.set(0, (i * 1.1) % (Math.PI * 2), 0);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(pt.x, pt.y + topHeight * sc, pt.z);
    dummy.scale.set(sc * 1.05, sc, sc * 1.05);
    dummy.updateMatrix();
    canopies.setMatrixAt(i, dummy.matrix);

    if (isRainbow) {
      bColor.setHSL((i * 0.14) % 1, 0.9, 0.62);
    } else if (isSundae) {
      const sundaePalette = [0xf472b6, 0x67e8f9, 0xfef08a, 0xc084fc, 0x86efac];
      bColor.setHex(sundaePalette[i % sundaePalette.length]);
    } else if (isUrbanOrTech) {
      const techPalette =
        theme === 'city'
          ? [0xfacc15, 0x38bdf8, 0xf472b6]
          : theme === 'space'
            ? [0x22d3ee, 0x818cf8, 0xfacc15]
            : theme === 'bazaar'
              ? [0xf43f5e, 0xfacc15, 0xa855f7]
              : theme === 'fortress' || theme === 'lava'
                ? [0xef4444, 0xf97316, 0xfacc15]
                : theme === 'cinema'
                  ? [0xc084fc, 0xf472b6, 0x38bdf8]
                  : theme === 'stadium_royal'
                    ? [0xf472b6, 0xfacc15, 0xf8fafc]
                    : theme === 'ruins'
                      ? [0xfacc15, 0xf59e0b, 0x4ade80]
                      : [0xfacc15, 0xf97316, 0x38bdf8];
      bColor.setHex(techPalette[i % techPalette.length]);
    } else {
      const sat = theme === 'snow' ? 0.35 : 0.6;
      const light = theme === 'snow' ? 0.62 : theme === 'night' ? 0.3 : 0.38;
      bColor.setHSL(courseSpec.treeHue + ((i % 7) - 3) * 0.015, sat, light + (i % 4) * 0.035);
    }
    canopies.setColorAt(i, bColor);
  }
  trunks.count = placedTrees.length;
  canopies.count = placedTrees.length;
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  rootGroup.add(trunks, canopies);

  // Secondary Landmarks (Boulders, Ice Crystals, Ship Hulls, Desert Mesas)
  const rockCount = 65;
  const rockGeo =
    theme === 'snow' || theme === 'night' || theme === 'space' || isRainbow
      ? new THREE.OctahedronGeometry(3.4, 0)
      : theme === 'shipyard' || theme === 'factory' || theme === 'ruins'
        ? new THREE.BoxGeometry(5.5, 4.2, 2.8)
        : new THREE.DodecahedronGeometry(3.2, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: isRainbow ? new THREE.Color(0x818cf8) : new THREE.Color(0x000000),
    emissiveIntensity: isRainbow ? 0.45 : 0,
    roughness: theme === 'snow' || theme === 'night' || isRainbow ? 0.3 : 0.9,
    metalness: theme === 'space' || theme === 'fortress' || isRainbow ? 0.35 : 0.05,
  });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rocks.castShadow = true;
  rocks.receiveShadow = true;

  let placedRocks = 0;
  let rAttempts = 0;
  while (placedRocks < rockCount && rAttempts < 1500) {
    rAttempts++;
    const seed = rAttempts * 29.71;
    const rx = (Math.sin(seed * 3.1) * 0.5 + 0.5) * 660 - 270;
    const rz = (Math.cos(seed * 1.9) * 0.5 + 0.5) * 660 - 375;

    let minDistSq = Infinity;
    if (isStraight) {
      minDistSq = rx * rx;
    } else {
      for (let j = 0; j < TRACK_SAMPLES; j += 8) {
        const sp = samples[j].point;
        const d2 = (rx - sp.x) ** 2 + (rz - sp.z) ** 2;
        if (d2 < minDistSq) minDistSq = d2;
      }
    }
    const minRockClearance = isStraight ? 46 : ROAD_HALF_WIDTH + 16;
    if (minDistSq > minRockClearance ** 2) {
      const hillY = isStraight
        ? THREE.MathUtils.smoothstep(Math.abs(rx), ROAD_HALF_WIDTH + 6, 95) * 14
        : Math.sin(rx * 0.022) * Math.cos(rz * 0.024) * 9.5 +
          Math.sin(rx * 0.055 + 1.2) * Math.sin(rz * 0.048) * 3.8 +
          1.0;
      const sc = 0.8 + (placedRocks % 6) * 0.35;
      dummy.position.set(rx, Math.max(-1.0, hillY) + sc * 1.2, rz);
      dummy.rotation.set(placedRocks * 0.4, placedRocks * 0.9, 0);
      dummy.scale.set(sc * 1.3, sc * 0.9, sc);
      dummy.updateMatrix();
      rocks.setMatrixAt(placedRocks, dummy.matrix);
      bColor.setHSL(courseSpec.rockHue, 0.36, 0.44 + (placedRocks % 5) * 0.04);
      rocks.setColorAt(placedRocks, bColor);
      placedRocks++;
    }
  }
  rocks.count = placedRocks;
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.computeBoundingSphere();
  rootGroup.add(rocks);

  // Boost Pads
  const boostGeo = new THREE.PlaneGeometry(5.6, 8.2);
  boostGeo.rotateX(-Math.PI / 2);
  const boostMat = new THREE.MeshStandardMaterial({
    map: textures.boostPad,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  boostPads.forEach((pad) => {
    const s = samples[Math.floor(pad.t * TRACK_SAMPLES)];
    const padMesh = new THREE.Mesh(boostGeo, boostMat);
    padMesh.position.copy(pad.position);
    padMesh.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
    rootGroup.add(padMesh);
    if (isStraight) {
      for (const zShift of [-totalLength, totalLength]) {
        const padCopy = padMesh.clone();
        padCopy.position.z += zShift;
        rootGroup.add(padCopy);
      }
    }
  });

  // 16 Rotating Item Boxes
  const itemBoxes: ItemBoxNode[] = [];
  const outerBoxGeo = new THREE.BoxGeometry(2.1, 2.1, 2.1);
  const outerBoxMat = new THREE.MeshStandardMaterial({
    map: textures.itemBox,
    roughness: 0.18,
    metalness: 0.25,
    transparent: true,
    opacity: 0.88,
  });
  const innerCoreGeo = new THREE.OctahedronGeometry(0.85, 0);
  const innerCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.6,
  });

  for (const spec of itemBoxSpecs) {
    const mesh = new THREE.Mesh(outerBoxGeo, outerBoxMat);
    mesh.position.copy(spec.position);
    mesh.castShadow = true;
    const innerMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    mesh.add(innerMesh);
    rootGroup.add(mesh);

    itemBoxes.push({
      id: spec.id,
      t: spec.t,
      lateral: spec.lateral,
      position: spec.position.clone(),
      mesh,
      innerMesh,
      respawnTimer: 0,
    });
  }

  return {
    rootGroup,
    courseId,
    isBattle: false,
    isStraight,
    skyHex: courseSpec.skyHex,
    fogHex: courseSpec.fogHex,
    curve,
    totalLength,
    samples,
    itemBoxes,
    boostPads,
    minimapPath,
    minimapBounds,
    sampleAt,
    closestPoint,
  };
}
