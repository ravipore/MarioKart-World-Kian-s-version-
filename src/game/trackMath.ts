import * as THREE from 'three';
import type { CourseId } from './types.ts';

export const ROAD_HALF_WIDTH = 12.5;
export const CURB_WIDTH = 1.6;
export const TRACK_SAMPLES = 900;

export const BATTLE_ARENA_RADIUS = 72;
export const BATTLE_PILLARS: Array<{ x: number; z: number; radius: number }> = [
  { x: -28, z: -28, radius: 5.2 },
  { x: 28, z: -28, radius: 5.2 },
  { x: -28, z: 28, radius: 5.2 },
  { x: 28, z: 28, radius: 5.2 },
];

export const BATTLE_BOOST_PADS: Array<{ x: number; z: number; heading: number }> = [
  { x: 0, z: -20, heading: 0 },
  { x: 0, z: 20, heading: Math.PI },
  { x: -20, z: 0, heading: Math.PI * 0.5 },
  { x: 20, z: 0, heading: -Math.PI * 0.5 },
];

export const BATTLE_ITEM_SPOTS: Array<{ id: number; position: THREE.Vector3 }> = [
  // Inner ring (4)
  { id: 0, position: new THREE.Vector3(0, 1.55, -36) },
  { id: 1, position: new THREE.Vector3(36, 1.55, 0) },
  { id: 2, position: new THREE.Vector3(0, 1.55, 36) },
  { id: 3, position: new THREE.Vector3(-36, 1.55, 0) },
  // Outer diagonals (8)
  { id: 4, position: new THREE.Vector3(-42, 1.55, -42) },
  { id: 5, position: new THREE.Vector3(42, 1.55, -42) },
  { id: 6, position: new THREE.Vector3(42, 1.55, 42) },
  { id: 7, position: new THREE.Vector3(-42, 1.55, 42) },
  { id: 8, position: new THREE.Vector3(0, 1.55, 0) },
  { id: 9, position: new THREE.Vector3(-56, 1.55, 0) },
  { id: 10, position: new THREE.Vector3(56, 1.55, 0) },
  { id: 11, position: new THREE.Vector3(0, 1.55, -56) },
];

export interface TrackSample {
  t: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
}

export interface BoostPadSpec {
  t: number;
  lateral: number;
  halfLengthT: number;
  halfWidth: number;
  position: THREE.Vector3;
}

export interface ItemBoxSpec {
  id: number;
  t: number;
  lateral: number;
  position: THREE.Vector3;
}

export interface TrackMath {
  courseId: CourseId;
  isStraight: boolean;
  curve: THREE.CatmullRomCurve3;
  totalLength: number;
  samples: TrackSample[];
  boostPads: BoostPadSpec[];
  itemBoxSpecs: ItemBoxSpec[];
  minimapPath: Array<{ x: number; z: number }>;
  minimapBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  sampleAt: (t: number, outPos: THREE.Vector3, outTan: THREE.Vector3, outRight: THREE.Vector3) => void;
  closestPoint: (
    x: number,
    z: number,
    hintT?: number,
  ) => { t: number; distSq: number; lateral: number; point: THREE.Vector3; tangent: THREE.Vector3; right: THREE.Vector3 };
}

