import * as THREE from 'three';
import { CarId, CharacterId, getCarSpec, getCharacterSpec, RacerProfile } from './types';
import { WorldTextures } from './textures';

export interface KartRig {
  root: THREE.Group;
  kartBodyGroup: THREE.Group;
  bulletGroup: THREE.Group;
  starAuraGroup: THREE.Group;
  wheels: THREE.Mesh[];
  frontSteerPivots: THREE.Group[];
  flameL: THREE.Mesh;
  flameR: THREE.Mesh;
  bulletFlame: THREE.Mesh;
  paintMaterials: THREE.MeshStandardMaterial[];
  baseColors: THREE.Color[];
  balloonGroup: THREE.Group;
  balloons: THREE.Mesh[];
}

function createKartHullGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.85, -1.65);
  shape.lineTo(0.85, -1.65);
  shape.lineTo(1.02, -0.45);
  shape.lineTo(0.95, 0.75);
  shape.lineTo(0.55, 1.75);
  shape.lineTo(-0.55, 1.75);
  shape.lineTo(-0.95, 0.75);
  shape.lineTo(-1.02, -0.45);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 3,
  });
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

const sharedHullGeo = createKartHullGeometry();

function buildBingBongDinoDriver(emblemTex: THREE.Texture): THREE.Group {
  const dino = new THREE.Group();

  const greenSkin = new THREE.MeshStandardMaterial({
    color: 0x5cc426,
    roughness: 0.58,
    metalness: 0.04,
  });
  const spotGreen = new THREE.MeshStandardMaterial({
    color: 0x2f7d12,
    roughness: 0.65,
    metalness: 0.02,
  });
  const creamBelly = new THREE.MeshStandardMaterial({
    color: 0xf6f0a8,
    roughness: 0.68,
    metalness: 0.02,
  });
  const redButtonMat = new THREE.MeshStandardMaterial({
    color: 0xe11d24,
    roughness: 0.2,
    metalness: 0.18,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x093118, roughness: 0.1 });

  // Torso
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 16), greenSkin);
  torso.scale.set(0.92, 0.98, 1.18);
  torso.position.set(0, 0.88, -0.1);
  torso.castShadow = true;
  dino.add(torso);

  // Cream Belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), creamBelly);
  belly.scale.set(0.84, 0.92, 0.72);
  belly.position.set(0, 0.86, 0.24);
  dino.add(belly);

  // Signature Red Disc Button on Back
  const redDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.1, 20), redButtonMat);
  redDisc.position.set(0, 1.32, -0.22);
  redDisc.rotation.x = -0.3;
  redDisc.castShadow = true;
  dino.add(redDisc);

  // Dark Green Spots on Back/Flanks
  const spotGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const spotCoords: Array<[number, number, number, number]> = [
    [-0.32, 1.02, -0.35, 1.1],
    [0.32, 1.0, -0.32, 1.0],
    [-0.36, 0.85, -0.05, 0.85],
    [0.36, 0.85, -0.05, 0.85],
    [0, 1.05, -0.58, 0.9],
  ];
  spotCoords.forEach(([sx, sy, sz, sc]) => {
    const sp = new THREE.Mesh(spotGeo, spotGreen);
    sp.position.set(sx, sy, sz);
    sp.scale.set(sc, sc * 0.65, sc);
    dino.add(sp);
  });

  // Curved Tail sticking out behind
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.88, 12), greenSkin);
  tail.position.set(0, 0.94, -0.78);
  tail.rotation.x = -Math.PI * 0.36;
  tail.castShadow = true;
  dino.add(tail);

  // Curved Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.32, 0.68, 14), greenSkin);
  neck.position.set(0, 1.36, 0.16);
  neck.rotation.x = 0.22;
  neck.castShadow = true;
  dino.add(neck);

  // Neck Cream Strip
  const neckFront = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.62, 12), creamBelly);
  neckFront.position.set(0, 1.34, 0.24);
  neckFront.rotation.x = 0.22;
  dino.add(neckFront);

  // Head Dome & Friendly Snout
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 18, 16), greenSkin);
  head.position.set(0, 1.78, 0.28);
  head.castShadow = true;
  dino.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), greenSkin);
  snout.scale.set(1.08, 0.82, 1.25);
  snout.position.set(0, 1.69, 0.54);
  snout.castShadow = true;
  dino.add(snout);

  // Expressive Eyes with White Catchlights
  for (const side of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 12), eyeWhite);
    sclera.position.set(side * 0.19, 1.84, 0.54);
    dino.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 12), eyeDark);
    pupil.position.set(side * 0.2, 1.84, 0.59);
    dino.add(pupil);

    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), eyeWhite);
    catchlight.position.set(side * 0.17, 1.88, 0.65);
    dino.add(catchlight);
  }

  // Cute Little Front Arms gripping steering wheel
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 10), greenSkin);
    arm.position.set(side * 0.36, 0.98, 0.42);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = side * -0.25;
    dino.add(arm);
  }

  // Rear Team Emblem Banner featuring the exact attached PNG artwork
  const bannerPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }),
  );
  bannerPole.position.set(0.68, 1.15, -1.25);
  dino.add(bannerPole);

  const emblemGeo = new THREE.PlaneGeometry(0.68, 0.68);
  const emblemMat = new THREE.MeshStandardMaterial({
    map: emblemTex,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const emblemFlag = new THREE.Mesh(emblemGeo, emblemMat);
  emblemFlag.position.set(0.68, 1.46, -1.25);
  emblemFlag.rotation.y = Math.PI * 0.08;
  dino.add(emblemFlag);

  return dino;
}

interface HumanDriverPalette {
  suit: number;
  accent: number;
  visor: number;
  skinTone: number;
  hairColor: number;
}

function buildWaluigiDriver(): THREE.Group {
  const driver = new THREE.Group();

  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.48, metalness: 0.08 });
  const overallMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.62, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4cfb4, roughness: 0.56 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xe8798a, roughness: 0.5 });
  const mustacheMat = new THREE.MeshStandardMaterial({ color: 0x261710, roughness: 0.65 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.2 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });

  // Tall, lanky torso in dark overalls + purple sleeves
  const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.46), overallMat);
  overalls.position.set(0, 0.96, -0.06);
  overalls.castShadow = true;
  driver.add(overalls);

  const upperShirt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.34, 0.44), purpleMat);
  upperShirt.position.set(0, 1.18, -0.08);
  driver.add(upperShirt);

  // Overall Straps & Yellow Buttons
  for (const s of [-0.2, 0.2]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.48), overallMat);
    strap.position.set(s, 1.19, -0.06);
    driver.add(strap);

    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), goldMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(s, 1.08, 0.19);
    driver.add(btn);
  }

  // Slender Arms & White Gloves gripping the wheel
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.42, 6, 8), purpleMat);
    arm.position.set(s * 0.42, 1.1, 0.26);
    arm.rotation.x = Math.PI * 0.38;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), gloveMat);
    glove.position.set(s * 0.28, 1.06, 0.56);
    driver.add(glove);
  }

  // Neck & Elongated Human Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.24, 10), skinMat);
  neck.position.set(0, 1.42, 0);
  driver.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  head.scale.set(0.88, 1.18, 0.96);
  head.position.set(0, 1.69, 0.06);
  head.castShadow = true;
  driver.add(head);

  // Pointed Ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), skinMat);
    ear.position.set(s * 0.31, 1.69, 0.03);
    ear.rotation.z = -s * Math.PI * 0.45;
    driver.add(ear);
  }

  // Prominent Pink Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), noseMat);
  nose.scale.set(0.85, 0.95, 1.55);
  nose.position.set(0, 1.66, 0.4);
  driver.add(nose);

  // Crooked Signature Mustache
  for (const s of [-1, 1]) {
    const stacheInner = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.065, 0.08), mustacheMat);
    stacheInner.position.set(s * 0.13, 1.56, 0.34);
    stacheInner.rotation.z = s * -0.22;
    driver.add(stacheInner);

    const stacheTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 6), mustacheMat);
    stacheTip.position.set(s * 0.27, 1.58, 0.33);
    stacheTip.rotation.z = s * -0.82;
    driver.add(stacheTip);
  }

  // Eyes & Mischievous Angled Brows
  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), eyeWhite);
    sclera.scale.set(0.85, 1.2, 0.65);
    sclera.position.set(s * 0.12, 1.78, 0.31);
    driver.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeDark);
    pupil.position.set(s * 0.12, 1.78, 0.35);
    driver.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), mustacheMat);
    brow.position.set(s * 0.12, 1.87, 0.33);
    brow.rotation.z = s * -0.3;
    driver.add(brow);
  }

  // Tall Purple Cap & Brim
  const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), purpleMat);
  capCrown.scale.set(0.96, 1.08, 1.02);
  capCrown.position.set(0, 1.86, 0.04);
  capCrown.castShadow = true;
  driver.add(capCrown);

  const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.06, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.9), purpleMat);
  capBrim.position.set(0, 1.87, 0.22);
  capBrim.rotation.x = 0.15;
  driver.add(capBrim);

  // Yellow Emblem Circle + Inverted-L Badge
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), goldMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 2.02, 0.34);
  driver.add(badge);

  const gammaVert = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.03), overallMat);
  gammaVert.position.set(-0.025, 2.015, 0.36);
  const gammaTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.03), overallMat);
  gammaTop.position.set(0.005, 2.06, 0.36);
  driver.add(gammaVert, gammaTop);

  return driver;
}

function buildMarioBrosStyleDriver(variant: 'mario' | 'luigi' | 'wario'): THREE.Group {
  const driver = new THREE.Group();

  const isMario = variant === 'mario';
  const isLuigi = variant === 'luigi';
  const isWario = variant === 'wario';

  const shirtColor = isMario ? 0xef4444 : isLuigi ? 0x16a34a : 0xeab308;
  const overallColor = isWario ? 0x6b21a8 : 0x1d4ed8;
  const hairColor = isWario ? 0x1c1917 : 0x3b2113;

  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.48, metalness: 0.08 });
  const overallMat = new THREE.MeshStandardMaterial({ color: overallColor, roughness: 0.56, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4cfb4, roughness: 0.56 });
  const noseMat = new THREE.MeshStandardMaterial({
    color: isWario ? 0xe8798a : 0xf1b596,
    roughness: 0.5,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.68 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.25 });
  const badgeBgMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const emblemMat = new THREE.MeshStandardMaterial({
    color: isMario ? 0xdc2626 : isLuigi ? 0x15803d : 0x1d4ed8,
    roughness: 0.3,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15 });

  const widthScale = isWario ? 1.18 : isLuigi ? 0.94 : 1.02;
  const heightScale = isLuigi ? 1.1 : isWario ? 0.96 : 1.0;

  // Torso overalls + shirt
  const overalls = new THREE.Mesh(
    new THREE.BoxGeometry(0.76 * widthScale, 0.68 * heightScale, 0.48 * widthScale),
    overallMat,
  );
  overalls.position.set(0, 0.93, -0.06);
  overalls.castShadow = true;
  driver.add(overalls);

  const upperShirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.82 * widthScale, 0.32, 0.44 * widthScale),
    shirtMat,
  );
  upperShirt.position.set(0, 1.14 * heightScale, -0.08);
  driver.add(upperShirt);

  for (const s of [-0.22 * widthScale, 0.22 * widthScale]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.48 * widthScale), overallMat);
    strap.position.set(s, 1.15 * heightScale, -0.06);
    driver.add(strap);

    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 10), goldMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(s, 1.05, 0.19 * widthScale);
    driver.add(btn);
  }

  // Arms & White Gloves
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11 * widthScale, 0.36, 6, 8), shirtMat);
    arm.position.set(s * 0.44 * widthScale, 1.04, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), gloveMat);
    glove.position.set(s * 0.29, 1.04, 0.56);
    driver.add(glove);
  }

  // Head
  const headY = isLuigi ? 1.69 : 1.62;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 14), skinMat);
  head.scale.set(isWario ? 1.1 : 0.98, isLuigi ? 1.12 : 0.96, 1.0);
  head.position.set(0, headY, 0.08);
  head.castShadow = true;
  driver.add(head);

  // Sideburns / Hair Back
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 10), hairMat);
  hairBack.position.set(0, headY + 0.01, -0.03);
  driver.add(hairBack);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
    ear.scale.set(0.55, 1, 0.8);
    ear.position.set(s * (isWario ? 0.36 : 0.32), headY, 0.06);
    driver.add(ear);
  }

  // Big Signature Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(isWario ? 0.13 : 0.105, 12, 10), noseMat);
  nose.scale.set(1.15, 0.95, 1.25);
  nose.position.set(0, headY - 0.03, 0.41);
  driver.add(nose);

  // Signature Mustache
  if (isWario) {
    for (const s of [-1, 1]) {
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), hairMat);
      inner.position.set(s * 0.14, headY - 0.12, 0.35);
      inner.rotation.z = s * -0.25;
      driver.add(inner);

      const zig = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), hairMat);
      zig.position.set(s * 0.3, headY - 0.07, 0.34);
      zig.rotation.z = s * -0.95;
      driver.add(zig);
    }
  } else {
    for (let i = -2; i <= 2; i++) {
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 8), hairMat);
      tuft.position.set(i * 0.082, headY - 0.12 - Math.abs(i) * (isLuigi ? 0.01 : 0.015), 0.36 - Math.abs(i) * 0.025);
      driver.add(tuft);
    }
  }

  // Expressive Eyes
  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), eyeWhite);
    sclera.scale.set(0.85, 1.15, 0.65);
    sclera.position.set(s * 0.12, headY + 0.07, 0.34);
    driver.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), eyeBlue);
    iris.position.set(s * 0.12, headY + 0.07, 0.38);
    driver.add(iris);
  }

  // Signature Cap + Visor Brim + Letter Emblem
  const capCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.36 * (isWario ? 1.08 : 1), 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    shirtMat,
  );
  capCrown.scale.set(1.0, isLuigi ? 1.15 : 0.96, 1.05);
  capCrown.position.set(0, headY + 0.13, 0.07);
  capCrown.castShadow = true;
  driver.add(capCrown);

  const capBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.36, 0.06, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
    shirtMat,
  );
  capBrim.position.set(0, headY + 0.14, 0.25);
  capBrim.rotation.x = 0.14;
  driver.add(capBrim);

  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), badgeBgMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, headY + 0.3, 0.37);
  driver.add(badge);

  if (isLuigi) {
    const lVert = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.03), emblemMat);
    lVert.position.set(-0.025, headY + 0.3, 0.39);
    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.036, 0.03), emblemMat);
    lFoot.position.set(0.005, headY + 0.255, 0.39);
    driver.add(lVert, lFoot);
  } else {
    // M or W crown bar emblem
    const sign = isWario ? -1 : 1;
    for (const sx of [-0.055, 0.055]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.11, 0.03), emblemMat);
      leg.position.set(sx, headY + 0.3, 0.39);
      driver.add(leg);
    }
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.03), emblemMat);
    mid.position.set(0, headY + 0.3 + sign * 0.02, 0.39);
    driver.add(mid);
  }

  return driver;
}

