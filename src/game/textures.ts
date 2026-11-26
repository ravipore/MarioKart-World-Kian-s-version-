import * as THREE from 'three';

export interface WorldTextures {
  asphalt: THREE.CanvasTexture;
  curb: THREE.CanvasTexture;
  checker: THREE.CanvasTexture;
  boostPad: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  itemBox: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  playerEmblem: THREE.Texture;
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createWorldTextures(maxAnisotropy: number): WorldTextures {
  // 1. Asphalt Road Texture (512x512)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const rctx = roadCanvas.getContext('2d')!;
  rctx.fillStyle = '#252b36';
  rctx.fillRect(0, 0, 512, 512);

  // Subtle aggregate grain
  for (let i = 0; i < 6500; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const px = Math.abs(x) * 512;
    const py = Math.abs(y) * 512;
    const shade = i % 3 === 0 ? '#323a48' : '#1b2029';
    rctx.fillStyle = shade;
    rctx.fillRect(px, py, 2, 2);
  }

  // Crisp edge lines
  rctx.fillStyle = '#f8fafc';
  rctx.fillRect(14, 0, 12, 512);
  rctx.fillRect(486, 0, 12, 512);

  // Racing groove darkened tracks
  rctx.fillStyle = 'rgba(10, 14, 20, 0.22)';
  rctx.fillRect(110, 0, 75, 512);
  rctx.fillRect(327, 0, 75, 512);

  // Dashed yellow center divider
  rctx.fillStyle = '#facc15';
  for (let y = 16; y < 512; y += 96) {
    rctx.fillRect(251, y, 10, 52);
  }
  const asphalt = finalizeColorTex(roadCanvas, maxAnisotropy, 1, 1);

  // 2. Red & White Rumble Curb (256x256)
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 256;
  curbCanvas.height = 256;
  const cctx = curbCanvas.getContext('2d')!;
  cctx.fillStyle = '#ef4444';
  cctx.fillRect(0, 0, 256, 128);
  cctx.fillStyle = '#f8fafc';
  cctx.fillRect(0, 128, 256, 128);
  const curb = finalizeColorTex(curbCanvas, maxAnisotropy, 1, 1);

  // 3. Checkered Start/Finish Texture (256x256)
  const chkCanvas = document.createElement('canvas');
  chkCanvas.width = 256;
  chkCanvas.height = 256;
  const kctx = chkCanvas.getContext('2d')!;
  const cells = 8;
  const cellSize = 256 / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      kctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#0f172a';
      kctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  const checker = finalizeColorTex(chkCanvas, maxAnisotropy, 4, 1);

  // 4. Boost Pad Chevron Texture (256x256)
  const boostCanvas = document.createElement('canvas');
  boostCanvas.width = 256;
  boostCanvas.height = 256;
  const bctx = boostCanvas.getContext('2d')!;
  bctx.fillStyle = '#0f172a';
  bctx.fillRect(0, 0, 256, 256);
  const colors = ['#22d3ee', '#4ade80', '#facc15', '#fb923c'];
  for (let i = 0; i < 4; i++) {
    const yOff = i * 64 + 14;
    bctx.fillStyle = colors[i];
    bctx.beginPath();
    bctx.moveTo(28, yOff + 42);
    bctx.lineTo(128, yOff);
    bctx.lineTo(228, yOff + 42);
    bctx.lineTo(202, yOff + 54);
    bctx.lineTo(128, yOff + 22);
    bctx.lineTo(54, yOff + 54);
    bctx.closePath();
    bctx.fill();
  }
  const boostPad = finalizeColorTex(boostCanvas, maxAnisotropy, 1, 1);

  // 5. Lush Sunlit Grass & Canyon Meadow Texture (512x512)
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 512;
  grassCanvas.height = 512;
  const gctx = grassCanvas.getContext('2d')!;
  gctx.fillStyle = '#3f8f3b';
  gctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5500; i++) {
    const px = Math.abs((Math.sin(i * 41.13) * 19283.7) % 1) * 512;
    const py = Math.abs((Math.sin(i * 93.71) * 41928.3) % 1) * 512;
    gctx.fillStyle = i % 2 === 0 ? '#4ca647' : '#32782e';
    gctx.fillRect(px, py, 3, 5);
  }
  const grass = finalizeColorTex(grassCanvas, maxAnisotropy, 28, 28);

  // 6. Item Box '?' Texture (256x256)
  const boxCanvas = document.createElement('canvas');
  boxCanvas.width = 256;
  boxCanvas.height = 256;
  const xctx = boxCanvas.getContext('2d')!;
  const grad = xctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0ea5e9');
  grad.addColorStop(0.33, '#ec4899');
  grad.addColorStop(0.66, '#facc15');
  grad.addColorStop(1, '#22c55e');
  xctx.fillStyle = grad;
  xctx.fillRect(0, 0, 256, 256);
  xctx.strokeStyle = 'rgba(255,255,255,0.9)';
  xctx.lineWidth = 18;
  xctx.strokeRect(10, 10, 236, 236);
  xctx.fillStyle = '#ffffff';
  xctx.font = 'bold 165px Inter, system-ui, sans-serif';
  xctx.textAlign = 'center';
  xctx.textBaseline = 'middle';
  xctx.shadowColor = 'rgba(0,0,0,0.45)';
  xctx.shadowBlur = 12;
  xctx.fillText('?', 128, 136);
  const itemBox = finalizeColorTex(boxCanvas, maxAnisotropy, 1, 1);

  // 7. Soft Radial Contact Shadow Texture (128x128)
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 128;
  shCanvas.height = 128;
  const sctx = shCanvas.getContext('2d')!;
  const sgrad = sctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  sgrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  sgrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  sgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sctx.fillStyle = sgrad;
  sctx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  // 8. Attached BingBong Dinosaur Character Portrait Texture
  const loader = new THREE.TextureLoader();
  const playerEmblem = loader.load('/assets/aistudio/BingBongMan_dinosaur_character__2__2635935f.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
  });
  playerEmblem.colorSpace = THREE.SRGBColorSpace;

  return {
    asphalt,
    curb,
    checker,
    boostPad,
    grass,
    itemBox,
    contactShadow,
    playerEmblem,
  };
}