function getCourseControlPoints(courseId: CourseId): THREE.Vector3[] {
  switch (courseId) {
    case 'bung_stadium':
      return [
        new THREE.Vector3(0, 0.2, -180),
        new THREE.Vector3(0, 0.2, -60),
        new THREE.Vector3(0, 0.2, 60),
        new THREE.Vector3(0, 0.2, 180),
      ];
    case 'starlight_circuit':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 75),
        new THREE.Vector3(35, 1.8, 195),
        new THREE.Vector3(155, 5.5, 240),
        new THREE.Vector3(260, 7.5, 150),
        new THREE.Vector3(245, 4.0, 10),
        new THREE.Vector3(150, 1.2, -55),
        new THREE.Vector3(225, 4.5, -165),
        new THREE.Vector3(185, 6.0, -280),
        new THREE.Vector3(55, 2.2, -295),
        new THREE.Vector3(-70, 1.0, -235),
        new THREE.Vector3(-120, 2.8, -140),
        new THREE.Vector3(-60, 0.6, -108),
      ];
    case 'mario_bros_circuit':
    default:
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 70),
        new THREE.Vector3(25, 1.5, 195),
        new THREE.Vector3(145, 4.5, 245),
        new THREE.Vector3(270, 5.5, 165),
        new THREE.Vector3(285, 2.5, 35),
        new THREE.Vector3(205, 0.8, -45),
        new THREE.Vector3(120, 1.8, -100),
        new THREE.Vector3(195, 5.0, -210),
        new THREE.Vector3(135, 4.0, -310),
        new THREE.Vector3(-10, 1.8, -285),
        new THREE.Vector3(-115, 2.5, -195),
        new THREE.Vector3(-78, 0.7, -112),
      ];
    case 'crown_city':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 85),
        new THREE.Vector3(65, 1.2, 200),
        new THREE.Vector3(195, 4.5, 205),
        new THREE.Vector3(260, 8.5, 95),
        new THREE.Vector3(245, 6.0, -35),
        new THREE.Vector3(145, 2.5, -60),
        new THREE.Vector3(135, 1.0, -175),
        new THREE.Vector3(225, 4.5, -265),
        new THREE.Vector3(95, 3.0, -325),
        new THREE.Vector3(-55, 1.2, -265),
        new THREE.Vector3(-125, 2.0, -155),
        new THREE.Vector3(-72, 0.6, -108),
      ];
    case 'whistletop_summit':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 55),
        new THREE.Vector3(-30, 3.5, 165),
        new THREE.Vector3(65, 9.5, 240),
        new THREE.Vector3(185, 14.5, 205),
        new THREE.Vector3(245, 11.5, 95),
        new THREE.Vector3(155, 6.5, 15),
        new THREE.Vector3(110, 4.0, -85),
        new THREE.Vector3(215, 8.5, -180),
        new THREE.Vector3(170, 12.0, -290),
        new THREE.Vector3(35, 6.5, -305),
        new THREE.Vector3(-85, 2.5, -230),
        new THREE.Vector3(-115, 1.2, -135),
        new THREE.Vector3(-68, 0.5, -108),
      ];
    case 'dk_spaceport':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.4, 70),
        new THREE.Vector3(40, 5.0, 195),
        new THREE.Vector3(165, 13.5, 235),
        new THREE.Vector3(280, 17.5, 135),
        new THREE.Vector3(255, 12.0, -10),
        new THREE.Vector3(155, 6.5, -75),
        new THREE.Vector3(205, 10.5, -195),
        new THREE.Vector3(140, 14.0, -305),
        new THREE.Vector3(10, 7.5, -290),
        new THREE.Vector3(-105, 3.0, -210),
        new THREE.Vector3(-120, 1.2, -125),
        new THREE.Vector3(-68, 0.5, -106),
      ];
    case 'desert_hills':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 55),
        new THREE.Vector3(30, 5.5, 175),
        new THREE.Vector3(130, 9.5, 240),
        new THREE.Vector3(245, 3.0, 175),
        new THREE.Vector3(260, 8.5, 55),
        new THREE.Vector3(170, 2.5, -25),
        new THREE.Vector3(125, 6.0, -125),
        new THREE.Vector3(210, 10.0, -225),
        new THREE.Vector3(120, 4.0, -305),
        new THREE.Vector3(-25, 7.0, -260),
        new THREE.Vector3(-115, 2.5, -170),
        new THREE.Vector3(-75, 0.8, -110),
      ];
    case 'shy_guy_bazaar':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 48),
        new THREE.Vector3(-42, 1.4, 145),
        new THREE.Vector3(32, 3.8, 225),
        new THREE.Vector3(148, 6.5, 215),
        new THREE.Vector3(215, 4.2, 120),
        new THREE.Vector3(140, 2.0, 35),
        new THREE.Vector3(185, 3.5, -65),
        new THREE.Vector3(235, 6.0, -175),
        new THREE.Vector3(145, 4.5, -275),
        new THREE.Vector3(20, 1.8, -265),
        new THREE.Vector3(-95, 2.2, -195),
        new THREE.Vector3(-72, 0.7, -112),
      ];
    case 'wario_stadium':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 65),
        new THREE.Vector3(55, 3.5, 180),
        new THREE.Vector3(175, 6.0, 195),
        new THREE.Vector3(245, 2.5, 95),
        new THREE.Vector3(190, 5.0, -5),
        new THREE.Vector3(105, 1.5, -55),
        new THREE.Vector3(175, 5.5, -155),
        new THREE.Vector3(210, 4.0, -260),
        new THREE.Vector3(85, 2.0, -295),
        new THREE.Vector3(-55, 4.2, -245),
        new THREE.Vector3(-125, 1.8, -150),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'airship_fortress':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.4, 58),
        new THREE.Vector3(38, 4.5, 175),
        new THREE.Vector3(145, 10.5, 225),
        new THREE.Vector3(245, 15.0, 145),
        new THREE.Vector3(225, 11.5, 25),
        new THREE.Vector3(135, 7.0, -35),
        new THREE.Vector3(195, 9.5, -145),
        new THREE.Vector3(185, 13.5, -260),
        new THREE.Vector3(60, 8.5, -295),
        new THREE.Vector3(-70, 3.5, -240),
        new THREE.Vector3(-120, 1.8, -145),
        new THREE.Vector3(-68, 0.6, -108),
      ];
    case 'dk_pass':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.5, 55),
        new THREE.Vector3(-28, 4.5, 165),
        new THREE.Vector3(55, 11.0, 235),
        new THREE.Vector3(175, 14.5, 210),
        new THREE.Vector3(250, 10.5, 105),
        new THREE.Vector3(185, 5.5, 5),
        new THREE.Vector3(115, 2.5, -70),
        new THREE.Vector3(195, 6.5, -175),
        new THREE.Vector3(175, 9.5, -280),
        new THREE.Vector3(45, 5.0, -295),
        new THREE.Vector3(-85, 2.0, -220),
        new THREE.Vector3(-115, 1.0, -130),
        new THREE.Vector3(-68, 0.5, -108),
      ];
    case 'starview_peak':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.3, 62),
        new THREE.Vector3(22, 4.0, 185),
        new THREE.Vector3(115, 10.0, 245),
        new THREE.Vector3(235, 13.0, 185),
        new THREE.Vector3(260, 8.5, 65),
        new THREE.Vector3(170, 3.5, -25),
        new THREE.Vector3(145, 4.5, -135),
        new THREE.Vector3(220, 9.5, -235),
        new THREE.Vector3(120, 7.5, -310),
        new THREE.Vector3(-20, 3.0, -265),
        new THREE.Vector3(-115, 1.8, -165),
        new THREE.Vector3(-70, 0.6, -110),
      ];
    case 'sky_high_sundae':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.4, 72),
        new THREE.Vector3(48, 5.0, 195),
        new THREE.Vector3(170, 10.5, 225),
        new THREE.Vector3(265, 12.5, 115),
        new THREE.Vector3(230, 7.5, -15),
        new THREE.Vector3(135, 3.5, -75),
        new THREE.Vector3(185, 7.5, -185),
        new THREE.Vector3(125, 11.0, -295),
        new THREE.Vector3(-15, 6.5, -280),
        new THREE.Vector3(-110, 3.0, -185),
        new THREE.Vector3(-72, 0.7, -110),
      ];
    case 'wario_shipyard':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 55),
        new THREE.Vector3(-32, -1.2, 160),
        new THREE.Vector3(55, 2.5, 240),
        new THREE.Vector3(180, 6.5, 215),
        new THREE.Vector3(250, 4.0, 105),
        new THREE.Vector3(165, -0.5, 15),
        new THREE.Vector3(120, 1.5, -80),
        new THREE.Vector3(205, 6.0, -180),
        new THREE.Vector3(155, 7.5, -285),
        new THREE.Vector3(25, 3.5, -295),
        new THREE.Vector3(-95, 1.2, -210),
        new THREE.Vector3(-72, 0.5, -110),
      ];
    case 'koopa_troopa_beach':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 68),
        new THREE.Vector3(35, 1.0, 190),
        new THREE.Vector3(145, 2.8, 235),
        new THREE.Vector3(255, 3.5, 145),
        new THREE.Vector3(250, 1.5, 15),
        new THREE.Vector3(165, 0.8, -65),
        new THREE.Vector3(195, 2.2, -180),
        new THREE.Vector3(135, 3.0, -285),
        new THREE.Vector3(-5, 1.4, -270),
        new THREE.Vector3(-115, 1.0, -180),
        new THREE.Vector3(-72, 0.5, -110),
      ];
    case 'faraway_oasis':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 62),
        new THREE.Vector3(18, 2.2, 180),
        new THREE.Vector3(120, 5.5, 235),
        new THREE.Vector3(235, 6.5, 155),
        new THREE.Vector3(245, 3.0, 30),
        new THREE.Vector3(150, 1.2, -45),
        new THREE.Vector3(185, 4.0, -155),
        new THREE.Vector3(145, 6.0, -270),
        new THREE.Vector3(15, 2.5, -275),
        new THREE.Vector3(-95, 1.5, -195),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'peach_beach':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 72),
        new THREE.Vector3(42, 1.2, 195),
        new THREE.Vector3(160, 3.2, 232),
        new THREE.Vector3(268, 2.5, 135),
        new THREE.Vector3(245, 1.0, 5),
        new THREE.Vector3(145, 0.6, -65),
        new THREE.Vector3(175, 2.2, -185),
        new THREE.Vector3(105, 2.8, -285),
        new THREE.Vector3(-25, 1.2, -255),
        new THREE.Vector3(-115, 0.9, -170),
        new THREE.Vector3(-72, 0.5, -108),
      ];
    case 'peach_stadium':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 85),
        new THREE.Vector3(58, 2.5, 200),
        new THREE.Vector3(188, 5.5, 205),
        new THREE.Vector3(262, 4.0, 95),
        new THREE.Vector3(220, 1.5, -25),
        new THREE.Vector3(135, 2.0, -90),
        new THREE.Vector3(195, 5.0, -205),
        new THREE.Vector3(120, 3.5, -305),
        new THREE.Vector3(-20, 1.8, -270),
        new THREE.Vector3(-120, 2.2, -175),
        new THREE.Vector3(-72, 0.5, -108),
      ];
    case 'mushroom_kingdom':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 65),
        new THREE.Vector3(25, 2.5, 185),
        new THREE.Vector3(130, 6.5, 235),
        new THREE.Vector3(245, 5.0, 145),
        new THREE.Vector3(235, 2.0, 15),
        new THREE.Vector3(135, 1.0, -45),
        new THREE.Vector3(195, 4.0, -165),
        new THREE.Vector3(155, 5.5, -280),
        new THREE.Vector3(25, 2.2, -285),
        new THREE.Vector3(-100, 1.5, -200),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'rainbow_road':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 1.2, 75),
        new THREE.Vector3(45, 7.5, 205),
        new THREE.Vector3(175, 15.5, 240),
        new THREE.Vector3(295, 18.0, 130),
        new THREE.Vector3(260, 11.0, -15),
        new THREE.Vector3(155, 5.5, -80),
        new THREE.Vector3(225, 12.5, -205),
        new THREE.Vector3(135, 16.0, -315),
        new THREE.Vector3(-10, 9.0, -285),
        new THREE.Vector3(-120, 4.0, -190),
        new THREE.Vector3(-70, 0.8, -110),
      ];
    case 'sunshine_airport':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 95),
        new THREE.Vector3(55, 2.0, 220),
        new THREE.Vector3(185, 5.5, 225),
        new THREE.Vector3(270, 4.5, 105),
        new THREE.Vector3(240, 2.0, -30),
        new THREE.Vector3(145, 1.0, -90),
        new THREE.Vector3(205, 4.0, -210),
        new THREE.Vector3(120, 3.0, -310),
        new THREE.Vector3(-25, 1.5, -265),
        new THREE.Vector3(-115, 2.0, -165),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'dino_dino_jungle':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 52),
        new THREE.Vector3(-35, 3.5, 160),
        new THREE.Vector3(45, 8.5, 235),
        new THREE.Vector3(165, 11.5, 215),
        new THREE.Vector3(245, 7.5, 115),
        new THREE.Vector3(165, 3.0, 20),
        new THREE.Vector3(105, 1.5, -70),
        new THREE.Vector3(195, 6.0, -175),
        new THREE.Vector3(155, 8.0, -285),
        new THREE.Vector3(25, 3.5, -295),
        new THREE.Vector3(-95, 2.0, -205),
        new THREE.Vector3(-70, 0.6, -108),
      ];
    case 'great_block_ruins':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 58),
        new THREE.Vector3(35, 4.5, 175),
        new THREE.Vector3(145, 10.5, 225),
        new THREE.Vector3(255, 9.0, 125),
        new THREE.Vector3(215, 4.5, 5),
        new THREE.Vector3(125, 2.5, -60),
        new THREE.Vector3(195, 7.5, -175),
        new THREE.Vector3(140, 9.5, -290),
        new THREE.Vector3(5, 4.0, -285),
        new THREE.Vector3(-105, 2.5, -195),
        new THREE.Vector3(-70, 0.6, -108),
      ];
    case 'boo_cinema':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 62),
        new THREE.Vector3(-25, 2.2, 170),
        new THREE.Vector3(65, 5.5, 240),
        new THREE.Vector3(190, 6.5, 200),
        new THREE.Vector3(245, 3.5, 85),
        new THREE.Vector3(155, 1.5, 5),
        new THREE.Vector3(135, 2.5, -100),
        new THREE.Vector3(220, 5.0, -210),
        new THREE.Vector3(125, 4.0, -305),
        new THREE.Vector3(-15, 1.8, -265),
        new THREE.Vector3(-115, 1.5, -165),
        new THREE.Vector3(-72, 0.5, -108),
      ];
    case 'bowsers_castle':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.4, 58),
        new THREE.Vector3(42, 5.0, 175),
        new THREE.Vector3(155, 12.0, 225),
        new THREE.Vector3(260, 14.5, 130),
        new THREE.Vector3(230, 9.0, 5),
        new THREE.Vector3(130, 4.0, -65),
        new THREE.Vector3(205, 8.5, -180),
        new THREE.Vector3(165, 12.5, -290),
        new THREE.Vector3(35, 6.0, -295),
        new THREE.Vector3(-90, 2.5, -210),
        new THREE.Vector3(-68, 0.6, -108),
      ];
    case 'dry_bones_burnout':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 55),
        new THREE.Vector3(-30, 3.5, 165),
        new THREE.Vector3(55, 8.0, 235),
        new THREE.Vector3(175, 10.5, 210),
        new THREE.Vector3(245, 5.5, 100),
        new THREE.Vector3(160, 2.0, 10),
        new THREE.Vector3(120, 4.5, -90),
        new THREE.Vector3(210, 8.5, -195),
        new THREE.Vector3(135, 6.0, -295),
        new THREE.Vector3(0, 2.5, -275),
        new THREE.Vector3(-105, 1.5, -180),
        new THREE.Vector3(-70, 0.6, -108),
      ];
    case 'toads_factory':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 72),
        new THREE.Vector3(55, 2.5, 195),
        new THREE.Vector3(180, 6.5, 205),
        new THREE.Vector3(260, 5.0, 95),
        new THREE.Vector3(215, 2.0, -20),
        new THREE.Vector3(125, 1.0, -75),
        new THREE.Vector3(185, 4.5, -190),
        new THREE.Vector3(135, 5.5, -295),
        new THREE.Vector3(-5, 2.0, -275),
        new THREE.Vector3(-115, 1.8, -175),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'mario_circuit':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 68),
        new THREE.Vector3(38, 1.8, 192),
        new THREE.Vector3(158, 4.2, 232),
        new THREE.Vector3(268, 5.0, 140),
        new THREE.Vector3(245, 2.2, 12),
        new THREE.Vector3(148, 1.0, -48),
        new THREE.Vector3(212, 3.8, -172),
        new THREE.Vector3(155, 4.5, -295),
        new THREE.Vector3(12, 2.0, -282),
        new THREE.Vector3(-108, 1.8, -185),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'choco_mountain':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.4, 58),
        new THREE.Vector3(-32, 4.2, 165),
        new THREE.Vector3(48, 10.5, 238),
        new THREE.Vector3(172, 13.5, 205),
        new THREE.Vector3(248, 9.0, 92),
        new THREE.Vector3(162, 4.5, 8),
        new THREE.Vector3(115, 3.2, -88),
        new THREE.Vector3(205, 8.2, -192),
        new THREE.Vector3(142, 10.0, -295),
        new THREE.Vector3(8, 4.8, -280),
        new THREE.Vector3(-108, 2.0, -185),
        new THREE.Vector3(-70, 0.6, -108),
      ];
    case 'acorn_heights':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.3, 62),
        new THREE.Vector3(32, 3.5, 185),
        new THREE.Vector3(140, 8.8, 238),
        new THREE.Vector3(258, 11.2, 152),
        new THREE.Vector3(242, 6.8, 20),
        new THREE.Vector3(145, 3.0, -52),
        new THREE.Vector3(198, 6.2, -172),
        new THREE.Vector3(145, 8.2, -288),
        new THREE.Vector3(10, 3.6, -278),
        new THREE.Vector3(-105, 2.0, -188),
        new THREE.Vector3(-70, 0.6, -108),
      ];
    case 'cheep_cheep_falls':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 64),
        new THREE.Vector3(-26, 2.4, 174),
        new THREE.Vector3(62, 6.5, 238),
        new THREE.Vector3(188, 7.5, 204),
        new THREE.Vector3(252, 3.5, 88),
        new THREE.Vector3(162, 1.2, 4),
        new THREE.Vector3(128, 2.4, -95),
        new THREE.Vector3(212, 5.2, -205),
        new THREE.Vector3(122, 4.0, -298),
        new THREE.Vector3(-14, 1.8, -264),
        new THREE.Vector3(-112, 1.4, -172),
        new THREE.Vector3(-72, 0.5, -108),
      ];
    case 'moo_moo_meadows':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 72),
        new THREE.Vector3(46, 1.5, 195),
        new THREE.Vector3(165, 3.4, 224),
        new THREE.Vector3(258, 2.8, 122),
        new THREE.Vector3(222, 1.2, -8),
        new THREE.Vector3(132, 0.8, -68),
        new THREE.Vector3(178, 2.6, -188),
        new THREE.Vector3(102, 2.8, -286),
        new THREE.Vector3(-24, 1.4, -252),
        new THREE.Vector3(-112, 1.0, -165),
        new THREE.Vector3(-70, 0.5, -108),
      ];
    case 'salty_salty_speedway':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.2, 82),
        new THREE.Vector3(52, 1.4, 202),
        new THREE.Vector3(182, 3.6, 208),
        new THREE.Vector3(264, 2.8, 95),
        new THREE.Vector3(225, 1.0, -26),
        new THREE.Vector3(138, 1.2, -88),
        new THREE.Vector3(198, 3.2, -204),
        new THREE.Vector3(118, 2.4, -300),
        new THREE.Vector3(-22, 1.2, -264),
        new THREE.Vector3(-118, 1.4, -170),
        new THREE.Vector3(-72, 0.5, -108),
      ];
    case 'dandelion_depths':
      return [
        new THREE.Vector3(0, 0.2, -95),
        new THREE.Vector3(0, 0.3, 56),
        new THREE.Vector3(-34, 2.8, 162),
        new THREE.Vector3(52, 7.2, 236),
        new THREE.Vector3(178, 9.4, 206),
        new THREE.Vector3(244, 5.2, 92),
        new THREE.Vector3(156, 1.8, 8),
        new THREE.Vector3(118, 3.5, -92),
        new THREE.Vector3(206, 7.0, -198),
        new THREE.Vector3(132, 5.5, -296),
        new THREE.Vector3(-6, 2.2, -272),
        new THREE.Vector3(-108, 1.6, -178),
        new THREE.Vector3(-70, 0.5, -108),
      ];
  }
}