function buildBlackPantherDriver(): THREE.Group {
  const driver = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.36, metalness: 0.35 });
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.28, metalness: 0.55 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
  const vibraniumMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.55,
    roughness: 0.25,
  });
  const eyeGlow = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Sleek Vibranium Torso + Armor Chestplate
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 0.46), suitMat);
  torso.position.set(0, 0.94, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.42, 0.5), armorMat);
  chestPlate.position.set(0, 1.06, -0.04);
  driver.add(chestPlate);

  // Signature Silver Claw Necklace around collar
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 18), silverMat);
  collarRing.rotation.x = Math.PI / 2 - 0.18;
  collarRing.position.set(0, 1.31, 0.05);
  driver.add(collarRing);

  for (let i = -2; i <= 2; i++) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 6), silverMat);
    fang.position.set(i * 0.09, 1.24, 0.22);
    fang.rotation.x = Math.PI * 0.92;
    fang.rotation.z = -i * 0.14;
    driver.add(fang);
  }

  // Vibranium Kinetic Trim Stripes on shoulders
  for (const s of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), armorMat);
    pauldron.position.set(s * 0.44, 1.24, -0.04);
    driver.add(pauldron);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.38, 6, 8), suitMat);
    arm.position.set(s * 0.43, 1.02, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), armorMat);
    glove.position.set(s * 0.28, 1.03, 0.56);
    driver.add(glove);

    const vibraniumBand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.08), vibraniumMat);
    vibraniumBand.position.set(s * 0.28, 1.12, 0.19);
    vibraniumBand.rotation.z = s * 0.28;
    driver.add(vibraniumBand);
  }

  // Panther Cowl Head + Pointed Cat Ears
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 16), suitMat);
  head.scale.set(0.94, 1.06, 1.02);
  head.position.set(0, 1.66, 0.08);
  head.castShadow = true;
  driver.add(head);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 6), suitMat);
    ear.position.set(s * 0.21, 1.98, 0.02);
    ear.rotation.z = -s * 0.28;
    ear.rotation.x = -0.15;
    driver.add(ear);

    const silverBrow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.08), silverMat);
    silverBrow.position.set(s * 0.13, 1.76, 0.34);
    silverBrow.rotation.z = s * -0.25;
    driver.add(silverBrow);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.048, 0.05), eyeGlow);
    eye.position.set(s * 0.12, 1.7, 0.37);
    eye.rotation.z = s * -0.22;
    driver.add(eye);
  }

  const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), silverMat);
  noseBridge.position.set(0, 1.66, 0.38);
  driver.add(noseBridge);

  return driver;
}

function buildIronManDriver(): THREE.Group {
  const driver = new THREE.Group();

  const redArmorMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.78 });
  const goldArmorMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.18, metalness: 0.85 });
  const darkJointMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.65 });
  const arcGlowMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

  // Armored Torso & Shoulder Pauldrons
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.72, 0.48), redArmorMat);
  torso.position.set(0, 0.94, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const chestBevel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.38, 0.52), redArmorMat);
  chestBevel.position.set(0, 1.07, -0.04);
  driver.add(chestBevel);

  // Glowing Cyan Arc Reactor on Chest
  const arcFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16), goldArmorMat);
  arcFrame.rotation.x = Math.PI / 2;
  arcFrame.position.set(0, 1.08, 0.22);
  driver.add(arcFrame);

  const arcCore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 16), arcGlowMat);
  arcCore.rotation.x = Math.PI / 2;
  arcCore.position.set(0, 1.08, 0.23);
  driver.add(arcCore);

  // Pauldrons, Gold Gauntlets & Crimson Arms
  for (const s of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), redArmorMat);
    pauldron.scale.set(1.15, 0.85, 1.15);
    pauldron.position.set(s * 0.47, 1.24, -0.03);
    driver.add(pauldron);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 8), goldArmorMat);
    arm.position.set(s * 0.44, 1.02, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const gauntlet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.22), redArmorMat);
    gauntlet.position.set(s * 0.29, 1.04, 0.56);
    driver.add(gauntlet);
  }

  // Mark-Style Crimson Helmet + Angular Gold Faceplate
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.18, 12), darkJointMat);
  neck.position.set(0, 1.38, 0.02);
  driver.add(neck);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 16), redArmorMat);
  helmet.scale.set(0.94, 1.08, 1.04);
  helmet.position.set(0, 1.67, 0.08);
  helmet.castShadow = true;
  driver.add(helmet);

  const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.18), goldArmorMat);
  faceplate.position.set(0, 1.64, 0.33);
  driver.add(faceplate);

  const chinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.2), redArmorMat);
  chinGuard.position.set(0, 1.44, 0.33);
  driver.add(chinGuard);

  // Glowing Slanted Visor Eyes
  for (const s of [-1, 1]) {
    const visorEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.055, 0.06), arcGlowMat);
    visorEye.position.set(s * 0.12, 1.69, 0.41);
    visorEye.rotation.z = s * -0.12;
    driver.add(visorEye);
  }

  return driver;
}

function buildBungDriver(): THREE.Group {
  const driver = new THREE.Group();

  const tealMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.42, metalness: 0.15 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.32, metalness: 0.2 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2c7a5, roughness: 0.56 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.68 });
  const goggleMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.15, metalness: 0.65 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.4 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.85 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.55 });

  // Cyan Racing Jacket + Bold Orange Racing Stripe
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.68, 0.48), tealMat);
  torso.position.set(0, 0.92, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.69, 0.5), orangeMat);
  stripe.position.set(0, 0.92, -0.06);
  driver.add(stripe);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.16, 12), orangeMat);
  collar.position.set(0, 1.3, -0.02);
  driver.add(collar);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 8), tealMat);
    arm.position.set(s * 0.42, 1.02, 0.28);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), gloveMat);
    glove.position.set(s * 0.28, 1.02, 0.56);
    driver.add(glove);
  }

  // Head + Spiky Street-Racer Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 14), skinMat);
  head.position.set(0, 1.65, 0.08);
  head.castShadow = true;
  driver.add(head);

  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), hairMat);
  hairBase.position.set(0, 1.72, 0.01);
  driver.add(hairBase);

  for (let i = -2; i <= 2; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.28, 7), hairMat);
    spike.position.set(i * 0.11, 1.98 - Math.abs(i) * 0.03, 0.05);
    spike.rotation.z = -i * 0.25;
    spike.rotation.x = -0.18;
    driver.add(spike);
  }

  // Headband & Big Amber Turbo Goggles
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.09, 16), orangeMat);
  band.position.set(0, 1.79, 0.07);
  driver.add(band);

  for (const s of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 14), frameMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(s * 0.14, 1.78, 0.37);
    driver.add(rim);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.11, 14), goggleMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(s * 0.14, 1.78, 0.38);
    driver.add(lens);
  }

  // Goofy Asymmetric Funny-Face Eyes & Crooked Brows
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.082, 10, 10), eyeWhite);
  eyeLeft.scale.set(1.0, 1.15, 0.65);
  eyeLeft.position.set(-0.12, 1.66, 0.36);
  const pupLeft = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), eyeDark);
  pupLeft.position.set(-0.08, 1.68, 0.41); // Cross-eyed inward/up

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), eyeWhite);
  eyeRight.scale.set(1.05, 0.72, 0.65);
  eyeRight.position.set(0.12, 1.64, 0.36);
  const pupRight = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), eyeDark);
  pupRight.position.set(0.09, 1.63, 0.4); // Cross-eyed inward/down

  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), hairMat);
  browL.position.set(-0.12, 1.74, 0.37);
  browL.rotation.z = 0.28;
  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), hairMat);
  browR.position.set(0.12, 1.71, 0.37);
  browR.rotation.z = 0.22;
  driver.add(eyeLeft, pupLeft, eyeRight, pupRight, browL, browR);

  // Turned-up Button Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), skinMat);
  nose.position.set(0, 1.59, 0.41);
  driver.add(nose);

  // Funny Open Mouth + Two Prominent Buck Teeth Sticking Out + Cheeky Tongue
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.1), mouthMat);
  mouth.position.set(0, 1.49, 0.36);
  mouth.rotation.z = -0.08;
  driver.add(mouth);

  for (const tx of [-0.048, 0.048]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.09), toothMat);
    tooth.position.set(tx, 1.48, 0.41);
    tooth.rotation.x = -0.22; // Sticking forward out of mouth
    tooth.rotation.z = tx < 0 ? 0.08 : -0.08;
    driver.add(tooth);
  }

  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), tongueMat);
  tongue.scale.set(1.0, 0.55, 1.35);
  tongue.position.set(0.075, 1.44, 0.41);
  driver.add(tongue);

  return driver;
}

function buildYoshiDriver(): THREE.Group {
  const dino = new THREE.Group();

  const greenSkin = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.52, metalness: 0.04 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.62 });
  const redSaddleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.28, metalness: 0.14 });
  const whiteTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12 });

  // Green Dinosaur Torso + Cream Belly + Red Saddle Shell
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), greenSkin);
  torso.scale.set(0.92, 1.0, 1.15);
  torso.position.set(0, 0.9, -0.08);
  torso.castShadow = true;
  dino.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), creamMat);
  belly.scale.set(0.84, 0.92, 0.72);
  belly.position.set(0, 0.88, 0.24);
  dino.add(belly);

  const saddle = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), redSaddleMat);
  saddle.scale.set(0.95, 0.8, 1.05);
  saddle.position.set(0, 1.12, -0.36);
  dino.add(saddle);

  const saddleRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 18), whiteTrimMat);
  saddleRim.position.set(0, 1.08, -0.35);
  saddleRim.rotation.x = Math.PI * 0.35;
  dino.add(saddleRim);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 10), greenSkin);
  tail.position.set(0, 0.86, -0.74);
  tail.rotation.x = -Math.PI * 0.42;
  dino.add(tail);

  // Arms & Gloves
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 6, 8), greenSkin);
    arm.position.set(s * 0.39, 1.02, 0.28);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    dino.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), gloveMat);
    glove.position.set(s * 0.27, 1.03, 0.56);
    dino.add(glove);
  }

  // Neck, Head, Big Bulbous Snout & Cheeks
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.26, 0.42, 12), greenSkin);
  neck.position.set(0, 1.38, 0.08);
  neck.rotation.x = 0.14;
  dino.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 14), greenSkin);
  head.position.set(0, 1.72, 0.12);
  head.castShadow = true;
  dino.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 14), greenSkin);
  snout.scale.set(1.06, 0.92, 1.24);
  snout.position.set(0, 1.67, 0.42);
  snout.castShadow = true;
  dino.add(snout);

  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), creamMat);
    cheek.position.set(s * 0.22, 1.6, 0.22);
    dino.add(cheek);

    // Tall Oval Yoshi Eyes
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeWhite);
    sclera.scale.set(0.75, 1.35, 0.85);
    sclera.position.set(s * 0.13, 1.9, 0.29);
    dino.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), eyeDark);
    pupil.scale.set(0.8, 1.25, 0.8);
    pupil.position.set(s * 0.14, 1.9, 0.37);
    dino.add(pupil);
  }

  // 3 Red Spikes along Back of Head/Neck
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.22, 6), redSaddleMat);
    spike.position.set(0, 1.78 - i * 0.17, -0.14 - i * 0.08);
    spike.rotation.x = -Math.PI * 0.45;
    dino.add(spike);
  }

  return dino;
}

function buildToadStyleDriver(variant: 'toad' | 'toadette'): THREE.Group {
  const driver = new THREE.Group();
  const isToadette = variant === 'toadette';

  const vestMat = new THREE.MeshStandardMaterial({
    color: isToadette ? 0xec4899 : 0x2563eb,
    roughness: 0.48,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.28, metalness: 0.25 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.55 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4cfb4, roughness: 0.56 });
  const capMat = new THREE.MeshStandardMaterial({
    color: isToadette ? 0xf472b6 : 0xf8fafc,
    roughness: 0.35,
  });
  const spotMat = new THREE.MeshStandardMaterial({
    color: isToadette ? 0xfef9c3 : 0xef4444,
    roughness: 0.3,
  });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12 });

  // Compact Torso + Royal Vest with Gold Trim
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.44), shirtMat);
  torso.position.set(0, 0.9, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  for (const s of [-1, 1]) {
    const vestSide = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.63, 0.47), vestMat);
    vestSide.position.set(s * 0.23, 0.9, -0.06);
    driver.add(vestSide);

    const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.63, 0.49), trimMat);
    goldEdge.position.set(s * 0.12, 0.9, -0.06);
    driver.add(goldEdge);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 6, 8), skinMat);
    arm.position.set(s * 0.4, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), gloveMat);
    glove.position.set(s * 0.28, 1.02, 0.56);
    driver.add(glove);
  }

  // Cute Round Face & Tall Oval Eyes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  head.position.set(0, 1.5, 0.08);
  head.castShadow = true;
  driver.add(head);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), eyeDark);
    eye.scale.set(0.75, 1.45, 0.65);
    eye.position.set(s * 0.11, 1.52, 0.37);
    driver.add(eye);
  }

  // Giant Bulbous Mushroom Cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 16), capMat);
  cap.scale.set(1.06, 0.86, 1.06);
  cap.position.set(0, 1.92, 0.03);
  cap.castShadow = true;
  driver.add(cap);

  // Polka Dot Mushroom Spots
  const spotCoords: Array<[number, number, number]> = [
    [0, 2.02, 0.54],
    [0, 2.34, 0.04],
    [-0.48, 1.96, 0.16],
    [0.48, 1.96, 0.16],
    [0, 1.96, -0.49],
  ];
  for (const [sx, sy, sz] of spotCoords) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), spotMat);
    spot.position.set(sx, sy, sz);
    driver.add(spot);
  }

  // Toadette's Signature Twin Pink Pigtails with Gold Hair Ties
  if (isToadette) {
    for (const s of [-1, 1]) {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 12), trimMat);
      tie.position.set(s * 0.52, 1.66, -0.02);
      tie.rotation.y = Math.PI / 2;
      driver.add(tie);

      const pigtail1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), capMat);
      pigtail1.position.set(s * 0.6, 1.56, -0.06);
      driver.add(pigtail1);

      const pigtail2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), capMat);
      pigtail2.position.set(s * 0.64, 1.4, -0.1);
      driver.add(pigtail2);
    }
  }

  return driver;
}

function buildGoombaDriver(): THREE.Group {
  const driver = new THREE.Group();

  const capBrownMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.56, metalness: 0.04 });
  const stemTanMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.62 });
  const shoeBrownMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.68 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.7 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

  // Stout Tan Stem Torso
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.62, 14), stemTanMat);
  stem.position.set(0, 0.94, -0.02);
  stem.castShadow = true;
  driver.add(stem);

  // Stubby Brown Steering Nub Arms
  for (const s of [-1, 1]) {
    const stub = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 8), shoeBrownMat);
    stub.position.set(s * 0.32, 1.0, 0.32);
    stub.rotation.x = Math.PI * 0.4;
    stub.rotation.z = s * -0.15;
    driver.add(stub);
  }

  // Huge Rounded Chestnut-Brown Mushroom-Cap Head
  const capHead = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 16), capBrownMat);
  capHead.scale.set(1.16, 0.96, 1.02);
  capHead.position.set(0, 1.56, 0.06);
  capHead.castShadow = true;
  driver.add(capHead);

  // Lower Tan Cheek Rim
  const faceBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), stemTanMat);
  faceBase.scale.set(1.12, 0.52, 0.85);
  faceBase.position.set(0, 1.32, 0.18);
  driver.add(faceBase);

  // Angry Furrowed Eyebrows + Wide Eyes
  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), eyeWhite);
    sclera.scale.set(0.85, 1.3, 0.65);
    sclera.position.set(s * 0.16, 1.56, 0.49);
    driver.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeDark);
    pupil.position.set(s * 0.16, 1.55, 0.54);
    driver.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.08), browMat);
    brow.position.set(s * 0.16, 1.68, 0.5);
    brow.rotation.z = s * -0.32;
    driver.add(brow);
  }

  // Grumpy Scowl + Two Upward White Fangs
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.055, 0.06), browMat);
  mouth.position.set(0, 1.34, 0.47);
  driver.add(mouth);

  for (const s of [-1, 1]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.12, 6), toothMat);
    fang.position.set(s * 0.12, 1.39, 0.49);
    driver.add(fang);
  }

  return driver;
}

function buildPeepaDriver(): THREE.Group {
  const ghost = new THREE.Group();

  const whiteGhostMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.22,
    roughness: 0.35,
  });
  const outlineMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });

  // Floating Round Ghost Body + Wavy Tail Skirt
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 16), whiteGhostMat);
  body.scale.set(1.04, 1.12, 1.0);
  body.position.set(0, 1.34, 0.02);
  body.castShadow = true;
  ghost.add(body);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pleat = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), whiteGhostMat);
    pleat.position.set(Math.cos(a) * 0.34, 0.86, Math.sin(a) * 0.34 + 0.02);
    ghost.add(pleat);
  }

  // Tiny Stubby Ghost Arms reaching wheel
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.26, 6, 8), whiteGhostMat);
    arm.position.set(s * 0.42, 1.12, 0.34);
    arm.rotation.x = Math.PI * 0.4;
    arm.rotation.z = s * -0.2;
    ghost.add(arm);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), eyeDark);
    eye.scale.set(0.85, 1.25, 0.65);
    eye.position.set(s * 0.16, 1.44, 0.48);
    ghost.add(eye);

    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), cheekMat);
    blush.scale.set(1.2, 0.7, 0.5);
    blush.position.set(s * 0.26, 1.34, 0.44);
    ghost.add(blush);
  }

  // Cute Round Ghostly Grin
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.026, 8, 14, Math.PI), outlineMat);
  mouth.position.set(0, 1.31, 0.5);
  mouth.rotation.z = Math.PI;
  ghost.add(mouth);

  return ghost;
}

function buildKingBooDriver(): THREE.Group {
  const boo = new THREE.Group();

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.2,
    roughness: 0.32,
  });
  const crownGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.25,
    roughness: 0.18,
    metalness: 0.85,
  });
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 0.5,
    roughness: 0.15,
  });
  const mouthDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.75 });
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45 });
  const eyeRingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // Large Round Royal Ghost Body + Stubby Ghost Arms
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 20, 18), ghostMat);
  body.position.set(0, 1.36, 0.02);
  body.castShadow = true;
  boo.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.46, 10), ghostMat);
  tail.position.set(0, 1.06, -0.58);
  tail.rotation.x = -Math.PI * 0.42;
  boo.add(tail);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.28, 6, 8), ghostMat);
    arm.position.set(s * 0.48, 1.12, 0.36);
    arm.rotation.x = Math.PI * 0.4;
    arm.rotation.z = s * -0.2;
    boo.add(arm);

    // Fierce Black-Ringed Eyes + Glowing Pupils
    const ring = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeRingMat);
    ring.scale.set(0.95, 1.3, 0.55);
    ring.position.set(s * 0.18, 1.54, 0.52);
    boo.add(ring);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeGlowMat);
    glow.position.set(s * 0.18, 1.54, 0.56);
    boo.add(glow);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.06), eyeRingMat);
    brow.position.set(s * 0.18, 1.68, 0.51);
    brow.rotation.z = s * -0.28;
    boo.add(brow);
  }

  // Wide Laughing Mouth + Sharp Fangs + Long Pink Tongue
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), mouthDarkMat);
  mouth.scale.set(1.35, 0.72, 0.45);
  mouth.position.set(0, 1.24, 0.52);
  boo.add(mouth);

  for (const fx of [-0.17, 0.17]) {
    const topFang = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 6), toothMat);
    topFang.position.set(fx, 1.31, 0.59);
    topFang.rotation.x = Math.PI;
    boo.add(topFang);
  }

  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), tongueMat);
  tongue.scale.set(0.95, 0.5, 1.45);
  tongue.position.set(0, 1.13, 0.62);
  tongue.rotation.x = 0.25;
  boo.add(tongue);

  // Golden Royal Crown with Front Ruby Gem
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.18, 16), crownGoldMat);
  crownBase.position.set(0, 1.98, 0.04);
  crownBase.castShadow = true;
  boo.add(crownBase);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), crownGoldMat);
    point.position.set(Math.cos(a) * 0.24, 2.13, Math.sin(a) * 0.24 + 0.04);
    boo.add(point);
  }

  const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), rubyMat);
  ruby.position.set(0, 2.02, 0.32);
  boo.add(ruby);

  return boo;
}

function buildShyGuyDriver(): THREE.Group {
  const guy = new THREE.Group();

  const robeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.56 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.65 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.6 });
  const maskMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.26 });
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  // Crimson Hooded Robe & Leather Belt
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.72, 14), robeMat);
  robe.position.set(0, 0.92, -0.04);
  robe.castShadow = true;
  guy.add(robe);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.39, 0.1, 14), beltMat);
  belt.position.set(0, 0.86, -0.04);
  guy.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.06), goldMat);
  buckle.position.set(0, 0.86, 0.34);
  guy.add(buckle);

  for (const s of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 6, 8), robeMat);
    sleeve.position.set(s * 0.41, 1.04, 0.26);
    sleeve.rotation.x = Math.PI * 0.36;
    sleeve.rotation.z = s * -0.2;
    guy.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), gloveMat);
    hand.position.set(s * 0.28, 1.03, 0.56);
    guy.add(hand);
  }

  // Crimson Hood + Pointed Back Fold
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), robeMat);
  hood.scale.set(0.98, 1.05, 1.06);
  hood.position.set(0, 1.56, 0.03);
  hood.castShadow = true;
  guy.add(hood);

  const hoodTail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.36, 10), robeMat);
  hoodTail.position.set(0, 1.48, -0.38);
  hoodTail.rotation.x = -Math.PI * 0.4;
  guy.add(hoodTail);

  // Iconic Oval White Mask + Two Dark Eyeholes + Small Round Mouth Hole
  const mask = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 14), maskMat);
  mask.scale.set(0.92, 1.05, 0.45);
  mask.position.set(0, 1.55, 0.34);
  guy.add(mask);

  for (const s of [-1, 1]) {
    const eyeHole = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), holeMat);
    eyeHole.scale.set(0.75, 1.35, 0.5);
    eyeHole.position.set(s * 0.11, 1.6, 0.45);
    guy.add(eyeHole);
  }

  const mouthHole = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), holeMat);
  mouthHole.scale.set(0.9, 1.1, 0.5);
  mouthHole.position.set(0, 1.43, 0.45);
  guy.add(mouthHole);

  return guy;
}

function buildConkdorDriver(): THREE.Group {
  const bird = new THREE.Group();

  const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.58 });
  const ruffMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.1 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });

  // Condor Body + Fluffy White Collar Ruff
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), navyMat);
  torso.scale.set(0.95, 1.05, 1.1);
  torso.position.set(0, 0.92, -0.06);
  torso.castShadow = true;
  bird.add(torso);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), ruffMat);
    puff.position.set(Math.cos(a) * 0.24, 1.28, Math.sin(a) * 0.24 + 0.04);
    bird.add(puff);
  }

  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 8), navyMat);
    wing.position.set(s * 0.41, 1.04, 0.26);
    wing.rotation.x = Math.PI * 0.36;
    wing.rotation.z = s * -0.2;
    bird.add(wing);
  }

  // Tall Long Condor Neck & Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.64, 12), navyMat);
  neck.position.set(0, 1.56, 0.08);
  neck.rotation.x = 0.14;
  neck.castShadow = true;
  bird.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), navyMat);
  head.position.set(0, 1.94, 0.14);
  head.castShadow = true;
  bird.add(head);

  // Feathered Crest
  for (const tilt of [-0.25, 0.15]) {
    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.28, 6), navyMat);
    feather.position.set(0, 2.22, 0.04 + tilt * 0.2);
    feather.rotation.x = -0.5 + tilt;
    bird.add(feather);
  }

  // Large Bright Orange Hooked Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.56, 10), beakMat);
  beak.rotation.x = Math.PI * 0.56;
  beak.position.set(0, 1.9, 0.52);
  beak.castShadow = true;
  bird.add(beak);

  const beakTip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), beakMat);
  beakTip.rotation.x = Math.PI * 0.95;
  beakTip.position.set(0, 1.81, 0.76);
  bird.add(beakTip);

  // Fierce Condor Eyes
  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeWhite);
    sclera.position.set(s * 0.16, 1.98, 0.34);
    bird.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeDark);
    pupil.position.set(s * 0.18, 1.98, 0.4);
    bird.add(pupil);
  }

  return bird;
}

function buildBowserDriver(): THREE.Group {
  const bowser = new THREE.Group();

  const goldScaleMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.48 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.62 });
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.38 });
  const redHairMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.45 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.15 });

  // Heavyweight Golden Koopa Torso + Cream Belly + Green Spiked Shell
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 14), goldScaleMat);
  torso.scale.set(1.06, 0.96, 1.02);
  torso.position.set(0, 0.96, -0.02);
  torso.castShadow = true;
  bowser.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), creamMat);
  belly.scale.set(0.92, 0.92, 0.62);
  belly.position.set(0, 0.94, 0.28);
  bowser.add(belly);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 14), shellMat);
  shell.scale.set(0.98, 1.08, 0.72);
  shell.position.set(0, 1.08, -0.42);
  shell.castShadow = true;
  bowser.add(shell);

  for (const [sx, sy] of [[0, 1.38], [-0.26, 1.15], [0.26, 1.15], [0, 0.92]]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 8), spikeMat);
    spike.position.set(sx, sy, -0.78);
    spike.rotation.x = -Math.PI * 0.48;
    bowser.add(spike);
  }

  // Spiked Black Collar + Heavy Arms & Spiked Wristbands
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.12, 14), collarMat);
  collar.position.set(0, 1.38, 0.04);
  bowser.add(collar);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.38, 6, 8), goldScaleMat);
    arm.position.set(s * 0.5, 1.04, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.22;
    bowser.add(arm);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10), collarMat);
    cuff.position.set(s * 0.34, 1.03, 0.48);
    cuff.rotation.x = Math.PI * 0.36;
    bowser.add(cuff);
  }

  // Fierce Bowser Head, Green Brow Bridge, Snout, Horns & Red Hair Crest
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), shellMat);
  head.position.set(0, 1.72, 0.1);
  head.castShadow = true;
  bowser.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.38), goldScaleMat);
  snout.position.set(0, 1.58, 0.34);
  bowser.add(snout);

  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), spikeMat);
    horn.position.set(s * 0.26, 2.04, 0.06);
    horn.rotation.z = -s * 0.42;
    horn.rotation.x = 0.22;
    bowser.add(horn);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeWhite);
    eye.position.set(s * 0.14, 1.78, 0.4);
    bowser.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeRed);
    pupil.position.set(s * 0.14, 1.78, 0.46);
    bowser.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.08), redHairMat);
    brow.position.set(s * 0.14, 1.88, 0.42);
    brow.rotation.z = s * -0.28;
    bowser.add(brow);
  }

  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 7), redHairMat);
  crest.position.set(0, 2.12, 0.16);
  bowser.add(crest);

  return bowser;
}

function buildBowserJrDriver(): THREE.Group {
  const jr = new THREE.Group();

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.38 });
  const orangeHairMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 });
  const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42 });
  const toothInkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // Compact Yellow Body + Green Spiked Shell
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), yellowMat);
  torso.position.set(0, 0.9, -0.02);
  torso.castShadow = true;
  jr.add(torso);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 12), shellMat);
  shell.scale.set(0.95, 1.05, 0.7);
  shell.position.set(0, 1.0, -0.34);
  jr.add(shell);

  for (const sy of [1.22, 0.96]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 6), spikeMat);
    spike.position.set(0, sy, -0.64);
    spike.rotation.x = -Math.PI * 0.48;
    jr.add(spike);
  }

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 6, 8), yellowMat);
    arm.position.set(s * 0.38, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    jr.add(arm);
  }

  // Round Yellow Head + Iconic Orange Ponytail + Tiny Horns
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), yellowMat);
  head.position.set(0, 1.56, 0.08);
  head.castShadow = true;
  jr.add(head);

  const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), orangeHairMat);
  ponytail.position.set(0, 1.98, 0.02);
  ponytail.rotation.x = -0.22;
  jr.add(ponytail);

  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), spikeMat);
    horn.position.set(s * 0.2, 1.86, 0.08);
    horn.rotation.z = -s * 0.35;
    jr.add(horn);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), eyeWhite);
    sclera.position.set(s * 0.12, 1.66, 0.36);
    jr.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeDark);
    pupil.position.set(s * 0.12, 1.66, 0.41);
    jr.add(pupil);
  }

  // Iconic White Mouth Bandana with Drawn Toothy Grin
  const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.22, 16), bandanaMat);
  bandana.position.set(0, 1.44, 0.12);
  jr.add(bandana);

  const grinLine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.06), toothInkMat);
  grinLine.position.set(0, 1.45, 0.45);
  jr.add(grinLine);

  return jr;
}

function buildCheepCheepDriver(): THREE.Group {
  const fish = new THREE.Group();

  const redScaleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.55 });
  const goldFinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.32 });
  const lipPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.45 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12 });

  // Plump Round Crimson Fish Body + Cream Belly
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 16), redScaleMat);
  body.scale.set(1.04, 0.98, 1.15);
  body.position.set(0, 1.24, 0.02);
  body.castShadow = true;
  fish.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 14), creamMat);
  belly.scale.set(0.95, 0.72, 0.96);
  belly.position.set(0, 1.04, 0.12);
  fish.add(belly);

  // Golden Wing Pectoral Fins & Spiky Dorsal Mohawk
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.32), goldFinMat);
    wing.position.set(s * 0.62, 1.22, 0.16);
    wing.rotation.z = s * 0.25;
    wing.rotation.y = s * -0.35;
    fish.add(wing);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), eyeWhite);
    eye.position.set(s * 0.24, 1.4, 0.44);
    fish.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeDark);
    pupil.position.set(s * 0.25, 1.4, 0.52);
    fish.add(pupil);
  }

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 6), goldFinMat);
  dorsal.position.set(0, 1.84, -0.05);
  dorsal.rotation.x = -0.35;
  fish.add(dorsal);

  const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 6), goldFinMat);
  tailFin.position.set(0, 1.24, -0.68);
  tailFin.rotation.x = Math.PI * 0.5;
  fish.add(tailFin);

  // Plump Puckered Pink Lips
  const lips = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.055, 8, 14), lipPinkMat);
  lips.position.set(0, 1.2, 0.6);
  fish.add(lips);

  return fish;
}

function buildFishBoneDriver(): THREE.Group {
  const skel = new THREE.Group();

  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.38 });
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Bony Spine & Ribcage Torso
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.68, 10), boneMat);
  spine.position.set(0, 1.0, -0.18);
  skel.add(spine);

  for (const ry of [0.88, 1.04, 1.2]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 6, 14), boneMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.set(0, ry, -0.04);
    skel.add(rib);
  }

  for (const s of [-1, 1]) {
    const finBone = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.36, 6, 8), boneMat);
    finBone.position.set(s * 0.36, 1.04, 0.26);
    finBone.rotation.x = Math.PI * 0.36;
    finBone.rotation.z = s * -0.2;
    skel.add(finBone);
  }

  // Fish Skull with Hollow Eye Sockets + Glowing Cyan Pinpoints
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), boneMat);
  skull.scale.set(0.95, 0.92, 1.15);
  skull.position.set(0, 1.54, 0.12);
  skull.castShadow = true;
  skel.add(skull);

  for (const s of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), socketMat);
    socket.position.set(s * 0.18, 1.6, 0.42);
    skel.add(socket);

    const glowEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), cyanGlowMat);
    glowEye.position.set(s * 0.18, 1.6, 0.49);
    skel.add(glowEye);
  }

  // Jagged Skeletal Jaw & Bony Tail Fin
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.34), boneMat);
  jaw.position.set(0, 1.32, 0.28);
  skel.add(jaw);

  for (let i = -2; i <= 2; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 5), boneMat);
    tooth.position.set(i * 0.065, 1.4, 0.45);
    skel.add(tooth);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 5), boneMat);
  tail.position.set(0, 1.18, -0.58);
  tail.rotation.x = Math.PI * 0.48;
  skel.add(tail);

  return skel;
}