export function createTrackMath(courseId: CourseId = 'mario_bros_circuit'): TrackMath {
  const isStraight = courseId === 'bung_stadium';
  const controlPoints = getCourseControlPoints(courseId);
  const curve = new THREE.CatmullRomCurve3(controlPoints, !isStraight, 'centripetal', 0.5);
  const straightLength = 360;
  const straightHalf = straightLength * 0.5;
  const totalLength = isStraight ? straightLength : curve.getLength();

  const samples: TrackSample[] = [];
  const up = new THREE.Vector3(0, 1, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < TRACK_SAMPLES; i++) {
    const t = i / TRACK_SAMPLES;
    const point = isStraight
      ? new THREE.Vector3(0, 0.2, -straightHalf + t * straightLength)
      : curve.getPointAt(t);
    const tangent = isStraight
      ? new THREE.Vector3(0, 0, 1)
      : curve.getTangentAt(t).normalize();
    const right = isStraight
      ? new THREE.Vector3(-1, 0, 0)
      : new THREE.Vector3().crossVectors(tangent, up).normalize();
    samples.push({ t, point, tangent, right });

    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.z < minZ) minZ = point.z;
    if (point.z > maxZ) maxZ = point.z;
  }

  const pad = 28;
  const minimapBounds = {
    minX: minX - pad,
    maxX: maxX + pad,
    minZ: minZ - pad,
    maxZ: maxZ + pad,
  };

  const spanX = minimapBounds.maxX - minimapBounds.minX;
  const spanZ = minimapBounds.maxZ - minimapBounds.minZ;
  const span = Math.max(spanX, spanZ);
  const offsetX = (span - spanX) * 0.5;
  const offsetZ = (span - spanZ) * 0.5;

  const minimapPath: Array<{ x: number; z: number }> = [];
  for (let i = 0; i < TRACK_SAMPLES; i += 9) {
    const p = samples[i].point;
    minimapPath.push({
      x: ((p.x - minimapBounds.minX + offsetX) / span) * 100,
      z: ((p.z - minimapBounds.minZ + offsetZ) / span) * 100,
    });
  }

  const boostPadTs = [0.22, 0.46, 0.72, 0.92];
  const boostPads: BoostPadSpec[] = boostPadTs.map((bt, idx) => {
    const s = samples[Math.floor(bt * TRACK_SAMPLES)];
    const lateral = idx % 2 === 0 ? -3.2 : 3.2;
    const pos = s.point.clone().addScaledVector(s.right, lateral);
    pos.y += 0.05;
    return {
      t: bt,
      lateral,
      halfLengthT: isStraight ? 0.012 : 0.008,
      halfWidth: 3.1,
      position: pos,
    };
  });

  const itemRowTs = [0.15, 0.38, 0.63, 0.85];
  const itemLaterals = [-6.6, -2.2, 2.2, 6.6];
  const itemBoxSpecs: ItemBoxSpec[] = [];
  let boxId = 0;
  for (const rt of itemRowTs) {
    const s = samples[Math.floor(rt * TRACK_SAMPLES)];
    for (const lat of itemLaterals) {
      const pos = s.point.clone().addScaledVector(s.right, lat);
      pos.y += 1.55;
      itemBoxSpecs.push({
        id: boxId++,
        t: rt,
        lateral: lat,
        position: pos,
      });
    }
  }

  const straightTan = new THREE.Vector3(0, 0, 1);
  const straightRight = new THREE.Vector3(-1, 0, 0);

  function sampleAt(
    rawT: number,
    outPos: THREE.Vector3,
    outTan: THREE.Vector3,
    outRight: THREE.Vector3,
  ): void {
    const t = ((rawT % 1) + 1) % 1;
    if (isStraight) {
      outPos.set(0, 0.2, -straightHalf + t * straightLength);
      outTan.copy(straightTan);
      outRight.copy(straightRight);
      return;
    }
    const fIdx = t * TRACK_SAMPLES;
    const i0 = Math.floor(fIdx) % TRACK_SAMPLES;
    const i1 = (i0 + 1) % TRACK_SAMPLES;
    const alpha = fIdx - Math.floor(fIdx);

    const s0 = samples[i0];
    const s1 = samples[i1];
    outPos.lerpVectors(s0.point, s1.point, alpha);
    outTan.lerpVectors(s0.tangent, s1.tangent, alpha).normalize();
    outRight.lerpVectors(s0.right, s1.right, alpha).normalize();
  }

  function closestPoint(x: number, z: number, hintT?: number) {
    if (isStraight) {
      const wrappedZ = ((((z + straightHalf) % straightLength) + straightLength) % straightLength) - straightHalf;
      const t = (wrappedZ + straightHalf) / straightLength;
      return {
        t,
        distSq: x * x,
        lateral: -x,
        point: new THREE.Vector3(0, 0.2, wrappedZ),
        tangent: straightTan,
        right: straightRight,
      };
    }

    let bestIdx = 0;
    let bestDistSq = Infinity;

    if (hintT !== undefined) {
      const center = Math.floor((((hintT % 1) + 1) % 1) * TRACK_SAMPLES);
      const windowRadius = 42;
      for (let offset = -windowRadius; offset <= windowRadius; offset++) {
        const idx = (center + offset + TRACK_SAMPLES) % TRACK_SAMPLES;
        const p = samples[idx].point;
        const d2 = (x - p.x) ** 2 + (z - p.z) ** 2;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestIdx = idx;
        }
      }
    }

    if (hintT === undefined || bestDistSq > 900) {
      bestDistSq = Infinity;
      for (let i = 0; i < TRACK_SAMPLES; i += 2) {
        const p = samples[i].point;
        const d2 = (x - p.x) ** 2 + (z - p.z) ** 2;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestIdx = i;
        }
      }
      const base = bestIdx;
      for (let o = -3; o <= 3; o++) {
        const idx = (base + o + TRACK_SAMPLES) % TRACK_SAMPLES;
        const p = samples[idx].point;
        const d2 = (x - p.x) ** 2 + (z - p.z) ** 2;
        if (d2 < bestDistSq) {
          bestDistSq = d2;
          bestIdx = idx;
        }
      }
    }

    const s = samples[bestIdx];
    const dx = x - s.point.x;
    const dz = z - s.point.z;
    const lateral = dx * s.right.x + dz * s.right.z;

    return {
      t: s.t,
      distSq: bestDistSq,
      lateral,
      point: s.point,
      tangent: s.tangent,
      right: s.right,
    };
  }

  return {
    courseId,
    isStraight,
    curve,
    totalLength,
    samples,
    boostPads,
    itemBoxSpecs,
    minimapPath,
    minimapBounds,
    sampleAt,
    closestPoint,
  };
}