function buildVillagerDriver(variant: 'boy' | 'girl'): THREE.Group {
  const isGirl = variant === 'girl';
  const driver = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xf472b6 : 0xef4444,
    roughness: 0.55,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xfde047 : 0xf8fafc,
    roughness: 0.48,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf9d3b4, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xd97706 : 0x5c3317,
    roughness: 0.68,
  });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.6 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Torso & Shirt Emblem
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.64, 0.44), shirtMat);
  torso.position.set(0, 0.92, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), collarMat);
  badge.position.set(0, 0.96, 0.17);
  driver.add(badge);

  // Arms & Rounded Mitt-Hands
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.34, 6, 8), shirtMat);
    arm.position.set(s * 0.39, 1.0, 0.24);
    arm.rotation.x = Math.PI * 0.35;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), skinMat);
    hand.position.set(s * 0.27, 1.0, 0.52);
    driver.add(hand);
  }

  // Big Villager Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), skinMat);
  head.scale.set(1.04, 1.0, 0.98);
  head.position.set(0, 1.63, 0.08);
  head.castShadow = true;
  driver.add(head);

  // Hair Cap & Bangs
  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.375, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat,
  );
  hairTop.position.set(0, 1.66, 0.06);
  hairTop.rotation.x = -0.18;
  driver.add(hairTop);

  if (isGirl) {
    for (const s of [-1, 1]) {
      const braid = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), hairMat);
      braid.scale.set(0.85, 1.25, 0.85);
      braid.position.set(s * 0.33, 1.5, -0.02);
      driver.add(braid);
    }
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.1), shirtMat);
    bow.position.set(0.25, 1.94, 0.14);
    bow.rotation.z = -0.3;
    driver.add(bow);
  } else {
    for (let i = -1; i <= 1; i++) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 6), hairMat);
      bang.position.set(i * 0.13, 1.88, 0.34);
      bang.rotation.x = Math.PI * 0.82;
      driver.add(bang);
    }
  }

  // Iconic Red Round/Triangle Nose & Rosy Cheeks
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), noseMat);
  nose.scale.set(1.0, 1.15, 0.9);
  nose.position.set(0, 1.61, 0.44);
  driver.add(nose);

  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), cheekMat);
    cheek.scale.set(1.2, 0.8, 0.4);
    cheek.position.set(s * 0.22, 1.56, 0.38);
    driver.add(cheek);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), whiteMat);
    sclera.scale.set(0.95, 1.2, 0.55);
    sclera.position.set(s * 0.14, 1.71, 0.39);
    driver.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), blackMat);
    pupil.position.set(s * 0.14, 1.71, 0.425);
    driver.add(pupil);
  }

  return driver;
}

function buildPrincessDriver(
  variant: 'peach' | 'daisy' | 'rosalina' | 'baby_peach' | 'baby_daisy' | 'baby_rosalina',
): THREE.Group {
  const isBaby = variant.startsWith('baby_');
  const base = variant.replace('baby_', '') as 'peach' | 'daisy' | 'rosalina';

  const suitHex = base === 'peach' ? 0xf472b6 : base === 'daisy' ? 0xf97316 : 0x38bdf8;
  const trimHex = base === 'peach' ? 0xfde047 : base === 'daisy' ? 0xfacc15 : 0xe0f2fe;
  const hairHex = base === 'peach' ? 0xfacc15 : base === 'daisy' ? 0x92400e : 0xfef3c7;
  const gemHex = base === 'peach' ? 0x2563eb : base === 'daisy' ? 0x16a34a : 0xfacc15;
  const crownHex = base === 'rosalina' ? 0xe2e8f0 : 0xfacc15;

  const driver = new THREE.Group();
  const dressMat = new THREE.MeshStandardMaterial({ color: suitHex, roughness: 0.38, metalness: 0.08 });
  const trimMat = new THREE.MeshStandardMaterial({ color: trimHex, roughness: 0.35, metalness: 0.15 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.58 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfad6bc, roughness: 0.56 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42 });
  const crownMat = new THREE.MeshStandardMaterial({ color: crownHex, roughness: 0.22, metalness: 0.85 });
  const gemMat = new THREE.MeshStandardMaterial({ color: gemHex, roughness: 0.18, metalness: 0.35 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: base === 'daisy' ? 0x2563eb : 0x0ea5e9,
    roughness: 0.2,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const blushMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.6 });

  // Bodice / Racing Gown Top
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.68, 12), dressMat);
  torso.position.set(0, 0.92, -0.05);
  torso.castShadow = true;
  driver.add(torso);

  const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), gemMat);
  brooch.position.set(0, 1.06, 0.28);
  driver.add(brooch);

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 14), trimMat);
  scarf.rotation.x = Math.PI * 0.45;
  scarf.position.set(0, 1.24, -0.02);
  driver.add(scarf);

  // Puffy Sleeves & Long White Gloves
  for (const s of [-1, 1]) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), dressMat);
    puff.position.set(s * 0.35, 1.15, -0.02);
    driver.add(puff);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 6, 8), gloveMat);
    arm.position.set(s * 0.36, 1.0, 0.25);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), gloveMat);
    glove.position.set(s * 0.26, 1.0, 0.53);
    driver.add(glove);
  }

  // Head (slightly larger chubby proportions for Baby variants)
  const headScale = isBaby ? 1.18 : 1.0;
  const headY = isBaby ? 1.56 : 1.63;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32 * headScale, 16, 14), skinMat);
  head.scale.set(0.98, 1.02, 0.96);
  head.position.set(0, headY, 0.08);
  head.castShadow = true;
  driver.add(head);

  // Flowing Hair Crown & Back Locks
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.35 * headScale, 16, 14), hairMat);
  hairBack.scale.set(1.06, isBaby ? 0.95 : 1.25, 0.95);
  hairBack.position.set(0, headY - (isBaby ? 0.02 : 0.08), -0.04);
  hairBack.castShadow = true;
  driver.add(hairBack);

  if (base === 'rosalina') {
    // Sweeping diagonal bang covering right eye
    const bang = new THREE.Mesh(new THREE.ConeGeometry(0.18 * headScale, 0.42 * headScale, 8), hairMat);
    bang.position.set(-0.14 * headScale, headY + 0.04, 0.31 * headScale);
    bang.rotation.z = -0.55;
    bang.rotation.x = 0.25;
    driver.add(bang);
  } else if (base === 'daisy') {
    for (const s of [-1, 1]) {
      const flip = new THREE.Mesh(new THREE.SphereGeometry(0.17 * headScale, 10, 10), hairMat);
      flip.scale.set(1.1, 0.85, 0.85);
      flip.position.set(s * 0.3 * headScale, headY - 0.14, 0.02);
      driver.add(flip);
    }
  } else {
    for (const s of [-1, 1]) {
      const curl = new THREE.Mesh(new THREE.CapsuleGeometry(0.09 * headScale, 0.28 * headScale, 6, 8), hairMat);
      curl.position.set(s * 0.28 * headScale, headY - 0.1, 0.12);
      driver.add(curl);
    }
  }

  // Royal Tiara / Crown
  const crownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * headScale, 0.12 * headScale, 0.12, 10),
    crownMat,
  );
  crownBase.position.set(0, headY + 0.34 * headScale, 0.08);
  driver.add(crownBase);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), crownMat);
    tip.position.set(Math.cos(a) * 0.11 * headScale, headY + 0.43 * headScale, 0.08 + Math.sin(a) * 0.11 * headScale);
    driver.add(tip);
  }

  const crownGem = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), gemMat);
  crownGem.position.set(0, headY + 0.35 * headScale, 0.22 * headScale);
  driver.add(crownGem);

  // Expressive Eyes & Baby Pacifier / Blush
  const eyeSides = base === 'rosalina' ? [1] : [-1, 1];
  for (const s of eyeSides) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 10), whiteMat);
    white.scale.set(0.9, 1.25, 0.5);
    white.position.set(s * 0.12 * headScale, headY + 0.02, 0.36 * headScale);
    driver.add(white);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), eyeMat);
    iris.position.set(s * 0.12 * headScale, headY + 0.02, 0.39 * headScale);
    driver.add(iris);
  }

  if (isBaby) {
    for (const s of [-1, 1]) {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blushMat);
      blush.scale.set(1.2, 0.75, 0.4);
      blush.position.set(s * 0.19 * headScale, headY - 0.08, 0.34 * headScale);
      driver.add(blush);
    }
    const paci = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 6, 12), trimMat);
    paci.position.set(0, headY - 0.14, 0.39 * headScale);
    driver.add(paci);
  }

  if (isBaby) {
    driver.scale.setScalar(0.84);
  }
  return driver;
}

function buildPaulineDriver(): THREE.Group {
  const driver = new THREE.Group();
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 });
  const darkRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.48 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf7cfad, roughness: 0.56 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x3b1e10, roughness: 0.65 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.2 });

  // Tailored Crimson Racing Coat & Gold Trim
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.36, 0.7, 12), crimsonMat);
  torso.position.set(0, 0.92, -0.05);
  torso.castShadow = true;
  driver.add(torso);

  const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.48), goldMat);
  lapel.position.set(0, 0.95, -0.03);
  driver.add(lapel);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.36, 6, 8), crimsonMat);
    arm.position.set(s * 0.38, 1.02, 0.25);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.18;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), gloveMat);
    glove.position.set(s * 0.27, 1.02, 0.54);
    driver.add(glove);
  }

  // Head & Wavy Dark Brown Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  head.scale.set(0.94, 1.04, 0.96);
  head.position.set(0, 1.64, 0.08);
  head.castShadow = true;
  driver.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), hairMat);
  hair.scale.set(1.06, 1.18, 0.96);
  hair.position.set(0, 1.56, -0.05);
  driver.add(hair);

  // Signature Wide-Brim Crimson Fedora + Gold Band
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.04, 20), darkRedMat);
  hatBrim.position.set(0, 1.88, 0.08);
  hatBrim.rotation.x = -0.1;
  hatBrim.rotation.z = 0.08;
  hatBrim.castShadow = true;
  driver.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.24, 16), crimsonMat);
  hatCrown.position.set(0, 1.99, 0.07);
  hatCrown.rotation.x = -0.1;
  hatCrown.rotation.z = 0.08;
  driver.add(hatCrown);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.32, 0.055, 16), goldMat);
  hatBand.position.set(0, 1.91, 0.08);
  hatBand.rotation.x = -0.1;
  hatBand.rotation.z = 0.08;
  driver.add(hatBand);

  // Gold Hoop Earrings, Blue Eyes & Red Lipstick Smile
  for (const s of [-1, 1]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 6, 12), goldMat);
    hoop.rotation.y = Math.PI * 0.5;
    hoop.position.set(s * 0.32, 1.53, 0.08);
    driver.add(hoop);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
    eye.position.set(s * 0.11, 1.66, 0.37);
    driver.add(eye);
  }

  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.05), crimsonMat);
  lips.position.set(0, 1.51, 0.36);
  driver.add(lips);

  return driver;
}

function buildInklingDriver(variant: 'boy' | 'girl'): THREE.Group {
  const isGirl = variant === 'girl';
  const driver = new THREE.Group();
  const inkMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xf97316 : 0x2563eb,
    roughness: 0.32,
  });
  const teeMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xf8fafc : 0x0f172a,
    roughness: 0.65,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: isGirl ? 0xa3e635 : 0x38bdf8,
    roughness: 0.38,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6cfaf, roughness: 0.58 });
  const maskMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // Streetwear Torso & Ink Tank on Back
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.66, 0.44), teeMat);
  torso.position.set(0, 0.92, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const logo = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.05), inkMat);
  logo.position.set(0, 0.96, 0.16);
  driver.add(logo);

  const inkTank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 12), inkMat);
  inkTank.position.set(0, 0.98, -0.34);
  driver.add(inkTank);

  const tankCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.07, 12), accentMat);
  tankCap.position.set(0, 1.2, -0.34);
  driver.add(tankCap);

  // Arms & Fingerless Gloves
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.35, 6, 8), skinMat);
    arm.position.set(s * 0.39, 1.0, 0.24);
    arm.rotation.x = Math.PI * 0.35;
    arm.rotation.z = s * -0.2;
    driver.add(arm);

    const cuff = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), maskMat);
    cuff.position.set(s * 0.27, 1.0, 0.52);
    driver.add(cuff);
  }

  // Head & Pointed Inkling Ears
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 14), skinMat);
  head.scale.set(0.98, 1.02, 0.98);
  head.position.set(0, 1.63, 0.08);
  head.castShadow = true;
  driver.add(head);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), skinMat);
    ear.position.set(s * 0.35, 1.67, 0.06);
    ear.rotation.z = s * -1.15;
    driver.add(ear);
  }

  // Tentacle Hair Style
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    inkMat,
  );
  hairCap.position.set(0, 1.66, 0.07);
  hairCap.castShadow = true;
  driver.add(hairCap);

  if (isGirl) {
    // Two long orange side tentacles + neon lime headphones
    for (const s of [-1, 1]) {
      const tentacle = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 6, 10), inkMat);
      tentacle.position.set(s * 0.29, 1.44, 0.04);
      tentacle.rotation.z = s * 0.22;
      driver.add(tentacle);

      const suction = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), accentMat);
      suction.position.set(s * 0.37, 1.32, 0.1);
      driver.add(suction);

      const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 12), accentMat);
      earCup.rotation.z = Math.PI * 0.5;
      earCup.position.set(s * 0.36, 1.72, 0.08);
      driver.add(earCup);
    }
  } else {
    // Cobalt Boy swept top-knot tentacle bun + back tentacles
    const topKnot = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.36, 10), inkMat);
    topKnot.position.set(0, 2.02, -0.05);
    topKnot.rotation.x = -0.75;
    driver.add(topKnot);

    for (const s of [-1, 1]) {
      const sideLock = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 8), inkMat);
      sideLock.position.set(s * 0.24, 1.56, -0.18);
      sideLock.rotation.x = -0.9;
      driver.add(sideLock);
    }
  }

  // Signature Black Inkling Eye Mask & Bright Eyes
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.1), maskMat);
  mask.position.set(0, 1.66, 0.36);
  driver.add(mask);

  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), whiteMat);
    sclera.scale.set(0.95, 1.25, 0.5);
    sclera.position.set(s * 0.12, 1.66, 0.39);
    driver.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), inkMat);
    iris.position.set(s * 0.12, 1.66, 0.42);
    driver.add(iris);
  }

  return driver;
}

function buildDonkeyKongDriver(): THREE.Group {
  const dk = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0x6d3b1a, roughness: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.58 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Broad Ape Torso & Tan Chest
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 14), furMat);
  torso.scale.set(1.12, 0.96, 0.96);
  torso.position.set(0, 0.98, -0.04);
  torso.castShadow = true;
  dk.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), skinMat);
  chest.scale.set(0.96, 0.88, 0.55);
  chest.position.set(0, 0.98, 0.27);
  dk.add(chest);

  // Iconic Red Tie with Yellow DK Emblem
  const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.12), tieMat);
  tieKnot.position.set(0, 1.24, 0.44);
  dk.add(tieKnot);

  const tieBlade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.08), tieMat);
  tieBlade.position.set(0, 0.95, 0.49);
  tieBlade.rotation.x = -0.14;
  dk.add(tieBlade);

  const tieLogo = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.03), yellowMat);
  tieLogo.position.set(0, 0.92, 0.53);
  dk.add(tieLogo);

  // Heavy Arms & Gripping Fists
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 8), furMat);
    arm.position.set(s * 0.52, 1.04, 0.25);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.22;
    dk.add(arm);

    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), skinMat);
    fist.position.set(s * 0.34, 1.02, 0.56);
    dk.add(fist);
  }

  // Head, Brow Ridge, Tan Muzzle & Signature Top Curl Tuft
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 14), furMat);
  head.position.set(0, 1.72, 0.08);
  head.castShadow = true;
  dk.add(head);

  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 8), furMat);
  tuft.position.set(0, 2.16, 0.14);
  tuft.rotation.x = 0.38;
  dk.add(tuft);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.2), furMat);
  brow.position.set(0, 1.84, 0.36);
  dk.add(brow);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), skinMat);
  muzzle.scale.set(1.12, 0.85, 0.95);
  muzzle.position.set(0, 1.59, 0.34);
  dk.add(muzzle);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), skinMat);
    ear.scale.set(0.45, 1, 0.85);
    ear.position.set(s * 0.38, 1.72, 0.06);
    dk.add(ear);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), eyeWhite);
    sclera.position.set(s * 0.12, 1.76, 0.41);
    dk.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeDark);
    pupil.position.set(s * 0.12, 1.76, 0.46);
    dk.add(pupil);
  }

  return dk;
}

function buildBullyCullibugDriver(): THREE.Group {
  const bug = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.24, metalness: 0.55 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.4 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.72 });
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    roughness: 0.15,
  });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.28, metalness: 0.5 });

  // Heavy Round Bully-Beetle Carapace Body
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.54, 16, 14), bodyMat);
  torso.scale.set(1.08, 0.92, 1.05);
  torso.position.set(0, 1.02, 0);
  torso.castShadow = true;
  bug.add(torso);

  // Glossy Split Beetle Wing Shells on Back
  for (const s of [-1, 1]) {
    const elytron = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), wingMat);
    elytron.scale.set(0.85, 1.15, 0.65);
    elytron.position.set(s * 0.22, 1.08, -0.34);
    elytron.rotation.y = s * 0.2;
    bug.add(elytron);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.32, 6, 8), shellMat);
    arm.position.set(s * 0.48, 0.96, 0.28);
    arm.rotation.x = Math.PI * 0.38;
    arm.rotation.z = s * -0.22;
    bug.add(arm);

    const pincer = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), hornMat);
    pincer.position.set(s * 0.32, 0.98, 0.55);
    pincer.rotation.x = Math.PI * 0.5;
    bug.add(pincer);
  }

  // Head Crest + Large Curved Golden Bull Horns
  const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), shellMat);
  headDome.position.set(0, 1.48, 0.1);
  headDome.castShadow = true;
  bug.add(headDome);

  for (const s of [-1, 1]) {
    const hornBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.34, 10), hornMat);
    hornBase.position.set(s * 0.36, 1.66, 0.14);
    hornBase.rotation.z = -s * 0.95;
    hornBase.rotation.x = 0.35;
    hornBase.castShadow = true;
    bug.add(hornBase);

    const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.36, 10), hornMat);
    hornTip.position.set(s * 0.56, 1.78, 0.32);
    hornTip.rotation.x = Math.PI * 0.35;
    hornTip.rotation.z = -s * 0.3;
    bug.add(hornTip);

    // Glowing Angry Bully Eyes
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), eyeGlowMat);
    eye.scale.set(1.15, 0.8, 0.6);
    eye.position.set(s * 0.17, 1.5, 0.47);
    eye.rotation.z = s * 0.25;
    bug.add(eye);
  }

  return bug;
}

function buildCowDriver(): THREE.Group {
  const cow = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.62 });
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.5 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.38 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
  const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.8 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Plump Dairy Body + Black Cow Spots
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 14), whiteMat);
  torso.scale.set(1.04, 0.98, 1.06);
  torso.position.set(0, 0.94, -0.04);
  torso.castShadow = true;
  cow.add(torso);

  const spot1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), spotMat);
  spot1.scale.set(0.9, 1.1, 0.5);
  spot1.position.set(-0.28, 1.0, 0.22);
  cow.add(spot1);

  const spot2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), spotMat);
  spot2.scale.set(1.0, 0.9, 0.55);
  spot2.position.set(0.22, 0.96, -0.28);
  cow.add(spot2);

  // Red Collar & Golden Cowbell
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 8, 16), collarMat);
  collar.rotation.x = Math.PI * 0.46;
  collar.position.set(0, 1.32, 0.04);
  cow.add(collar);

  const cowbell = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.16, 10), bellMat);
  cowbell.position.set(0, 1.21, 0.34);
  cow.add(cowbell);

  // Hooved Arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.35, 6, 8), whiteMat);
    arm.position.set(s * 0.42, 1.02, 0.25);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    cow.add(arm);

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 10), spotMat);
    hoof.rotation.x = Math.PI * 0.5;
    hoof.position.set(s * 0.28, 1.02, 0.55);
    cow.add(hoof);
  }

  // Head, Big Pink Muzzle, Horns & Floppy Ears
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), whiteMat);
  head.position.set(0, 1.66, 0.08);
  head.castShadow = true;
  cow.add(head);

  const headSpot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), spotMat);
  headSpot.scale.set(1, 0.85, 0.6);
  headSpot.position.set(0.16, 1.78, 0.22);
  cow.add(headSpot);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), pinkMat);
  muzzle.scale.set(1.18, 0.78, 0.9);
  muzzle.position.set(0, 1.55, 0.38);
  cow.add(muzzle);

  for (const s of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeDark);
    nostril.position.set(s * 0.11, 1.57, 0.6);
    cow.add(nostril);

    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.1), spotMat);
    ear.position.set(s * 0.39, 1.72, 0.06);
    ear.rotation.z = s * -0.25;
    cow.add(ear);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 8), hornMat);
    horn.position.set(s * 0.2, 1.98, 0.08);
    horn.rotation.z = -s * 0.35;
    cow.add(horn);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeDark);
    eye.position.set(s * 0.14, 1.72, 0.39);
    cow.add(eye);
  }

  return cow;
}

function buildPenguinDriver(): THREE.Group {
  const pen = new THREE.Group();
  const navyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 });
  const crestMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Plump Penguin Torso + Snow-White Belly
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), navyMat);
  torso.scale.set(0.98, 1.15, 0.96);
  torso.position.set(0, 0.98, -0.02);
  torso.castShadow = true;
  pen.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), whiteMat);
  belly.scale.set(0.88, 1.05, 0.55);
  belly.position.set(0, 0.98, 0.25);
  pen.add(belly);

  // Flipper Wings
  for (const s of [-1, 1]) {
    const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.4, 6, 8), navyMat);
    flipper.scale.set(0.7, 1, 1.15);
    flipper.position.set(s * 0.43, 1.02, 0.24);
    flipper.rotation.x = Math.PI * 0.35;
    flipper.rotation.z = s * -0.25;
    pen.add(flipper);
  }

  // Sleek Penguin Head + White Face Patches + Orange Beak + Yellow Crest Tufts
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), navyMat);
  head.position.set(0, 1.63, 0.06);
  head.castShadow = true;
  pen.add(head);

  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), whiteMat);
    cheek.scale.set(0.95, 1.05, 0.55);
    cheek.position.set(s * 0.13, 1.62, 0.28);
    pen.add(cheek);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), eyeDark);
    eye.position.set(s * 0.12, 1.67, 0.37);
    pen.add(eye);

    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 6), crestMat);
    tuft.position.set(s * 0.18, 1.9, 0.22);
    tuft.rotation.z = -s * 0.72;
    tuft.rotation.x = 0.2;
    pen.add(tuft);
  }

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 10), beakMat);
  beak.rotation.x = Math.PI * 0.54;
  beak.position.set(0, 1.56, 0.44);
  pen.add(beak);

  return pen;
}

function buildStingbyDriver(): THREE.Group {
  const bee = new THREE.Group();

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.52 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.68,
  });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });

  // Striped Bee Torso / Abdomen + Rear Stinger
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), yellowMat);
  abdomen.scale.set(0.92, 1.0, 1.24);
  abdomen.position.set(0, 0.92, -0.14);
  abdomen.castShadow = true;
  bee.add(abdomen);

  for (const [zOff, r] of [
    [-0.02, 0.39],
    [-0.2, 0.4],
    [-0.38, 0.33],
  ] as const) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 8, 18), blackMat);
    stripe.position.set(0, 0.92, zOff);
    bee.add(stripe);
  }

  const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.34, 8), blackMat);
  stinger.rotation.x = -Math.PI * 0.52;
  stinger.position.set(0, 0.88, -0.74);
  bee.add(stinger);

  // Fuzzy Collar & Translucent Buzz Wings
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 8, 14), yellowMat);
  collar.rotation.x = Math.PI * 0.5;
  collar.position.set(0, 1.28, 0.02);
  bee.add(collar);

  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), wingMat);
    wing.scale.set(0.32, 0.85, 1.55);
    wing.position.set(s * 0.32, 1.26, -0.34);
    wing.rotation.y = s * 0.55;
    wing.rotation.x = 0.45;
    bee.add(wing);

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.3, 6, 8), blackMat);
    arm.position.set(s * 0.39, 1.0, 0.22);
    arm.rotation.x = Math.PI * 0.38;
    arm.rotation.z = s * -0.18;
    bee.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), yellowMat);
    hand.position.set(s * 0.36, 0.98, 0.46);
    bee.add(hand);
  }

  // Round Bee Head + Expressive Big Eyes + Antenna Feelers
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), yellowMat);
  head.position.set(0, 1.58, 0.06);
  head.castShadow = true;
  bee.add(head);

  const cheekCap = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 12), blackMat);
  cheekCap.scale.set(0.98, 0.72, 0.78);
  cheekCap.position.set(0, 1.66, -0.04);
  bee.add(cheekCap);

  for (const s of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), whiteMat);
    sclera.scale.set(0.95, 1.18, 0.65);
    sclera.position.set(s * 0.13, 1.61, 0.32);
    bee.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), eyeDark);
    pupil.position.set(s * 0.13, 1.61, 0.39);
    bee.add(pupil);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.24, 6), blackMat);
    stalk.position.set(s * 0.14, 1.98, 0.1);
    stalk.rotation.z = -s * 0.36;
    stalk.rotation.x = 0.24;
    bee.add(stalk);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), yellowMat);
    tip.position.set(s * 0.2, 2.08, 0.14);
    bee.add(tip);
  }

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 6, 12, Math.PI), blackMat);
  smile.position.set(0, 1.46, 0.37);
  smile.rotation.z = Math.PI;
  bee.add(smile);

  return bee;
}

function buildDryBonesDriver(): THREE.Group {
  const db = new THREE.Group();

  const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.52 });
  const shellBoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.48 });
  const slateRimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.46 });
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
  const glowEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45 });

  // Skeletal Torso & Cracked Bone Koopa Shell
  const ribTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.56, 12), boneMat);
  ribTorso.position.set(0, 0.92, 0.04);
  ribTorso.castShadow = true;
  db.add(ribTorso);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), shellBoneMat);
  shell.scale.set(0.95, 1.1, 0.78);
  shell.position.set(0, 0.95, -0.2);
  shell.castShadow = true;
  db.add(shell);

  const shellRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.068, 8, 18), slateRimMat);
  shellRim.position.set(0, 0.95, -0.11);
  db.add(shellRim);

  // Bony Arms & Slate-Gloved Claws
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 6, 8), boneMat);
    arm.position.set(s * 0.37, 1.0, 0.23);
    arm.rotation.x = Math.PI * 0.38;
    arm.rotation.z = s * -0.15;
    db.add(arm);

    const claw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), gloveMat);
    claw.position.set(s * 0.34, 0.98, 0.47);
    db.add(claw);
  }

  // Dry Bones Skull + Protruding Snout + Glowing Yellow Pupils
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), boneMat);
  skull.position.set(0, 1.6, 0.03);
  skull.castShadow = true;
  db.add(skull);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), boneMat);
  snout.scale.set(1.06, 0.78, 1.18);
  snout.position.set(0, 1.5, 0.28);
  db.add(snout);

  const jawBand = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.2), socketMat);
  jawBand.position.set(0, 1.44, 0.29);
  db.add(jawBand);

  for (const s of [-1, 1]) {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), socketMat);
    socket.scale.set(0.95, 1.12, 0.65);
    socket.position.set(s * 0.12, 1.65, 0.27);
    db.add(socket);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.044, 8, 8), glowEyeMat);
    pupil.position.set(s * 0.12, 1.65, 0.33);
    db.add(pupil);

    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), socketMat);
    nostril.position.set(s * 0.075, 1.54, 0.51);
    db.add(nostril);
  }

  return db;
}

function buildKoopaStyleDriver(variant: 'koopa_troopa' | 'lakitu' | 'hammer_bro' | 'chargin_chuck'): THREE.Group {
  const k = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: variant === 'hammer_bro' || variant === 'chargin_chuck' ? 0x22c55e : 0xfacc15,
    roughness: 0.48,
  });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.55 });
  const shellColor =
    variant === 'lakitu' ? 0xfacc15 : variant === 'chargin_chuck' ? 0x7e22ce : 0x16a34a;
  const shellMat = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.36 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });

  // Shell + Belly
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), shellMat);
  shell.scale.set(0.95, 1.05, 0.92);
  shell.position.set(0, 0.95, -0.14);
  shell.castShadow = true;
  k.add(shell);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 18), whiteMat);
  rim.rotation.y = Math.PI / 2;
  rim.position.set(0, 0.95, -0.04);
  k.add(rim);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.58, 0.34), bellyMat);
  belly.position.set(0, 0.9, 0.04);
  k.add(belly);

  // Arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 6, 8), skinMat);
    arm.position.set(s * 0.38, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.35;
    k.add(arm);
  }

  // Head + Snout
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  head.position.set(0, 1.56, 0.12);
  head.castShadow = true;
  k.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), skinMat);
  snout.scale.set(1.1, 0.8, 1.1);
  snout.position.set(0, 1.48, 0.34);
  k.add(snout);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), whiteMat);
    eye.position.set(s * 0.12, 1.62, 0.34);
    k.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMat);
    pup.position.set(s * 0.12, 1.62, 0.41);
    k.add(pup);
  }

  if (variant === 'lakitu') {
    // Goggles + Antenna Hair
    for (const s of [-1, 1]) {
      const goggleRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 14), darkMat);
      goggleRim.position.set(s * 0.13, 1.62, 0.39);
      k.add(goggleRim);
    }
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 8), darkMat);
    tuft.position.set(0, 1.92, 0.08);
    k.add(tuft);
  } else if (variant === 'hammer_bro') {
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      shellMat,
    );
    helmet.position.set(0, 1.63, 0.1);
    k.add(helmet);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16), whiteMat);
    band.position.set(0, 1.64, 0.1);
    k.add(band);
  } else if (variant === 'chargin_chuck') {
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.28, metalness: 0.3 });
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      helmetMat,
    );
    helmet.position.set(0, 1.62, 0.1);
    k.add(helmet);
    const facemask = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.14), whiteMat);
    facemask.position.set(0, 1.48, 0.45);
    k.add(facemask);
    for (const s of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.42), helmetMat);
      pad.position.set(s * 0.42, 1.18, 0.02);
      k.add(pad);
    }
  }

  return k;
}

function buildBirdoDriver(): THREE.Group {
  const b = new THREE.Group();
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.45 });
  const bowMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), pinkMat);
  torso.scale.set(0.95, 1.1, 0.9);
  torso.position.set(0, 0.92, -0.04);
  torso.castShadow = true;
  b.add(torso);

  const ring = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), whiteMat);
  ring.position.set(0, 1.48, 0.24);
  b.add(ring);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), pinkMat);
  head.position.set(0, 1.56, 0.08);
  head.castShadow = true;
  b.add(head);

  // Iconic tubular snout
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.36, 14), pinkMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 1.5, 0.4);
  b.add(snout);
  const snoutHole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12), darkMat);
  snoutHole.rotation.x = Math.PI / 2;
  snoutHole.position.set(0, 1.5, 0.58);
  b.add(snoutHole);

  // Big Red Bow on Head
  for (const s of [-1, 1]) {
    const bowWing = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 10), bowMat);
    bowWing.rotation.z = s * Math.PI * 0.45;
    bowWing.position.set(s * 0.18, 1.9, 0.04);
    b.add(bowWing);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 6, 8), pinkMat);
    arm.position.set(s * 0.38, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.35;
    b.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), whiteMat);
    eye.position.set(s * 0.14, 1.66, 0.34);
    b.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMat);
    pup.position.set(s * 0.14, 1.66, 0.4);
    b.add(pup);
  }
  return b;
}

function buildNabbitDriver(): THREE.Group {
  const n = new THREE.Group();
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.5 });
  const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.4, 8, 12), purpleMat);
  torso.position.set(0, 0.92, -0.04);
  torso.castShadow = true;
  n.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), purpleMat);
  head.position.set(0, 1.54, 0.08);
  head.castShadow = true;
  n.add(head);

  const bandana = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.34, 0.24, 14), bandanaMat);
  bandana.position.set(0, 1.44, 0.12);
  n.add(bandana);

  // Grin teeth lines
  const grin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), darkMat);
  grin.position.set(0, 1.44, 0.42);
  n.add(grin);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 6, 8), purpleMat);
    ear.position.set(s * 0.14, 1.98, 0.02);
    ear.rotation.z = s * -0.15;
    n.add(ear);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 6, 8), purpleMat);
    arm.position.set(s * 0.36, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.35;
    n.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), darkMat);
    eye.position.set(s * 0.12, 1.62, 0.36);
    n.add(eye);
  }
  return n;
}

function buildPiranhaPlantDriver(): THREE.Group {
  const p = new THREE.Group();
  const potMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.42 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5 });

  // Warp-pipe pot base + stem
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.58, 16), potMat);
  pot.position.set(0, 0.85, -0.04);
  pot.castShadow = true;
  p.add(pot);

  const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.16, 16), potMat);
  potRim.position.set(0, 1.14, -0.04);
  p.add(potRim);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.42, 10), stemMat);
  stem.position.set(0, 1.38, 0.02);
  p.add(stem);

  // Leaf arms
  for (const s of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), stemMat);
    leaf.scale.set(1.3, 0.35, 0.9);
    leaf.position.set(s * 0.34, 1.24, 0.2);
    leaf.rotation.z = s * 0.3;
    p.add(leaf);
  }

  // Spotted red head + white lips
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), redMat);
  head.position.set(0, 1.72, 0.12);
  head.castShadow = true;
  p.add(head);

  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 8, 16), whiteMat);
  lip.position.set(0, 1.68, 0.42);
  p.add(lip);

  for (const [sx, sy, sz] of [
    [-0.22, 1.9, 0.05],
    [0.24, 1.88, 0.06],
    [0, 2.04, 0.08],
    [-0.28, 1.68, -0.06],
    [0.28, 1.7, -0.06],
  ]) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), whiteMat);
    spot.position.set(sx, sy, sz);
    p.add(spot);
  }
  return p;
}

function buildSpikeDriver(): THREE.Group {
  const sp = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.55 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12), greenMat);
  torso.scale.set(1.02, 0.95, 0.95);
  torso.position.set(0, 0.92, -0.04);
  sp.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bellyMat);
  belly.position.set(0, 0.9, 0.14);
  sp.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), greenMat);
  head.position.set(0, 1.54, 0.1);
  head.castShadow = true;
  sp.add(head);

  // Blue hair tuft & big lips
  const hair = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 10), hairMat);
  hair.position.set(0, 1.94, 0.06);
  sp.add(hair);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 8, 14), bellyMat);
  mouth.position.set(0, 1.44, 0.42);
  sp.add(mouth);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 6, 8), greenMat);
    arm.position.set(s * 0.4, 1.0, 0.25);
    arm.rotation.x = Math.PI * 0.35;
    sp.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), whiteMat);
    eye.position.set(s * 0.14, 1.62, 0.38);
    sp.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMat);
    pup.position.set(s * 0.14, 1.62, 0.44);
    sp.add(pup);
  }
  return sp;
}

function buildWigglerDriver(): THREE.Group {
  const w = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.48 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Segmented caterpillar torso + trailing rear segment
  const seg1 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), yellowMat);
  seg1.position.set(0, 0.88, 0);
  seg1.castShadow = true;
  w.add(seg1);

  const seg2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), yellowMat);
  seg2.position.set(0, 0.84, -0.46);
  w.add(seg2);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), yellowMat);
  head.position.set(0, 1.5, 0.1);
  head.castShadow = true;
  w.add(head);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), noseMat);
  nose.position.set(0, 1.46, 0.44);
  w.add(nose);

  // Flower on head!
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
  stem.position.set(0, 1.92, 0.08);
  w.add(stem);
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), yellowMat);
  center.position.set(0, 2.04, 0.08);
  w.add(center);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), whiteMat);
    petal.position.set(Math.cos(a) * 0.11, 2.04, 0.08 + Math.sin(a) * 0.11);
    w.add(petal);
  }

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 6, 8), yellowMat);
    arm.position.set(s * 0.36, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.35;
    w.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), darkMat);
    eye.position.set(s * 0.15, 1.56, 0.38);
    w.add(eye);
  }
  return w;
}

function buildSidestepperDriver(): THREE.Group {
  const c = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.42 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), redMat);
  body.scale.set(1.28, 0.78, 0.92);
  body.position.set(0, 1.15, 0.02);
  body.castShadow = true;
  c.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), creamMat);
  belly.scale.set(1.2, 0.7, 0.6);
  belly.position.set(0, 1.08, 0.28);
  c.add(belly);

  for (const s of [-1, 1]) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.28, 8), redMat);
    stalk.position.set(s * 0.2, 1.58, 0.16);
    c.add(stalk);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), whiteMat);
    eye.position.set(s * 0.2, 1.72, 0.16);
    c.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), darkMat);
    pup.position.set(s * 0.2, 1.72, 0.24);
    c.add(pup);

    // Crab claws holding wheel
    const claw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), redMat);
    claw.scale.set(1.0, 0.85, 1.35);
    claw.position.set(s * 0.46, 1.05, 0.42);
    c.add(claw);
  }
  return c;
}

function buildCataquackDriver(): THREE.Group {
  const cq = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
  const billMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), blueMat);
  body.scale.set(1.05, 1.18, 0.95);
  body.position.set(0, 1.18, 0);
  body.castShadow = true;
  cq.add(body);

  // Leaf crest
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
  crest.position.set(0, 1.82, 0);
  cq.add(crest);

  // Duckbill scoop
  const bill = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.45), billMat);
  bill.position.set(0, 1.24, 0.46);
  bill.rotation.x = 0.12;
  cq.add(bill);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), whiteMat);
    eye.position.set(s * 0.16, 1.44, 0.38);
    cq.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), darkMat);
    pup.position.set(s * 0.16, 1.44, 0.45);
    cq.add(pup);
  }
  return cq;
}

function buildMoleDriver(isRocky: boolean): THREE.Group {
  const m = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: isRocky ? 0x57534e : 0x92400e, roughness: 0.65 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.45 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), furMat);
  torso.position.set(0, 0.95, -0.04);
  torso.castShadow = true;
  m.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), bellyMat);
  belly.position.set(0, 0.95, 0.14);
  m.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), furMat);
  head.position.set(0, 1.5, 0.08);
  head.castShadow = true;
  m.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), bellyMat);
  snout.scale.set(1.1, 0.85, 1.0);
  snout.position.set(0, 1.45, 0.34);
  m.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), noseMat);
  nose.position.set(0, 1.5, 0.48);
  m.add(nose);

  if (isRocky) {
    // Goggles + Helmet for Rocky Wrench
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.37, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 }),
    );
    cap.position.set(0, 1.56, 0.06);
    m.add(cap);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.14, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2 }),
    );
    visor.position.set(0, 1.56, 0.36);
    m.add(visor);
  } else {
    // Cool Monty shades
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.14), darkMat);
    shades.position.set(0, 1.58, 0.36);
    m.add(shades);
  }

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 6, 8), furMat);
    arm.position.set(s * 0.38, 1.0, 0.26);
    arm.rotation.x = Math.PI * 0.35;
    m.add(arm);
  }
  return m;
}

function buildPiantaDriver(): THREE.Group {
  const pi = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.48 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.65 });
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.45 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 14), skinMat);
  body.scale.set(1.12, 1.08, 1.0);
  body.position.set(0, 0.98, -0.04);
  body.castShadow = true;
  pi.add(body);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.54, 0.24, 14), skirtMat);
  skirt.position.set(0, 0.68, -0.04);
  pi.add(skirt);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 14), skinMat);
  head.position.set(0, 1.56, 0.08);
  head.castShadow = true;
  pi.add(head);

  const bigNose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), noseMat);
  bigNose.position.set(0, 1.5, 0.42);
  pi.add(bigNose);

  // Palm-tree topknot
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x92400e }));
  trunk.position.set(0, 1.98, 0.06);
  pi.add(trunk);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 6), palmMat);
    frond.position.set(Math.cos(a) * 0.16, 2.1, 0.06 + Math.sin(a) * 0.16);
    frond.rotation.z = -Math.cos(a) * 1.1;
    frond.rotation.x = Math.sin(a) * 1.1;
    pi.add(frond);
  }

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 8), skinMat);
    arm.position.set(s * 0.46, 1.04, 0.24);
    arm.rotation.x = Math.PI * 0.35;
    pi.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), whiteMat);
    eye.position.set(s * 0.14, 1.62, 0.36);
    pi.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), darkMat);
    pup.position.set(s * 0.14, 1.62, 0.42);
    pi.add(pup);
  }
  return pi;
}

function buildSwoopDriver(): THREE.Group {
  const sw = new THREE.Group();
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.5 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.48 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), bodyMat);
  body.scale.set(1.0, 1.2, 0.9);
  body.position.set(0, 1.18, 0.04);
  body.castShadow = true;
  sw.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), noseMat);
  nose.scale.set(1.3, 0.85, 0.9);
  nose.position.set(0, 1.24, 0.38);
  sw.add(nose);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), bodyMat);
    ear.position.set(s * 0.22, 1.72, 0.02);
    ear.rotation.z = s * -0.25;
    sw.add(ear);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.08), wingMat);
    wing.position.set(s * 0.54, 1.14, -0.06);
    wing.rotation.z = s * 0.28;
    wing.rotation.y = s * -0.35;
    sw.add(wing);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), whiteMat);
    eye.position.set(s * 0.14, 1.38, 0.32);
    sw.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMat);
    pup.position.set(s * 0.14, 1.38, 0.38);
    sw.add(pup);
  }
  return sw;
}

function buildPokeyDriver(): THREE.Group {
  const pk = new THREE.Group();
  const segMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const spineMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.32 - i * 0.02, 14, 12), segMat);
    seg.position.set(0, 0.85 + i * 0.44, 0.02 + i * 0.03);
    seg.castShadow = true;
    pk.add(seg);
    for (const ang of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 6), spineMat);
      spike.position.set(
        Math.cos(ang) * 0.3,
        0.85 + i * 0.44,
        0.02 + i * 0.03 + Math.sin(ang) * 0.3,
      );
      spike.rotation.z = -Math.cos(ang) * (Math.PI / 2);
      spike.rotation.x = Math.sin(ang) * (Math.PI / 2);
      pk.add(spike);
    }
  }
  const flower = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
  flower.position.set(0, 2.08, 0.08);
  pk.add(flower);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), darkMat);
    eye.position.set(s * 0.11, 1.78, 0.34);
    pk.add(eye);
  }
  return pk;
}

function buildCoinCofferDriver(): THREE.Group {
  const cc = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5 });
  const claspMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.78 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), greenMat);
  body.scale.set(1.12, 1.02, 0.96);
  body.position.set(0, 1.12, 0);
  body.castShadow = true;
  cc.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bellyMat);
  belly.position.set(0, 1.02, 0.2);
  cc.add(belly);

  // Golden purse clasps atop head
  for (const s of [-1, 1]) {
    const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), claspMat);
    clasp.position.set(s * 0.1, 1.66, 0.04);
    cc.add(clasp);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.3, 6, 8), greenMat);
    arm.position.set(s * 0.42, 1.02, 0.28);
    arm.rotation.x = Math.PI * 0.35;
    cc.add(arm);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), whiteMat);
    eye.position.set(s * 0.14, 1.32, 0.38);
    cc.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), darkMat);
    pup.position.set(s * 0.14, 1.32, 0.44);
    cc.add(pup);
  }
  return cc;
}

function buildSnowmanDriver(): THREE.Group {
  const sm = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 14), snowMat);
  body.position.set(0, 0.96, -0.02);
  body.castShadow = true;
  sm.add(body);

  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.075, 8, 16), scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 1.32, 0.04);
  sm.add(scarf);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), snowMat);
  head.position.set(0, 1.56, 0.06);
  head.castShadow = true;
  sm.add(head);

  const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.32, 10), carrotMat);
  carrot.rotation.x = Math.PI / 2;
  carrot.position.set(0, 1.54, 0.48);
  sm.add(carrot);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 14), hatMat);
  brim.position.set(0, 1.84, 0.06);
  sm.add(brim);
  const topHat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 14), hatMat);
  topHat.position.set(0, 2.0, 0.06);
  sm.add(topHat);

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), hatMat);
    eye.position.set(s * 0.12, 1.63, 0.36);
    sm.add(eye);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 6), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    arm.position.set(s * 0.4, 1.04, 0.26);
    arm.rotation.x = Math.PI * 0.38;
    sm.add(arm);
  }
  return sm;
}

function buildDolphinDriver(): THREE.Group {
  const dl = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.1 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.65, 8, 14), blueMat);
  body.position.set(0, 1.18, 0.02);
  body.rotation.x = 0.22;
  body.castShadow = true;
  dl.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), bellyMat);
  belly.scale.set(0.95, 1.3, 0.6);
  belly.position.set(0, 1.1, 0.18);
  dl.add(belly);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 12), blueMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.54, 0.38);
  dl.add(beak);

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 8), blueMat);
  dorsal.position.set(0, 1.48, -0.24);
  dorsal.rotation.x = -0.5;
  dl.add(dorsal);

  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.18), blueMat);
    fin.position.set(s * 0.34, 1.05, 0.2);
    fin.rotation.z = s * -0.45;
    dl.add(fin);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), darkMat);
    eye.position.set(s * 0.18, 1.62, 0.26);
    dl.add(eye);
  }
  return dl;
}

function buildParaBiddybudDriver(): THREE.Group {
  const pb = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), redMat);
  shell.scale.set(1.05, 0.95, 1.1);
  shell.position.set(0, 1.12, 0.02);
  shell.castShadow = true;
  pb.add(shell);

  for (const [sx, sy, sz] of [
    [-0.18, 1.38, -0.05],
    [0.18, 1.38, -0.05],
    [0, 1.44, -0.2],
  ]) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkMat);
    spot.position.set(sx, sy, sz);
    pb.add(spot);
  }

  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), whiteMat);
    wing.scale.set(1.2, 0.2, 0.7);
    wing.position.set(s * 0.46, 1.34, -0.14);
    wing.rotation.z = s * 0.35;
    pb.add(wing);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), whiteMat);
    eye.position.set(s * 0.16, 1.24, 0.36);
    pb.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), darkMat);
    pup.position.set(s * 0.16, 1.24, 0.45);
    pb.add(pup);
  }
  return pb;
}

function buildHumanDriver(
  pal: HumanDriverPalette,
  style: 'cap' | 'helmet' | 'aviator' | 'visor',
): THREE.Group {
  const driver = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({ color: pal.suit, roughness: 0.48, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.35, metalness: 0.25 });
  const visorMat = new THREE.MeshStandardMaterial({ color: pal.visor, roughness: 0.14, metalness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: pal.skinTone, roughness: 0.56 });
  const hairMat = new THREE.MeshStandardMaterial({ color: pal.hairColor, roughness: 0.72 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Racing Suit Torso & Center Stripe
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.68, 0.48), suitMat);
  torso.position.set(0, 0.92, -0.06);
  torso.castShadow = true;
  driver.add(torso);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.69, 0.5), accentMat);
  stripe.position.set(0, 0.92, -0.06);
  driver.add(stripe);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.14, 12), accentMat);
  collar.position.set(0, 1.3, -0.02);
  driver.add(collar);

  // Arms & Gloved Hands
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 8), suitMat);
    arm.position.set(s * 0.42, 1.02, 0.28);
    arm.rotation.x = Math.PI * 0.36;
    arm.rotation.z = s * -0.2;
    driver.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), gloveMat);
    glove.position.set(s * 0.28, 1.02, 0.56);
    driver.add(glove);
  }

  // Human Neck & Head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.2, 10), skinMat);
  neck.position.set(0, 1.38, 0.02);
  driver.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), skinMat);
  head.scale.set(0.95, 1.05, 0.98);
  head.position.set(0, 1.64, 0.08);
  head.castShadow = true;
  driver.add(head);

  // Subtle nose & ears
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
  nose.position.set(0, 1.62, 0.39);
  driver.add(nose);

  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), skinMat);
    ear.scale.set(0.55, 1, 0.8);
    ear.position.set(s * 0.31, 1.64, 0.06);
    driver.add(ear);
  }

  if (style === 'helmet') {
    // Open-face Grand Prix Crash Helmet + Tinted Visor
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.37, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.68),
      suitMat,
    );
    shell.position.set(0, 1.67, 0.06);
    shell.rotation.x = -0.15;
    shell.castShadow = true;
    driver.add(shell);

    const helmetStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.68), accentMat);
    helmetStripe.position.set(0, 1.94, 0.05);
    driver.add(helmetStripe);

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.18, 16, 1, true, -Math.PI * 0.36, Math.PI * 0.72), visorMat);
    shield.position.set(0, 1.69, 0.09);
    driver.add(shield);
  } else if (style === 'cap') {
    // Hair Back + Racing Baseball Cap + Sport Sunglasses
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 10), hairMat);
    hair.position.set(0, 1.65, -0.02);
    driver.add(hair);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      suitMat,
    );
    cap.position.set(0, 1.72, 0.07);
    cap.castShadow = true;
    driver.add(cap);

    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.34, 0.05, 14, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
      accentMat,
    );
    brim.position.set(0, 1.75, 0.24);
    brim.rotation.x = 0.12;
    driver.add(brim);

    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.13, 0.14), visorMat);
    shades.position.set(0, 1.68, 0.34);
    driver.add(shades);
  } else if (style === 'aviator') {
    // Swept Hair + Pilot Goggles
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), hairMat);
    hair.scale.set(1.0, 0.9, 1.1);
    hair.position.set(0, 1.78, 0.02);
    hair.castShadow = true;
    driver.add(hair);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), hairMat);
    crest.position.set(0, 1.94, 0.14);
    crest.rotation.x = -0.2;
    driver.add(crest);

    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.16), visorMat);
    shades.position.set(0, 1.68, 0.34);
    driver.add(shades);
  } else {
    // 'visor': Ponytail Hair + Racing Headband + Glowing Cyber-Visor
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), hairMat);
    hair.position.set(0, 1.72, 0.02);
    driver.add(hair);

    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.46, 10), hairMat);
    ponytail.position.set(0, 1.62, -0.34);
    ponytail.rotation.x = -Math.PI * 0.35;
    driver.add(ponytail);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 16), suitMat);
    band.position.set(0, 1.78, 0.07);
    driver.add(band);

    const cyberVisor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.16), visorMat);
    cyberVisor.position.set(0, 1.68, 0.34);
    driver.add(cyberVisor);
  }

  // Visible Eyes when visor doesn't fully cover
  if (style === 'cap') {
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeDark);
      eye.position.set(s * 0.11, 1.67, 0.39);
      driver.add(eye);
    }
  }

  return driver;
}

const HUMAN_SKIN_TONES = [0xf2c7a5, 0xe0ac69, 0xc68642, 0xf6d4be, 0x8d5524];
const HUMAN_HAIR_COLORS = [0x1e1b18, 0x4a2c18, 0xd97706, 0x0f172a, 0x7c2d12];

function buildDriverForCharacter(
  charId: CharacterId,
  profile: RacerProfile,
  textures: WorldTextures,
): THREE.Group {
  if (charId === 'bingbong') {
    return buildBingBongDinoDriver(textures.playerEmblem);
  }

  // Varied generic human GP drivers only for extra fallback CPU names (e.g. Chris, Sam)
  if (!profile.isPlayer && profile.id >= 14) {
    const styles: Array<'cap' | 'helmet' | 'aviator' | 'visor'> = ['cap', 'helmet', 'aviator', 'visor'];
    const pal: HumanDriverPalette = {
      suit: profile.driverColor,
      accent: profile.trimColor,
      visor: profile.visorColor,
      skinTone: HUMAN_SKIN_TONES[profile.id % HUMAN_SKIN_TONES.length],
      hairColor: HUMAN_HAIR_COLORS[(profile.id * 2) % HUMAN_HAIR_COLORS.length],
    };
    return buildHumanDriver(pal, styles[profile.id % styles.length]);
  }

  switch (charId) {
    case 'waluigi':
      return buildWaluigiDriver();
    case 'mario':
      return buildMarioBrosStyleDriver('mario');
    case 'luigi':
      return buildMarioBrosStyleDriver('luigi');
    case 'wario':
      return buildMarioBrosStyleDriver('wario');
    case 'black_panther':
      return buildBlackPantherDriver();
    case 'iron_man':
      return buildIronManDriver();
    case 'bung':
      return buildBungDriver();
    case 'yoshi':
      return buildYoshiDriver();
    case 'toad':
      return buildToadStyleDriver('toad');
    case 'toadette':
      return buildToadStyleDriver('toadette');
    case 'goomba':
      return buildGoombaDriver();
    case 'peepa':
      return buildPeepaDriver();
    case 'king_boo':
      return buildKingBooDriver();
    case 'shy_guy':
      return buildShyGuyDriver();
    case 'conkdor':
      return buildConkdorDriver();
    case 'bowser':
      return buildBowserDriver();
    case 'bowser_jr':
      return buildBowserJrDriver();
    case 'cheep_cheep':
      return buildCheepCheepDriver();
    case 'fish_bone':
      return buildFishBoneDriver();
    case 'villager_boy':
      return buildVillagerDriver('boy');
    case 'villager_girl':
      return buildVillagerDriver('girl');
    case 'peach':
      return buildPrincessDriver('peach');
    case 'daisy':
      return buildPrincessDriver('daisy');
    case 'rosalina':
      return buildPrincessDriver('rosalina');
    case 'pauline':
      return buildPaulineDriver();
    case 'baby_peach':
      return buildPrincessDriver('baby_peach');
    case 'baby_daisy':
      return buildPrincessDriver('baby_daisy');
    case 'baby_rosalina':
      return buildPrincessDriver('baby_rosalina');
    case 'inkling_boy':
      return buildInklingDriver('boy');
    case 'inkling_girl':
      return buildInklingDriver('girl');
    case 'donkey_kong':
      return buildDonkeyKongDriver();
    case 'bully_cullibug':
      return buildBullyCullibugDriver();
    case 'cow':
      return buildCowDriver();
    case 'penguin':
      return buildPenguinDriver();
    case 'stingby':
      return buildStingbyDriver();
    case 'dry_bones':
      return buildDryBonesDriver();
    case 'koopa_troopa':
      return buildKoopaStyleDriver('koopa_troopa');
    case 'lakitu':
      return buildKoopaStyleDriver('lakitu');
    case 'birdo':
      return buildBirdoDriver();
    case 'nabbit':
      return buildNabbitDriver();
    case 'piranha_plant':
      return buildPiranhaPlantDriver();
    case 'spike':
      return buildSpikeDriver();
    case 'wiggler':
      return buildWigglerDriver();
    case 'hammer_bro':
      return buildKoopaStyleDriver('hammer_bro');
    case 'sidestepper':
      return buildSidestepperDriver();
    case 'cataquack':
      return buildCataquackDriver();
    case 'monty_mole':
      return buildMoleDriver(false);
    case 'pianta':
      return buildPiantaDriver();
    case 'rocky_wrench':
      return buildMoleDriver(true);
    case 'swoop':
      return buildSwoopDriver();
    case 'pokey':
      return buildPokeyDriver();
    case 'coin_coffer':
      return buildCoinCofferDriver();
    case 'snowman':
      return buildSnowmanDriver();
    case 'dolphin':
      return buildDolphinDriver();
    case 'para_biddybud':
      return buildParaBiddybudDriver();
    case 'chargin_chuck':
      return buildKoopaStyleDriver('chargin_chuck');
    default: {
      const charSpec = getCharacterSpec(charId);
      const pal: HumanDriverPalette = {
        suit: parseInt(charSpec.hexPrimary.replace('#', ''), 16),
        accent: parseInt(charSpec.hexAccent.replace('#', ''), 16),
        visor: 0x0f172a,
        skinTone: HUMAN_SKIN_TONES[0],
        hairColor: HUMAN_HAIR_COLORS[0],
      };
      return buildHumanDriver(pal, 'helmet');
    }
  }
}

export function createKartModel(
  profile: RacerProfile,
  textures: WorldTextures,
  carIdOverride?: CarId,
  characterIdOverride?: CharacterId,
): KartRig {
  const carId = carIdOverride ?? profile.carId;
  const charId = characterIdOverride ?? profile.characterId;
  const carSpec = getCarSpec(carId);
  const bodyColorHex = profile.isPlayer ? carSpec.bodyColor : profile.kartColor;
  const trimColorHex = profile.isPlayer ? carSpec.trimColor : profile.trimColor;

  const root = new THREE.Group();
  const kartBodyGroup = new THREE.Group();
  root.add(kartBodyGroup);

  const paintMaterials: THREE.MeshStandardMaterial[] = [];
  const baseColors: THREE.Color[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColorHex,
    roughness: carId === 'roadster_royale' || carId === 'bowser_bruiser' ? 0.16 : 0.25,
    metalness: carId === 'roadster_royale' || carId === 'bowser_bruiser' ? 0.72 : 0.38,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColorHex,
    roughness: 0.28,
    metalness: 0.45,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.16,
    metalness: 0.92,
  });
  const darkSeatMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.1,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
    metalness: 0.05,
  });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });

  paintMaterials.push(bodyMat, trimMat);
  baseColors.push(bodyMat.color.clone(), trimMat.color.clone());

  // 1. Contact Shadow Plane (elevated slightly above finish line & boost pads to avoid z-fighting)
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(carSpec.category === 'bike' ? 2.4 : 3.6, 4.6),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      opacity: 0.48,
    }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.07;
  root.add(shadowPlane);

  const isBike = carSpec.category === 'bike';
  const isAtv = carSpec.category === 'atv';
  const isHeavy = carSpec.category === 'heavy';
  const isSpecial = carSpec.category === 'special';

  // 2. Car-Specific Chassis & Aero Silhouettes across all 40 Mario Kart World Vehicles
  if (isBike) {
    // Sleek Two-Wheel Motorbike Frame + Fuel Tank + Handlebars + Swingarm
    const frameSpine = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 2.75), bodyMat);
    frameSpine.position.set(0, 0.72, 0);
    frameSpine.castShadow = true;
    kartBodyGroup.add(frameSpine);

    const cowl = new THREE.Mesh(
      carId === 'mach_rocket' || carId === 'dolphin_dasher'
        ? new THREE.ConeGeometry(0.54, 1.65, 12)
        : new THREE.BoxGeometry(0.78, 0.56, 1.25),
      bodyMat,
    );
    if (carId === 'mach_rocket' || carId === 'dolphin_dasher') {
      cowl.rotation.x = Math.PI / 2;
      cowl.position.set(0, 0.92, 1.12);
    } else {
      cowl.position.set(0, 0.96, 0.95);
      cowl.rotation.x = 0.16;
    }
    cowl.castShadow = true;
    kartBodyGroup.add(cowl);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.1), headlightMat);
    windshield.position.set(0, 1.22, 1.15);
    windshield.rotation.x = -0.5;
    kartBodyGroup.add(windshield);

    const handleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, carId === 'w_twin_chopper' ? 1.55 : 1.18, 8),
      chromeMat,
    );
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.12, 0.74);
    kartBodyGroup.add(handleBar);

    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.05, 8), trimMat);
    fork.position.set(0, 0.8, 1.1);
    fork.rotation.x = -0.35;
    kartBodyGroup.add(fork);

    if (carId === 'tune_thumper') {
      for (const sx of [-0.52, 0.52]) {
        const speaker = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), trimMat);
        speaker.rotation.z = Math.PI / 2;
        speaker.position.set(sx, 0.85, -0.95);
        kartBodyGroup.add(speaker);
      }
    }
  } else if (isHeavy) {
    // Armored Trucks, Dozers & Bowser Bruiser
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.68, 3.25), bodyMat);
    cab.position.set(0, 0.82, 0);
    cab.castShadow = true;
    kartBodyGroup.add(cab);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.44, 1.15), trimMat);
    hood.position.set(0, 0.92, 1.32);
    hood.castShadow = true;
    kartBodyGroup.add(hood);

    const ramBumper = new THREE.Mesh(
      new THREE.BoxGeometry(carId === 'billdozer' ? 2.65 : 2.35, 0.42, 0.46),
      carId === 'bowser_bruiser' ? trimMat : chromeMat,
    );
    ramBumper.position.set(0, 0.52, 1.92);
    ramBumper.castShadow = true;
    kartBodyGroup.add(ramBumper);

    if (carId === 'bowser_bruiser') {
      for (const sx of [-0.85, 0, 0.85]) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 8), trimMat);
        spike.rotation.x = Math.PI / 2;
        spike.position.set(sx, 0.6, 2.2);
        kartBodyGroup.add(spike);
      }
    } else if (carId === 'lil_dumpy') {
      const dumpBed = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.52, 1.2), trimMat);
      dumpBed.position.set(0, 1.1, -1.15);
      kartBodyGroup.add(dumpBed);
    }
  } else if (isAtv) {
    // Rugged ATVs, Roll-Cage Buggies & Trikes
    const tub = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.48, 3.05), bodyMat);
    tub.position.set(0, 0.72, 0);
    tub.castShadow = true;
    kartBodyGroup.add(tub);

    const noseCowl = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.34, 1.05), trimMat);
    noseCowl.position.set(0, 0.82, 1.25);
    noseCowl.rotation.x = 0.14;
    kartBodyGroup.add(noseCowl);

    if (carId === 'zoom_buggy' || carId === 'tiny_titan') {
      const cageGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.65, 8);
      for (const sx of [-0.72, 0.72]) {
        const bar = new THREE.Mesh(cageGeo, trimMat);
        bar.position.set(sx, 1.38, 0.48);
        bar.rotation.x = -0.35;
        kartBodyGroup.add(bar);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 0.5), trimMat);
      roof.position.set(0, 2.1, -0.05);
      kartBodyGroup.add(roof);
    }

    if (carId === 'big_horn') {
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 10), trimMat);
        horn.rotation.z = sx * -Math.PI * 0.42;
        horn.position.set(sx * 0.95, 1.02, 1.68);
        kartBodyGroup.add(horn);
      }
    }
  } else if (isSpecial) {
    // Special Fantasy Vehicles (Dorrie, Sleds, Carpet, Cloud 9, Blastronaut, Loco Moto, Reel Racer)
    if (carId === 'carpet_flyer') {
      const carpet = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.14, 3.5), bodyMat);
      carpet.position.set(0, 0.78, 0);
      carpet.castShadow = true;
      kartBodyGroup.add(carpet);
      const border = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.1, 3.62), trimMat);
      border.position.set(0, 0.74, 0);
      kartBodyGroup.add(border);
    } else if (carId === 'cloud_9') {
      for (const [cx, cy, cz, cr] of [
        [0, 0.72, 0, 0.85],
        [-0.78, 0.68, 0.5, 0.62],
        [0.78, 0.68, 0.5, 0.62],
        [-0.75, 0.72, -0.75, 0.65],
        [0.75, 0.72, -0.75, 0.65],
        [0, 0.72, 1.25, 0.64],
      ]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(cr, 12, 10), bodyMat);
        puff.scale.set(1.15, 0.72, 1.15);
        puff.position.set(cx, cy, cz);
        puff.castShadow = true;
        kartBodyGroup.add(puff);
      }
    } else if (carId === 'blastronaut_3') {
      const shuttle = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.6, 14), bodyMat);
      shuttle.rotation.x = Math.PI / 2;
      shuttle.position.set(0, 0.76, 0.25);
      shuttle.castShadow = true;
      kartBodyGroup.add(shuttle);
      for (const sx of [-0.95, 0.95]) {
        const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 2.2, 12), trimMat);
        booster.rotation.x = Math.PI / 2;
        booster.position.set(sx, 0.64, -0.2);
        kartBodyGroup.add(booster);
      }
    } else if (carId === 'loco_moto') {
      const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.4, 14), bodyMat);
      boiler.rotation.x = Math.PI / 2;
      boiler.position.set(0, 0.88, 0.35);
      boiler.castShadow = true;
      kartBodyGroup.add(boiler);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.65, 12), trimMat);
      chimney.position.set(0, 1.54, 1.22);
      kartBodyGroup.add(chimney);
      const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.65, 4), chromeMat);
      cowcatcher.rotation.x = Math.PI / 2;
      cowcatcher.rotation.z = Math.PI / 4;
      cowcatcher.position.set(0, 0.44, 1.82);
      kartBodyGroup.add(cowcatcher);
    } else if (carId === 'funky_dorrie') {
      const hull = new THREE.Mesh(sharedHullGeo.clone(), bodyMat);
      hull.position.set(0, 0.72, 0);
      hull.castShadow = true;
      kartBodyGroup.add(hull);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.0, 10), bodyMat);
      neck.position.set(0, 1.18, 1.55);
      neck.rotation.x = 0.25;
      kartBodyGroup.add(neck);
      const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), bodyMat);
      dHead.position.set(0, 1.65, 1.72);
      kartBodyGroup.add(dHead);
      const shades = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.14), trimMat);
      shades.position.set(0, 1.72, 1.94);
      kartBodyGroup.add(shades);
    } else {
      // Dread Sled / Stellar Sled / Reel Racer
      const hull = new THREE.Mesh(sharedHullGeo.clone(), bodyMat);
      hull.scale.set(1.08, 0.96, 1.12);
      hull.position.set(0, 0.72, 0);
      hull.castShadow = true;
      kartBodyGroup.add(hull);

      for (const sx of [-0.95, 0.95]) {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 3.6), trimMat);
        runner.position.set(sx, 0.26, 0.05);
        kartBodyGroup.add(runner);
      }
    }
  } else {
    // Karts (Standard Kart, Rally Kart, Pipe Frame, Hyper Pipe, B Dasher, Roadster Royale, Hot Rod, Baby Blooper, etc.)
    const hull = new THREE.Mesh(sharedHullGeo.clone(), bodyMat);
    if (carId === 'b_dasher' || carId === 'roadster_royale') {
      hull.scale.set(1.06, 0.96, 1.15);
    } else if (carId === 'biddybuggy' || carId === 'baby_blooper') {
      hull.scale.set(0.95, 0.95, 0.94);
    }
    hull.position.set(0, 0.72, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    kartBodyGroup.add(hull);

    if (carId === 'pipe_frame' || carId === 'hyper_pipe') {
      for (const sx of [-0.88, 0.88]) {
        const pipeSide = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.85, 12), trimMat);
        pipeSide.rotation.x = Math.PI / 2;
        pipeSide.position.set(sx, 0.62, 0);
        kartBodyGroup.add(pipeSide);
      }
    } else {
      const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 0.56), trimMat);
      frontWing.position.set(0, 0.36, 1.75);
      frontWing.castShadow = true;
      kartBodyGroup.add(frontWing);
    }

    if (carId === 'hot_rod') {
      const blower = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.64), chromeMat);
      blower.position.set(0, 1.02, 1.15);
      kartBodyGroup.add(blower);
    }
  }

  // 4. Seat Bucket & Steering Wheel
  const seat = new THREE.Mesh(new THREE.BoxGeometry(isBike ? 0.58 : 0.95, 0.52, 0.85), darkSeatMat);
  seat.position.set(0, 0.78, -0.2);
  kartBodyGroup.add(seat);

  if (!isBike) {
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 8, 16), darkSeatMat);
    steeringWheel.position.set(0, 1.06, 0.66);
    steeringWheel.rotation.x = -0.45;
    kartBodyGroup.add(steeringWheel);
  }

  // 5. Rear Spoiler Wing (for non-bike / non-carpet / non-cloud chassis)
  if (!isBike && carId !== 'carpet_flyer' && carId !== 'cloud_9') {
    const spoilerWidth = isHeavy ? 2.38 : 2.14;
    const spoilerHeight = 1.38;
    const strutGeo = new THREE.BoxGeometry(0.12, spoilerHeight - 0.7, 0.32);
    for (const side of [-1, 1]) {
      const strut = new THREE.Mesh(strutGeo, chromeMat);
      strut.position.set(side * 0.52, 1.04, -1.42);
      strut.rotation.x = -0.18;
      kartBodyGroup.add(strut);
    }
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(spoilerWidth, 0.14, 0.54), trimMat);
    spoiler.position.set(0, spoilerHeight, -1.52);
    spoiler.rotation.x = 0.12;
    spoiler.castShadow = true;
    kartBodyGroup.add(spoiler);
  }

  // 6. Metallic Exhaust Pipes
  const pipeGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.65, 12);
  pipeGeo.rotateX(Math.PI / 2);
  const flameGeo = new THREE.ConeGeometry(0.18, 1.15, 10);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  const pipeOffset = isBike ? 0.24 : 0.46;
  const pipeL = new THREE.Mesh(pipeGeo, chromeMat);
  pipeL.position.set(-pipeOffset, 0.72, -1.78);
  const pipeR = new THREE.Mesh(pipeGeo, chromeMat);
  pipeR.position.set(pipeOffset, 0.72, -1.78);
  kartBodyGroup.add(pipeL, pipeR);
  if (carId === 'blastronaut_3' || carId === 'bowser_bruiser') {
    const pipeC = new THREE.Mesh(pipeGeo, chromeMat);
    pipeC.position.set(0, 0.78, -1.86);
    kartBodyGroup.add(pipeC);
  }

  const flameL = new THREE.Mesh(flameGeo, flameMat);
  flameL.position.set(-pipeOffset, 0.72, -2.5);
  flameL.visible = false;
  const flameR = new THREE.Mesh(flameGeo, flameMat.clone());
  flameR.position.set(pipeOffset, 0.72, -2.5);
  flameR.visible = false;
  kartBodyGroup.add(flameL, flameR);

  // 7. Wheels (2-wheel bikes, 3-wheel trikes, 4-wheel karts/ATVs/heavy trucks)
  const wheels: THREE.Mesh[] = [];
  const frontSteerPivots: THREE.Group[] = [];
  const tireRadius = isHeavy || isAtv ? 0.52 : isBike ? 0.48 : 0.44;
  const tireWidth = isBike ? 0.34 : isHeavy ? 0.54 : 0.42;
  const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.56, tireRadius * 0.56, tireWidth + 0.02, 12);
  rimGeo.rotateZ(Math.PI / 2);

  const trackWidth = isHeavy ? 1.32 : isAtv ? 1.26 : 1.18;
  const wheelPositions: Array<{ x: number; y: number; z: number; isFront: boolean }> = isBike
    ? [
        { x: 0, y: tireRadius, z: 1.24, isFront: true },
        { x: 0, y: tireRadius + 0.02, z: -1.18, isFront: false },
      ]
    : carId === 'mecha_trike'
      ? [
          { x: -trackWidth, y: tireRadius, z: 1.16, isFront: true },
          { x: trackWidth, y: tireRadius, z: 1.16, isFront: true },
          { x: 0, y: tireRadius + 0.05, z: -1.16, isFront: false },
        ]
      : [
          { x: -trackWidth, y: tireRadius, z: 1.12, isFront: true },
          { x: trackWidth, y: tireRadius, z: 1.12, isFront: true },
          { x: -(trackWidth + 0.05), y: tireRadius + 0.04, z: -1.14, isFront: false },
          { x: trackWidth + 0.05, y: tireRadius + 0.04, z: -1.14, isFront: false },
        ];

  for (const wp of wheelPositions) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    if (!wp.isFront && !isBike) tire.scale.set(1.12, 1.1, 1.1);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, carId === 'bowser_bruiser' ? trimMat : chromeMat);
    tire.add(rim);
    wheels.push(tire);

    if (wp.isFront) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, wp.y, wp.z);
      pivot.add(tire);
      kartBodyGroup.add(pivot);
      frontSteerPivots.push(pivot);
    } else {
      tire.position.set(wp.x, wp.y, wp.z);
      kartBodyGroup.add(tire);
    }
  }

  // 8. Character Driver (bespoke dino driver per characterId)
  const driver = buildDriverForCharacter(charId, profile, textures);
  kartBodyGroup.add(driver);

  // 9. Bullet Bill Rocket Transformation Group (hidden by default)
  const bulletGroup = new THREE.Group();
  bulletGroup.visible = false;
  const bulletBodyMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.22,
    metalness: 0.78,
  });
  const bulletCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.22, 2.8, 22), bulletBodyMat);
  bulletCyl.rotation.x = Math.PI / 2;
  bulletCyl.position.set(0, 1.28, -0.2);
  bulletCyl.castShadow = true;
  bulletGroup.add(bulletCyl);

  const bulletNose = new THREE.Mesh(new THREE.SphereGeometry(1.15, 22, 18), bulletBodyMat);
  bulletNose.scale.set(1, 1, 1.35);
  bulletNose.position.set(0, 1.28, 1.2);
  bulletNose.castShadow = true;
  bulletGroup.add(bulletNose);

  const bulletRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.14, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 }),
  );
  bulletRim.position.set(0, 1.28, -1.55);
  bulletGroup.add(bulletRim);

  // Angry Bullet Eyes
  const bEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bPupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), bEyeMat);
    eye.scale.set(0.7, 1.15, 0.7);
    eye.position.set(s * 0.88, 1.48, 1.35);
    bulletGroup.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), bPupilMat);
    pup.position.set(s * 0.96, 1.48, 1.52);
    bulletGroup.add(pup);
  }

  // Side arms
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.7), bulletBodyMat);
    arm.position.set(s * 1.25, 1.1, 0.15);
    bulletGroup.add(arm);
  }

  const bulletFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.95, 2.8, 14),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.92 }),
  );
  bulletFlame.rotation.x = -Math.PI / 2;
  bulletFlame.position.set(0, 1.28, -2.9);
  bulletGroup.add(bulletFlame);
  root.add(bulletGroup);

  // 10. Invincible Star Aura Ring (hidden by default)
  const starAuraGroup = new THREE.Group();
  starAuraGroup.visible = false;
  const starRingMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const starRing = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.09, 8, 32), starRingMat);
  starRing.rotation.x = Math.PI / 2;
  starRing.position.y = 0.85;
  starAuraGroup.add(starRing);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const starBead = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    );
    starBead.position.set(Math.cos(a) * 1.85, 0.95, Math.sin(a) * 1.85);
    starAuraGroup.add(starBead);
  }
  root.add(starAuraGroup);

  // 11. Battle Balloons (3 tethered balloons, shown only in Balloon Battle mode)
  const balloonGroup = new THREE.Group();
  balloonGroup.visible = false;
  const balloons: THREE.Mesh[] = [];
  const balloonColors = [0xef4444, 0x38bdf8, 0xfacc15];
  const stringMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const balloonPositions = [
    [-0.55, 2.75, -1.65],
    [0, 3.05, -1.78],
    [0.55, 2.75, -1.65],
  ];
  for (let b = 0; b < 3; b++) {
    const [bx, by, bz] = balloonPositions[b];
    const stringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.35, 6), stringMat);
    stringMesh.position.set(bx * 0.65, by - 0.72, bz + 0.15);
    stringMesh.rotation.z = -bx * 0.25;
    balloonGroup.add(stringMesh);

    const balloonMat = new THREE.MeshStandardMaterial({
      color: balloonColors[b],
      emissive: balloonColors[b],
      emissiveIntensity: 0.18,
      roughness: 0.22,
      metalness: 0.1,
    });
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), balloonMat);
    balloon.scale.set(0.95, 1.18, 0.95);
    balloon.position.set(bx, by, bz);
    balloon.castShadow = true;
    balloonGroup.add(balloon);
    balloons.push(balloon);
  }
  root.add(balloonGroup);

  return {
    root,
    kartBodyGroup,
    bulletGroup,
    starAuraGroup,
    wheels,
    frontSteerPivots,
    flameL,
    flameR,
    bulletFlame,
    paintMaterials,
    baseColors,
    balloonGroup,
    balloons,
  };
}

export function createSpinyShellModel(): THREE.Group {
  const group = new THREE.Group();

  const blueShellMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.22,
    metalness: 0.45,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.2,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.65,
  });

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    blueShellMat,
  );
  dome.position.y = 0.35;
  dome.castShadow = true;
  group.add(dome);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.14, 10, 24), whiteTrimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.36;
  group.add(rim);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.68, 0.3, 18), bellyMat);
  base.position.y = 0.22;
  group.add(base);

  // 7 Sharp White Spikes
  const spikeGeo = new THREE.ConeGeometry(0.2, 0.68, 8);
  const topSpike = new THREE.Mesh(spikeGeo, whiteTrimMat);
  topSpike.position.y = 1.38;
  group.add(topSpike);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = new THREE.Mesh(spikeGeo, whiteTrimMat);
    sp.position.set(Math.cos(a) * 0.62, 0.92, Math.sin(a) * 0.62);
    sp.rotation.z = -Math.cos(a) * 0.68;
    sp.rotation.x = Math.sin(a) * 0.68;
    group.add(sp);
  }

  // Aero Wings
  const wingGeo = new THREE.BoxGeometry(0.85, 0.08, 0.45);
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, whiteTrimMat);
    wing.position.set(s * 1.1, 0.72, -0.1);
    wing.rotation.z = s * 0.28;
    group.add(wing);
  }

  return group;
}

export function createGreenShellModel(): THREE.Group {
  const group = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.2,
    metalness: 0.35,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.2,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.65,
  });

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.76, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    greenMat,
  );
  dome.position.y = 0.32;
  dome.castShadow = true;
  group.add(dome);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 10, 22), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.33;
  group.add(rim);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.62, 0.26, 16), bellyMat);
  base.position.y = 0.2;
  group.add(base);

  return group;
}

export function createBananaPeelModel(): THREE.Group {
  const group = new THREE.Group();
  const peelMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.45,
    metalness: 0.05,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x713f12,
    roughness: 0.75,
  });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.45, 10), peelMat);
  stem.position.y = 0.48;
  stem.castShadow = true;
  group.add(stem);

  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 10), tipMat);
  tip.position.y = 0.76;
  group.add(tip);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.52, 4, 8), peelMat);
    petal.position.set(Math.cos(a) * 0.38, 0.16, Math.sin(a) * 0.38);
    petal.rotation.y = -a;
    petal.rotation.z = Math.PI * 0.42;
    petal.castShadow = true;
    group.add(petal);
  }

  return group;
}

export function createRedShellModel(): THREE.Group {
  const group = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.18,
    metalness: 0.4,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.2,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    roughness: 0.65,
  });

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.76, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    redMat,
  );
  dome.position.y = 0.32;
  dome.castShadow = true;
  group.add(dome);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 10, 22), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.33;
  group.add(rim);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.62, 0.26, 16), bellyMat);
  base.position.y = 0.2;
  group.add(base);

  return group;
}

export function createBobOmbModel(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.5,
  });
  const footMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.4,
  });
  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.65,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.2,
  });
  const fuseSparkMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 14), bodyMat);
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);

  // Feet
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.45), footMat);
    foot.position.set(s * 0.32, 0.14, 0.1);
    group.add(foot);
  }

  // Expressive Eyes
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.18, 4, 8), eyeMat);
    eye.position.set(s * 0.24, 0.92, 0.72);
    group.add(eye);
  }

  // Fuse & Spark
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 10), bodyMat);
  cap.position.y = 1.66;
  group.add(cap);

  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 8), keyMat);
  fuse.position.y = 1.88;
  fuse.rotation.z = -0.22;
  group.add(fuse);

  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), fuseSparkMat);
  spark.position.set(0.06, 2.08, 0);
  group.add(spark);

  // Wind-up Key on back
  const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 8), keyMat);
  keyStem.rotation.x = Math.PI / 2;
  keyStem.position.set(0, 0.9, -0.88);
  group.add(keyStem);

  for (const s of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 14), keyMat);
    loop.position.set(0, 0.9 + s * 0.18, -1.08);
    loop.rotation.y = Math.PI / 2;
    group.add(loop);
  }

  return group;
}

export function createBoomerangModel(): THREE.Group {
  const group = new THREE.Group();
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.4,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
  });

  const armGeo = new THREE.BoxGeometry(1.15, 0.14, 0.34);
  const armL = new THREE.Mesh(armGeo, blueMat);
  armL.position.set(-0.46, 0.4, 0.16);
  armL.rotation.y = 0.55;
  armL.castShadow = true;
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, blueMat);
  armR.position.set(0.46, 0.4, 0.16);
  armR.rotation.y = -0.55;
  armR.castShadow = true;
  group.add(armR);

  const tipGeo = new THREE.BoxGeometry(0.32, 0.15, 0.35);
  const tipL = new THREE.Mesh(tipGeo, tipMat);
  tipL.position.set(-0.98, 0.4, -0.15);
  tipL.rotation.y = 0.55;
  group.add(tipL);

  const tipR = new THREE.Mesh(tipGeo, tipMat);
  tipR.position.set(0.98, 0.4, -0.15);
  tipR.rotation.y = -0.55;
  group.add(tipR);

  return group;
}


