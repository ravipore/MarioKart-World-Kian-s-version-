export type GamePhase = 'title' | 'countdown' | 'playing' | 'paused' | 'finished';

export type GameMode =
  | 'grand_prix'
  | 'knockout_tour'
  | 'time_trial'
  | 'vs_race'
  | 'battle';

export type CourseId =
  | 'mario_bros_circuit'
  | 'crown_city'
  | 'whistletop_summit'
  | 'dk_spaceport'
  | 'desert_hills'
  | 'shy_guy_bazaar'
  | 'wario_stadium'
  | 'airship_fortress'
  | 'dk_pass'
  | 'starview_peak'
  | 'sky_high_sundae'
  | 'wario_shipyard'
  | 'koopa_troopa_beach'
  | 'faraway_oasis'
  | 'peach_beach'
  | 'peach_stadium'
  | 'mushroom_kingdom'
  | 'rainbow_road'
  | 'sunshine_airport'
  | 'dino_dino_jungle'
  | 'great_block_ruins'
  | 'boo_cinema'
  | 'bowsers_castle'
  | 'dry_bones_burnout'
  | 'toads_factory'
  | 'starlight_circuit'
  | 'mario_circuit'
  | 'choco_mountain'
  | 'acorn_heights'
  | 'cheep_cheep_falls'
  | 'moo_moo_meadows'
  | 'salty_salty_speedway'
  | 'dandelion_depths'
  | 'bung_stadium';

export type CupId =
  | 'mushroom_cup'
  | 'flower_cup'
  | 'star_cup'
  | 'shell_cup'
  | 'banana_cup'
  | 'leaf_cup'
  | 'lightning_cup'
  | 'special_cup'
  | 'rainbow_cup';

export type KnockoutCupId =
  | 'ko_golden_cup'
  | 'ko_frost_cup'
  | 'ko_tidal_cup'
  | 'ko_royal_cup'
  | 'ko_ember_cup';

export type EngineClass =
  | '10cc'
  | '50cc'
  | '100cc'
  | '150cc'
  | '200cc'
  | '300cc'
  | '400cc'
  | '500cc'
  | '1000cc'
  | '5000cc'
  | '10000cc'
  | '50000cc'
  | '1000000000000000000000cc'
  | '500000000000000000000000000000000000000000cc';

export const ENGINE_CLASS_CATALOG: EngineClass[] = [
  '10cc',
  '50cc',
  '100cc',
  '150cc',
  '200cc',
  '300cc',
  '400cc',
  '500cc',
  '1000cc',
  '5000cc',
  '10000cc',
  '50000cc',
  '1000000000000000000000cc',
  '500000000000000000000000000000000000000000cc',
];

export type ItemFrequency = 'normal' | 'frantic' | 'none';

export type CpuDifficulty = 'normal' | 'hard' | 'master';

export const VS_LAP_OPTIONS = [2, 3, 5, 50, 100, 200, 500, 1000] as const;

export const BUNG_STADIUM_MAX_MILES = 1e56;
export const BUNG_STADIUM_MAX_MILES_LABEL =
  '100000000000000000000000000000000000000000000000000000000';

export interface RaceConfig {
  mode: GameMode;
  courseId: CourseId;
  cupId?: CupId;
  knockoutCupId?: KnockoutCupId;
  engineClass: EngineClass;
  laps: number;
  itemFrequency: ItemFrequency;
  cpuDifficulty: CpuDifficulty;
  vsSolo?: boolean;
}

export const DEFAULT_RACE_CONFIG: RaceConfig = {
  mode: 'grand_prix',
  courseId: 'mario_bros_circuit',
  cupId: 'mushroom_cup',
  knockoutCupId: 'ko_golden_cup',
  engineClass: '150cc',
  laps: 50,
  itemFrequency: 'normal',
  cpuDifficulty: 'normal',
  vsSolo: false,
};

export interface GameModeSpec {
  id: GameMode;
  name: string;
  shortLabel: string;
  tagline: string;
  hexColor: string;
  supportsMultiplayer: boolean;
}

export const GAME_MODE_CATALOG: GameModeSpec[] = [
  {
    id: 'grand_prix',
    name: 'Grand Prix',
    shortLabel: 'Grand Prix',
    tagline: '4-race Cup championship for points across every circuit',
    hexColor: '#facc15',
    supportsMultiplayer: true,
  },
  {
    id: 'knockout_tour',
    name: 'Knockout Tour',
    shortLabel: 'Knockout',
    tagline: '6-race elimination cup — survive each stage cutoff or get knocked out',
    hexColor: '#f97316',
    supportsMultiplayer: true,
  },
  {
    id: 'time_trial',
    name: 'Time Trial',
    shortLabel: 'Time Trial',
    tagline: 'Solo speedrun with 3 Nitro Mushrooms vs your saved best ghost',
    hexColor: '#38bdf8',
    supportsMultiplayer: false,
  },
  {
    id: 'vs_race',
    name: 'VS Race',
    shortLabel: 'VS Race',
    tagline: 'Custom single race with your choice of course, cc, laps & items',
    hexColor: '#4ade80',
    supportsMultiplayer: true,
  },
  {
    id: 'battle',
    name: 'Balloon Battle',
    shortLabel: 'Battle',
    tagline: '90s arena showdown — pop rival balloons with shells & power items',
    hexColor: '#f43f5e',
    supportsMultiplayer: true,
  },
];

export type TrackVisualTheme =
  | 'valley'
  | 'desert'
  | 'snow'
  | 'night'
  | 'city'
  | 'space'
  | 'bazaar'
  | 'stadium'
  | 'fortress'
  | 'sundae'
  | 'shipyard'
  | 'beach'
  | 'oasis'
  | 'rainbow'
  | 'lava'
  | 'jungle'
  | 'ruins'
  | 'cinema'
  | 'factory'
  | 'airport'
  | 'stadium_royal';

export interface CourseSpec {
  id: CourseId;
  name: string;
  subtitle: string;
  theme: TrackVisualTheme;
  skyHex: number;
  fogHex: number;
  grassHex: string;
  roadTintHex: string;
  curbAccentHex: number;
  rockHue: number;
  treeHue: number;
  goldTimeSec: number;
  silverTimeSec: number;
  accentHex: string;
}

export const COURSE_CATALOG: CourseSpec[] = [
  {
    id: 'starlight_circuit',
    name: 'Starlight Circuit',
    subtitle: 'Twilight Grand Prix speedway with banked chicanes',
    theme: 'night',
    skyHex: 0x1e1b4b,
    fogHex: 0x312e81,
    grassHex: '#1e293b',
    roadTintHex: '#1f2937',
    curbAccentHex: 0xa855f7,
    rockHue: 0.72,
    treeHue: 0.58,
    goldTimeSec: 92,
    silverTimeSec: 106,
    accentHex: '#a855f7',
  },
  {
    id: 'mario_bros_circuit',
    name: 'Mario Bros. Circuit',
    subtitle: 'Classic desert-mesa speedway & high-speed hairpin',
    theme: 'valley',
    skyHex: 0x38bdf8,
    fogHex: 0x7dd3fc,
    grassHex: '#d97706',
    roadTintHex: '#374151',
    curbAccentHex: 0xdc2626,
    rockHue: 0.06,
    treeHue: 0.28,
    goldTimeSec: 90,
    silverTimeSec: 104,
    accentHex: '#ef4444',
  },
  {
    id: 'crown_city',
    name: 'Crown City',
    subtitle: 'Neon dusk boulevard weaving between skyline towers',
    theme: 'city',
    skyHex: 0x312e81,
    fogHex: 0x4338ca,
    grassHex: '#1e293b',
    roadTintHex: '#1e293b',
    curbAccentHex: 0xfacc15,
    rockHue: 0.62,
    treeHue: 0.52,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#facc15',
  },
  {
    id: 'whistletop_summit',
    name: 'Whistletop Summit',
    subtitle: 'High-altitude ridge climb with dramatic switchbacks',
    theme: 'valley',
    skyHex: 0x93c5fd,
    fogHex: 0xbfdbfe,
    grassHex: '#4d7c0f',
    roadTintHex: '#475569',
    curbAccentHex: 0xf97316,
    rockHue: 0.04,
    treeHue: 0.26,
    goldTimeSec: 97,
    silverTimeSec: 112,
    accentHex: '#f97316',
  },
  {
    id: 'dk_spaceport',
    name: 'DK Spaceport',
    subtitle: 'Orbital launchpad climb through rocket gantries',
    theme: 'space',
    skyHex: 0x090d1f,
    fogHex: 0x172554,
    grassHex: '#0f172a',
    roadTintHex: '#334155',
    curbAccentHex: 0x22d3ee,
    rockHue: 0.6,
    treeHue: 0.55,
    goldTimeSec: 93,
    silverTimeSec: 107,
    accentHex: '#22d3ee',
  },
  {
    id: 'desert_hills',
    name: 'Desert Hills',
    subtitle: 'Sun-scorched sand dunes & terracotta mesas',
    theme: 'desert',
    skyHex: 0x7dd3fc,
    fogHex: 0xfde68a,
    grassHex: '#d99b4e',
    roadTintHex: '#785a3c',
    curbAccentHex: 0xea580c,
    rockHue: 0.07,
    treeHue: 0.3,
    goldTimeSec: 91,
    silverTimeSec: 105,
    accentHex: '#f59e0b',
  },
  {
    id: 'shy_guy_bazaar',
    name: 'Shy Guy Bazaar',
    subtitle: 'Lantern-lit desert night market & palace curves',
    theme: 'bazaar',
    skyHex: 0x2e1065,
    fogHex: 0x4c1d95,
    grassHex: '#92400e',
    roadTintHex: '#57534e',
    curbAccentHex: 0xf43f5e,
    rockHue: 0.08,
    treeHue: 0.85,
    goldTimeSec: 94,
    silverTimeSec: 108,
    accentHex: '#f43f5e',
  },
  {
    id: 'wario_stadium',
    name: 'Wario Stadium',
    subtitle: 'Floodlit dirt supercross arena with banked berms',
    theme: 'stadium',
    skyHex: 0x18181b,
    fogHex: 0x27272a,
    grassHex: '#3f2e21',
    roadTintHex: '#6b4c35',
    curbAccentHex: 0xfacc15,
    rockHue: 0.1,
    treeHue: 0.14,
    goldTimeSec: 92,
    silverTimeSec: 106,
    accentHex: '#eab308',
  },
  {
    id: 'airship_fortress',
    name: 'Airship Fortress',
    subtitle: 'Storm-swept ironwood ramparts & turret straights',
    theme: 'fortress',
    skyHex: 0x451a1a,
    fogHex: 0x7f1d1d,
    grassHex: '#27272a',
    roadTintHex: '#452b1d',
    curbAccentHex: 0xef4444,
    rockHue: 0.02,
    treeHue: 0.04,
    goldTimeSec: 96,
    silverTimeSec: 111,
    accentHex: '#dc2626',
  },
  {
    id: 'dk_pass',
    name: 'DK Pass',
    subtitle: 'Snow-packed alpine summit & icy downhill slalom',
    theme: 'snow',
    skyHex: 0x60a5fa,
    fogHex: 0xdbeafe,
    grassHex: '#e2e8f0',
    roadTintHex: '#475569',
    curbAccentHex: 0xf59e0b,
    rockHue: 0.58,
    treeHue: 0.45,
    goldTimeSec: 95,
    silverTimeSec: 110,
    accentHex: '#60a5fa',
  },
  {
    id: 'starview_peak',
    name: 'Starview Peak',
    subtitle: 'Aurora observatory ridge under glittering constellations',
    theme: 'night',
    skyHex: 0x0f172a,
    fogHex: 0x312e81,
    grassHex: '#334155',
    roadTintHex: '#1e293b',
    curbAccentHex: 0x38bdf8,
    rockHue: 0.68,
    treeHue: 0.54,
    goldTimeSec: 96,
    silverTimeSec: 110,
    accentHex: '#38bdf8',
  },
  {
    id: 'sky_high_sundae',
    name: 'Sky-High Sundae',
    subtitle: 'Floating pastel dessert coaster & waffle straights',
    theme: 'sundae',
    skyHex: 0xfbcfe8,
    fogHex: 0xfce7f3,
    grassHex: '#a5f3fc',
    roadTintHex: '#f9a8d4',
    curbAccentHex: 0xf43f5e,
    rockHue: 0.9,
    treeHue: 0.46,
    goldTimeSec: 89,
    silverTimeSec: 103,
    accentHex: '#ec4899',
  },
  {
    id: 'wario_shipyard',
    name: 'Wario Shipyard',
    subtitle: 'Misty harbor docks & sunken galleon curves',
    theme: 'shipyard',
    skyHex: 0x164e63,
    fogHex: 0x155e75,
    grassHex: '#1e3a5f',
    roadTintHex: '#4b3b2c',
    curbAccentHex: 0xfacc15,
    rockHue: 0.52,
    treeHue: 0.48,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#06b6d4',
  },
  {
    id: 'koopa_troopa_beach',
    name: 'Koopa Troopa Beach',
    subtitle: 'Sunlit turquoise lagoon & palm-fringed shoreline',
    theme: 'beach',
    skyHex: 0x38bdf8,
    fogHex: 0xbae6fd,
    grassHex: '#fde08d',
    roadTintHex: '#e7c68b',
    curbAccentHex: 0x22c55e,
    rockHue: 0.11,
    treeHue: 0.34,
    goldTimeSec: 88,
    silverTimeSec: 102,
    accentHex: '#14b8a6',
  },
  {
    id: 'faraway_oasis',
    name: 'Faraway Oasis',
    subtitle: 'Savannah riverlands & emerald waterfall oasis',
    theme: 'oasis',
    skyHex: 0x67e8f9,
    fogHex: 0xa5f3fc,
    grassHex: '#65a30d',
    roadTintHex: '#57534e',
    curbAccentHex: 0xfacc15,
    rockHue: 0.08,
    treeHue: 0.28,
    goldTimeSec: 93,
    silverTimeSec: 107,
    accentHex: '#84cc16',
  },
  {
    id: 'peach_beach',
    name: 'Peach Beach',
    subtitle: 'Coral resort coast with sunlit surf & palm coves',
    theme: 'beach',
    skyHex: 0x38bdf8,
    fogHex: 0xbae6fd,
    grassHex: '#fef08a',
    roadTintHex: '#f5d0a9',
    curbAccentHex: 0xf472b6,
    rockHue: 0.09,
    treeHue: 0.35,
    goldTimeSec: 89,
    silverTimeSec: 103,
    accentHex: '#f472b6',
  },
  {
    id: 'peach_stadium',
    name: 'Peach Stadium',
    subtitle: 'Royal championship grandstand with pink-gold floodlights',
    theme: 'stadium_royal',
    skyHex: 0x7dd3fc,
    fogHex: 0xbae6fd,
    grassHex: '#22c55e',
    roadTintHex: '#334155',
    curbAccentHex: 0xf472b6,
    rockHue: 0.9,
    treeHue: 0.33,
    goldTimeSec: 91,
    silverTimeSec: 105,
    accentHex: '#f472b6',
  },
  {
    id: 'mushroom_kingdom',
    name: 'Mushroom Kingdom',
    subtitle: 'Toadstool castle meadows & checkered royal avenues',
    theme: 'valley',
    skyHex: 0x60a5fa,
    fogHex: 0xbfdbfe,
    grassHex: '#4ade80',
    roadTintHex: '#475569',
    curbAccentHex: 0xef4444,
    rockHue: 0.06,
    treeHue: 0.31,
    goldTimeSec: 90,
    silverTimeSec: 104,
    accentHex: '#ef4444',
  },
  {
    id: 'rainbow_road',
    name: 'Rainbow Road',
    subtitle: 'Cosmic prismatic highway floating among distant stars',
    theme: 'rainbow',
    skyHex: 0x050816,
    fogHex: 0x0f172a,
    grassHex: '#020617',
    roadTintHex: '#ffffff',
    curbAccentHex: 0x38bdf8,
    rockHue: 0.56,
    treeHue: 0.78,
    goldTimeSec: 94,
    silverTimeSec: 108,
    accentHex: '#f472b6',
  },
  {
    id: 'sunshine_airport',
    name: 'Sunshine Airport',
    subtitle: 'Breezy oceanfront runway & terminal tarmac sweepers',
    theme: 'airport',
    skyHex: 0x38bdf8,
    fogHex: 0x93c5fd,
    grassHex: '#65a30d',
    roadTintHex: '#334155',
    curbAccentHex: 0xf97316,
    rockHue: 0.58,
    treeHue: 0.34,
    goldTimeSec: 92,
    silverTimeSec: 106,
    accentHex: '#f97316',
  },
  {
    id: 'dino_dino_jungle',
    name: 'Dino Dino Jungle',
    subtitle: 'Prehistoric rainforest canopy & mossy canyon gorges',
    theme: 'jungle',
    skyHex: 0x2dd4bf,
    fogHex: 0x99f6e4,
    grassHex: '#15803d',
    roadTintHex: '#57534e',
    curbAccentHex: 0x84cc16,
    rockHue: 0.25,
    treeHue: 0.33,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#22c55e',
  },
  {
    id: 'great_block_ruins',
    name: 'Great ? Block Ruins',
    subtitle: 'Ancient overgrown jungle temple & golden monoliths',
    theme: 'ruins',
    skyHex: 0x34d399,
    fogHex: 0xa7f3d0,
    grassHex: '#3f6212',
    roadTintHex: '#78716c',
    curbAccentHex: 0xfacc15,
    rockHue: 0.11,
    treeHue: 0.3,
    goldTimeSec: 96,
    silverTimeSec: 110,
    accentHex: '#facc15',
  },
  {
    id: 'boo_cinema',
    name: 'Boo Cinema',
    subtitle: 'Haunted neon drive-in theater under midnight fog',
    theme: 'cinema',
    skyHex: 0x1e1b4b,
    fogHex: 0x3b0764,
    grassHex: '#1e1b4b',
    roadTintHex: '#27272a',
    curbAccentHex: 0xc084fc,
    rockHue: 0.74,
    treeHue: 0.72,
    goldTimeSec: 94,
    silverTimeSec: 108,
    accentHex: '#c084fc',
  },
  {
    id: 'bowsers_castle',
    name: "Bowser's Castle",
    subtitle: 'Molten magma moat & spiked obsidian fortress ramparts',
    theme: 'lava',
    skyHex: 0x2a0808,
    fogHex: 0x7f1d1d,
    grassHex: '#1c1917',
    roadTintHex: '#292524',
    curbAccentHex: 0xef4444,
    rockHue: 0.02,
    treeHue: 0.03,
    goldTimeSec: 97,
    silverTimeSec: 112,
    accentHex: '#f97316',
  },
  {
    id: 'dry_bones_burnout',
    name: 'Dry Bones Burnout',
    subtitle: 'Blazing volcanic bone-yard & glowing ember switchbacks',
    theme: 'lava',
    skyHex: 0x18181b,
    fogHex: 0x451a03,
    grassHex: '#292524',
    roadTintHex: '#44403c',
    curbAccentHex: 0xf59e0b,
    rockHue: 0.08,
    treeHue: 0.06,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#facc15',
  },
  {
    id: 'toads_factory',
    name: "Toad's Factory",
    subtitle: 'Sunset brickworks, smokestacks & heavy steel curves',
    theme: 'factory',
    skyHex: 0xf97316,
    fogHex: 0xfdba74,
    grassHex: '#57534e',
    roadTintHex: '#3f3f46',
    curbAccentHex: 0xfacc15,
    rockHue: 0.06,
    treeHue: 0.08,
    goldTimeSec: 93,
    silverTimeSec: 107,
    accentHex: '#fbbf24',
  },
  {
    id: 'mario_circuit',
    name: 'Mario Circuit',
    subtitle: 'Sunlit championship circuit & sweeping royal hairpins',
    theme: 'valley',
    skyHex: 0x60a5fa,
    fogHex: 0xbfdbfe,
    grassHex: '#22c55e',
    roadTintHex: '#374151',
    curbAccentHex: 0xef4444,
    rockHue: 0.07,
    treeHue: 0.32,
    goldTimeSec: 90,
    silverTimeSec: 104,
    accentHex: '#ef4444',
  },
  {
    id: 'choco_mountain',
    name: 'Choco Mountain',
    subtitle: 'Cocoa cliff switchbacks & fudge canyon boulders',
    theme: 'valley',
    skyHex: 0xfdba74,
    fogHex: 0xfed7aa,
    grassHex: '#7c4a2d',
    roadTintHex: '#5c3317',
    curbAccentHex: 0xfbbf24,
    rockHue: 0.06,
    treeHue: 0.08,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#d97706',
  },
  {
    id: 'acorn_heights',
    name: 'Acorn Heights',
    subtitle: 'Giant woodland canopy ridges & sunlit forest curves',
    theme: 'valley',
    skyHex: 0x7dd3fc,
    fogHex: 0xbae6fd,
    grassHex: '#3f7d20',
    roadTintHex: '#6b4f35',
    curbAccentHex: 0xd97706,
    rockHue: 0.08,
    treeHue: 0.27,
    goldTimeSec: 93,
    silverTimeSec: 107,
    accentHex: '#65a30d',
  },
  {
    id: 'cheep_cheep_falls',
    name: 'Cheep Cheep Falls',
    subtitle: 'Cascading emerald riverbanks & crimson autumn maples',
    theme: 'oasis',
    skyHex: 0x38bdf8,
    fogHex: 0xa5f3fc,
    grassHex: '#4d7c0f',
    roadTintHex: '#57534e',
    curbAccentHex: 0xf43f5e,
    rockHue: 0.07,
    treeHue: 0.05,
    goldTimeSec: 92,
    silverTimeSec: 106,
    accentHex: '#f43f5e',
  },
  {
    id: 'moo_moo_meadows',
    name: 'Moo Moo Meadows',
    subtitle: 'Crisp morning pastures & clover-lined country bends',
    theme: 'valley',
    skyHex: 0x93c5fd,
    fogHex: 0xdbeafe,
    grassHex: '#4ade80',
    roadTintHex: '#785a3c',
    curbAccentHex: 0xef4444,
    rockHue: 0.08,
    treeHue: 0.32,
    goldTimeSec: 88,
    silverTimeSec: 102,
    accentHex: '#22c55e',
  },
  {
    id: 'salty_salty_speedway',
    name: 'Salty Salty Speedway',
    subtitle: 'Sun-bleached coastal salt canals & boardwalk straights',
    theme: 'beach',
    skyHex: 0x38bdf8,
    fogHex: 0xe0f2fe,
    grassHex: '#fef3c7',
    roadTintHex: '#d6c3a5',
    curbAccentHex: 0x06b6d4,
    rockHue: 0.12,
    treeHue: 0.34,
    goldTimeSec: 91,
    silverTimeSec: 105,
    accentHex: '#06b6d4',
  },
  {
    id: 'dandelion_depths',
    name: 'Dandelion Depths',
    subtitle: 'Bioluminescent crystal cavern & glowing spore trails',
    theme: 'night',
    skyHex: 0x0f172a,
    fogHex: 0x134e4a,
    grassHex: '#134e4a',
    roadTintHex: '#1e293b',
    curbAccentHex: 0xfde047,
    rockHue: 0.48,
    treeHue: 0.15,
    goldTimeSec: 95,
    silverTimeSec: 109,
    accentHex: '#fde047',
  },
  {
    id: 'bung_stadium',
    name: 'Bung Stadium',
    subtitle: '100-lap dead-straight championship stadium dragway',
    theme: 'stadium',
    skyHex: 0x0b1120,
    fogHex: 0x172554,
    grassHex: '#15803d',
    roadTintHex: '#27272a',
    curbAccentHex: 0xf59e0b,
    rockHue: 0.1,
    treeHue: 0.34,
    goldTimeSec: 18,
    silverTimeSec: 22,
    accentHex: '#f59e0b',
  },
];

export interface CupSpec {
  id: CupId;
  name: string;
  accentHex: string;
  courses: [CourseId, CourseId, CourseId, CourseId];
}

export const CUP_CATALOG: CupSpec[] = [
  {
    id: 'mushroom_cup',
    name: 'Mushroom Cup',
    accentHex: '#ef4444',
    courses: ['mario_bros_circuit', 'crown_city', 'whistletop_summit', 'dk_spaceport'],
  },
  {
    id: 'flower_cup',
    name: 'Flower Cup',
    accentHex: '#f97316',
    courses: ['desert_hills', 'shy_guy_bazaar', 'wario_stadium', 'airship_fortress'],
  },
  {
    id: 'star_cup',
    name: 'Star Cup',
    accentHex: '#38bdf8',
    courses: ['dk_pass', 'starview_peak', 'sky_high_sundae', 'wario_shipyard'],
  },
  {
    id: 'shell_cup',
    name: 'Shell Cup',
    accentHex: '#22c55e',
    courses: ['koopa_troopa_beach', 'faraway_oasis', 'crown_city', 'peach_stadium'],
  },
  {
    id: 'banana_cup',
    name: 'Banana Cup',
    accentHex: '#facc15',
    courses: ['peach_beach', 'salty_salty_speedway', 'dino_dino_jungle', 'great_block_ruins'],
  },
  {
    id: 'leaf_cup',
    name: 'Leaf Cup',
    accentHex: '#84cc16',
    courses: ['cheep_cheep_falls', 'dandelion_depths', 'boo_cinema', 'dry_bones_burnout'],
  },
  {
    id: 'lightning_cup',
    name: 'Lightning Cup',
    accentHex: '#eab308',
    courses: ['moo_moo_meadows', 'choco_mountain', 'toads_factory', 'bowsers_castle'],
  },
  {
    id: 'special_cup',
    name: 'Special Cup',
    accentHex: '#a855f7',
    courses: ['acorn_heights', 'mario_circuit', 'peach_stadium', 'rainbow_road'],
  },
  {
    id: 'rainbow_cup',
    name: 'Rainbow Cup',
    accentHex: '#ec4899',
    courses: ['sunshine_airport', 'mushroom_kingdom', 'starlight_circuit', 'bung_stadium'],
  },
];

export interface KnockoutCupSpec {
  id: KnockoutCupId;
  name: string;
  accentHex: string;
  courses: [CourseId, CourseId, CourseId, CourseId, CourseId, CourseId];
}

export const KNOCKOUT_CUP_CATALOG: KnockoutCupSpec[] = [
  {
    id: 'ko_golden_cup',
    name: 'Golden Rally',
    accentHex: '#f97316',
    courses: [
      'mario_bros_circuit',
      'crown_city',
      'whistletop_summit',
      'desert_hills',
      'shy_guy_bazaar',
      'dk_spaceport',
    ],
  },
  {
    id: 'ko_frost_cup',
    name: 'Frostbite Rally',
    accentHex: '#38bdf8',
    courses: [
      'acorn_heights',
      'dk_pass',
      'starview_peak',
      'sky_high_sundae',
      'starlight_circuit',
      'rainbow_road',
    ],
  },
  {
    id: 'ko_tidal_cup',
    name: 'Jungle Rally',
    accentHex: '#22c55e',
    courses: [
      'salty_salty_speedway',
      'koopa_troopa_beach',
      'peach_beach',
      'faraway_oasis',
      'cheep_cheep_falls',
      'dino_dino_jungle',
    ],
  },
  {
    id: 'ko_royal_cup',
    name: 'Crown Rally',
    accentHex: '#f472b6',
    courses: [
      'moo_moo_meadows',
      'mario_circuit',
      'mushroom_kingdom',
      'peach_stadium',
      'sunshine_airport',
      'wario_shipyard',
    ],
  },
  {
    id: 'ko_ember_cup',
    name: 'Ember Rally',
    accentHex: '#c084fc',
    courses: [
      'choco_mountain',
      'dandelion_depths',
      'boo_cinema',
      'airship_fortress',
      'dry_bones_burnout',
      'bowsers_castle',
    ],
  },
];

export const KNOCKOUT_STAGE_KEEP_COUNTS: readonly number[] = [12, 10, 8, 6, 4, 3];

export const GP_COURSE_ORDER: CourseId[] = CUP_CATALOG[0].courses;

export const GP_POINTS_TABLE: number[] = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0];

export function getCourseSpec(courseId: CourseId): CourseSpec {
  return COURSE_CATALOG.find((c) => c.id === courseId) ?? COURSE_CATALOG[0];
}

export function getCourseDefaultLaps(courseId: CourseId): number {
  return courseId === 'bung_stadium' ? 100 : 50;
}

export function getCupSpec(cupId?: CupId): CupSpec {
  return CUP_CATALOG.find((c) => c.id === cupId) ?? CUP_CATALOG[0];
}

export function getKnockoutCupSpec(knockoutCupId?: KnockoutCupId): KnockoutCupSpec {
  return KNOCKOUT_CUP_CATALOG.find((c) => c.id === knockoutCupId) ?? KNOCKOUT_CUP_CATALOG[0];
}

export function getGameModeSpec(mode: GameMode): GameModeSpec {
  return GAME_MODE_CATALOG.find((m) => m.id === mode) ?? GAME_MODE_CATALOG[0];
}

export const ENGINE_CLASS_MULT: Record<EngineClass, number> = {
  '10cc': 0.36,
  '50cc': 0.68,
  '100cc': 0.9,
  '150cc': 1.04,
  '200cc': 1.22,
  '300cc': 1.45,
  '400cc': 1.68,
  '500cc': 1.92,
  '1000cc': 2.55,
  '5000cc': 4.2,
  '10000cc': 6.0,
  '50000cc': 9.5,
  '1000000000000000000000cc': 15.0,
  '500000000000000000000000000000000000000000cc': 24.0,
};

export type ItemType =
  | 'bullet_bill'
  | 'spiny_shell'
  | 'invincible_star'
  | 'nitro_mushroom'
  | 'green_shell'
  | 'banana_peel'
  | 'lightning_bolt';

export interface ItemMeta {
  id: ItemType;
  label: string;
  shortDesc: string;
  accentColor: string;
}

export const ITEM_METADATA: Record<ItemType, ItemMeta> = {
  bullet_bill: {
    id: 'bullet_bill',
    label: 'Bullet Bill',
    shortDesc: '10s rocket autopilot surge',
    accentColor: '#38bdf8',
  },
  spiny_shell: {
    id: 'spiny_shell',
    label: 'Spiny Shell',
    shortDesc: 'Strikes 1st place racer',
    accentColor: '#2563eb',
  },
  invincible_star: {
    id: 'invincible_star',
    label: 'Invincible Star',
    shortDesc: '5s invincibility & knockdowns',
    accentColor: '#fbbf24',
  },
  nitro_mushroom: {
    id: 'nitro_mushroom',
    label: 'Nitro Mushroom',
    shortDesc: '2s blazing nitro boost',
    accentColor: '#f97316',
  },
  green_shell: {
    id: 'green_shell',
    label: 'Green Shell',
    shortDesc: 'Bouncing shell knocks down rivals',
    accentColor: '#22c55e',
  },
  banana_peel: {
    id: 'banana_peel',
    label: 'Banana Peel',
    shortDesc: 'Slip trap spins trailing racers',
    accentColor: '#fde047',
  },
  lightning_bolt: {
    id: 'lightning_bolt',
    label: 'Lightning Bolt',
    shortDesc: 'Zaps & shrinks all 13 rivals',
    accentColor: '#a855f7',
  },
};

export const ALL_ITEMS: ItemType[] = [
  'bullet_bill',
  'spiny_shell',
  'invincible_star',
  'nitro_mushroom',
  'green_shell',
  'banana_peel',
  'lightning_bolt',
];

export type CarCategory = 'kart' | 'bike' | 'atv' | 'heavy' | 'special';

export type CarId =
  | 'standard_kart'
  | 'rally_kart'
  | 'standard_bike'
  | 'rally_bike'
  | 'plushbuggy'
  | 'baby_blooper'
  | 'cute_scoot'
  | 'mach_rocket'
  | 'funky_dorrie'
  | 'hyper_pipe'
  | 'chargin_truck'
  | 'zoom_buggy'
  | 'hot_rod'
  | 'ribbit_revster'
  | 'tune_thumper'
  | 'junkyard_hog'
  | 'lobster_roller'
  | 'w_twin_chopper'
  | 'b_dasher'
  | 'roadster_royale'
  | 'biddybuggy'
  | 'tiny_titan'
  | 'dread_sled'
  | 'stellar_sled'
  | 'rob_hog'
  | 'fin_twin'
  | 'bumble_v'
  | 'reel_racer'
  | 'carpet_flyer'
  | 'cloud_9'
  | 'dolphin_dasher'
  | 'blastronaut_3'
  | 'mecha_trike'
  | 'loco_moto'
  | 'lil_dumpy'
  | 'big_horn'
  | 'pipe_frame'
  | 'billdozer'
  | 'rallygator'
  | 'bowser_bruiser';

export interface CarSpec {
  id: CarId;
  name: string;
  category: CarCategory;
  tagline: string;
  price: number;
  bodyColor: number;
  trimColor: number;
  hexPrimary: string;
  hexAccent: string;
  speedMult: number;
  accelMult: number;
  handlingMult: number;
  statSpeed: number;    // 1..10 for UI bars
  statAccel: number;    // 1..10 for UI bars
  statHandling: number; // 1..10 for UI bars
}

export const CAR_CATALOG: CarSpec[] = [
  {
    id: 'standard_kart',
    name: 'Standard Kart',
    category: 'kart',
    tagline: 'Balanced Mario Kart World starter chassis built for every track',
    price: 0,
    bodyColor: 0xef4444,
    trimColor: 0xf8fafc,
    hexPrimary: '#ef4444',
    hexAccent: '#f8fafc',
    speedMult: 1.0,
    accelMult: 1.0,
    handlingMult: 1.0,
    statSpeed: 6,
    statAccel: 6,
    statHandling: 6,
  },
  {
    id: 'rally_kart',
    name: 'Rally Kart',
    category: 'kart',
    tagline: 'Dirt-tuned rally chassis with mudflaps and reinforced front bumper',
    price: 10,
    bodyColor: 0x2563eb,
    trimColor: 0xfacc15,
    hexPrimary: '#2563eb',
    hexAccent: '#facc15',
    speedMult: 1.03,
    accelMult: 1.06,
    handlingMult: 1.05,
    statSpeed: 7,
    statAccel: 7,
    statHandling: 7,
  },
  {
    id: 'standard_bike',
    name: 'Standard Bike',
    category: 'bike',
    tagline: 'Nimble two-wheel street racer carving tight inner apexes',
    price: 12,
    bodyColor: 0xef4444,
    trimColor: 0x0f172a,
    hexPrimary: '#ef4444',
    hexAccent: '#38bdf8',
    speedMult: 1.02,
    accelMult: 1.08,
    handlingMult: 1.1,
    statSpeed: 7,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'rally_bike',
    name: 'Rally Bike',
    category: 'bike',
    tagline: 'Knobby trail motorbike built for dunes, jumps, and gravel hairpins',
    price: 14,
    bodyColor: 0x16a34a,
    trimColor: 0xf97316,
    hexPrimary: '#16a34a',
    hexAccent: '#f97316',
    speedMult: 1.04,
    accelMult: 1.09,
    handlingMult: 1.08,
    statSpeed: 7,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'plushbuggy',
    name: 'Plushbuggy',
    category: 'atv',
    tagline: 'Cushioned pastel cruiser with oversized bouncy shock absorbers',
    price: 16,
    bodyColor: 0xf472b6,
    trimColor: 0xfef08a,
    hexPrimary: '#f472b6',
    hexAccent: '#fef08a',
    speedMult: 1.01,
    accelMult: 1.11,
    handlingMult: 1.09,
    statSpeed: 6,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'baby_blooper',
    name: 'Baby Blooper',
    category: 'kart',
    tagline: 'Tentacle-finned squid speedster slicing cleanly through wind drag',
    price: 18,
    bodyColor: 0xf8fafc,
    trimColor: 0x1e293b,
    hexPrimary: '#f8fafc',
    hexAccent: '#38bdf8',
    speedMult: 1.05,
    accelMult: 1.07,
    handlingMult: 1.08,
    statSpeed: 7,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'cute_scoot',
    name: 'Cute Scoot',
    category: 'bike',
    tagline: 'Mint-pastel city scooter with peppy micro-turbo acceleration',
    price: 20,
    bodyColor: 0x2dd4bf,
    trimColor: 0xfb7185,
    hexPrimary: '#2dd4bf',
    hexAccent: '#fb7185',
    speedMult: 1.01,
    accelMult: 1.13,
    handlingMult: 1.12,
    statSpeed: 6,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'mach_rocket',
    name: 'Mach Rocket',
    category: 'bike',
    tagline: 'Streamlined supersonic superbike engineered for blistering straights',
    price: 22,
    bodyColor: 0x1d4ed8,
    trimColor: 0xf8fafc,
    hexPrimary: '#1d4ed8',
    hexAccent: '#38bdf8',
    speedMult: 1.11,
    accelMult: 1.04,
    handlingMult: 1.06,
    statSpeed: 9,
    statAccel: 7,
    statHandling: 7,
  },
  {
    id: 'funky_dorrie',
    name: 'Funky Dorrie',
    category: 'special',
    tagline: 'Long-necked tropical Dorrie sea-cruiser riding waves of speed',
    price: 24,
    bodyColor: 0x0284c7,
    trimColor: 0xfacc15,
    hexPrimary: '#0284c7',
    hexAccent: '#facc15',
    speedMult: 1.07,
    accelMult: 1.05,
    handlingMult: 1.07,
    statSpeed: 8,
    statAccel: 7,
    statHandling: 8,
  },
  {
    id: 'hyper_pipe',
    name: 'Hyper Pipe',
    category: 'kart',
    tagline: 'Twin emerald warp-pipe turbine chassis with pressurized boost flow',
    price: 26,
    bodyColor: 0x16a34a,
    trimColor: 0x4ade80,
    hexPrimary: '#16a34a',
    hexAccent: '#4ade80',
    speedMult: 1.09,
    accelMult: 1.07,
    handlingMult: 1.05,
    statSpeed: 8,
    statAccel: 8,
    statHandling: 7,
  },
  {
    id: 'chargin_truck',
    name: "Chargin' Truck",
    category: 'heavy',
    tagline: 'Gridiron-armored heavy pickup with spiked front tackling bumper',
    price: 28,
    bodyColor: 0x6b21a8,
    trimColor: 0xfacc15,
    hexPrimary: '#6b21a8',
    hexAccent: '#facc15',
    speedMult: 1.1,
    accelMult: 1.02,
    handlingMult: 1.01,
    statSpeed: 9,
    statAccel: 6,
    statHandling: 6,
  },
  {
    id: 'zoom_buggy',
    name: 'Zoom Buggy',
    category: 'atv',
    tagline: 'High-clearance desert dune jumper with exposed tubular roll-cage',
    price: 30,
    bodyColor: 0xea580c,
    trimColor: 0xfacc15,
    hexPrimary: '#ea580c',
    hexAccent: '#facc15',
    speedMult: 1.06,
    accelMult: 1.1,
    handlingMult: 1.08,
    statSpeed: 8,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'hot_rod',
    name: 'Hot Rod',
    category: 'kart',
    tagline: 'Chrome supercharged V8 coupe roaring with classic flame styling',
    price: 32,
    bodyColor: 0xb91c1c,
    trimColor: 0xf97316,
    hexPrimary: '#b91c1c',
    hexAccent: '#f97316',
    speedMult: 1.11,
    accelMult: 1.05,
    handlingMult: 1.03,
    statSpeed: 9,
    statAccel: 7,
    statHandling: 7,
  },
  {
    id: 'ribbit_revster',
    name: 'Ribbit Revster',
    category: 'kart',
    tagline: 'Spring-loaded neon frog roadster hopping out of sharp corners',
    price: 34,
    bodyColor: 0x65a30d,
    trimColor: 0xfef08a,
    hexPrimary: '#65a30d',
    hexAccent: '#fef08a',
    speedMult: 1.06,
    accelMult: 1.12,
    handlingMult: 1.09,
    statSpeed: 8,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'tune_thumper',
    name: 'Tune Thumper',
    category: 'bike',
    tagline: 'Subwoofer-powered street bike dropping bass beats on every boost',
    price: 36,
    bodyColor: 0xec4899,
    trimColor: 0x22d3ee,
    hexPrimary: '#ec4899',
    hexAccent: '#22d3ee',
    speedMult: 1.07,
    accelMult: 1.1,
    handlingMult: 1.1,
    statSpeed: 8,
    statAccel: 8,
    statHandling: 9,
  },
  {
    id: 'junkyard_hog',
    name: 'Junkyard Hog',
    category: 'bike',
    tagline: 'Rivet-welded scrapyard chopper with roaring twin side exhausts',
    price: 38,
    bodyColor: 0x78350f,
    trimColor: 0x94a3b8,
    hexPrimary: '#78350f',
    hexAccent: '#f97316',
    speedMult: 1.1,
    accelMult: 1.06,
    handlingMult: 1.04,
    statSpeed: 9,
    statAccel: 7,
    statHandling: 7,
  },
  {
    id: 'lobster_roller',
    name: 'Lobster Roller',
    category: 'atv',
    tagline: 'Claw-fendered crimson beach rover built to pinch the inside line',
    price: 40,
    bodyColor: 0xdc2626,
    trimColor: 0xfbbf24,
    hexPrimary: '#dc2626',
    hexAccent: '#fbbf24',
    speedMult: 1.08,
    accelMult: 1.08,
    handlingMult: 1.08,
    statSpeed: 8,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'w_twin_chopper',
    name: 'W-Twin Chopper',
    category: 'bike',
    tagline: 'Wario-badged heavy V-twin chopper dripping with golden chrome',
    price: 42,
    bodyColor: 0xeab308,
    trimColor: 0x7e22ce,
    hexPrimary: '#eab308',
    hexAccent: '#7e22ce',
    speedMult: 1.12,
    accelMult: 1.05,
    handlingMult: 1.04,
    statSpeed: 9,
    statAccel: 7,
    statHandling: 7,
  },
  {
    id: 'b_dasher',
    name: 'B Dasher',
    category: 'kart',
    tagline: 'Iconic pearl-white championship formula kart with jet-turbine nose',
    price: 44,
    bodyColor: 0xf8fafc,
    trimColor: 0xdc2626,
    hexPrimary: '#f8fafc',
    hexAccent: '#dc2626',
    speedMult: 1.13,
    accelMult: 1.08,
    handlingMult: 1.1,
    statSpeed: 9,
    statAccel: 8,
    statHandling: 9,
  },
  {
    id: 'roadster_royale',
    name: 'Roadster Royale',
    category: 'kart',
    tagline: 'Regal navy and gold luxury grand tourer fit for Mushroom royalty',
    price: 46,
    bodyColor: 0x1e3a8a,
    trimColor: 0xfacc15,
    hexPrimary: '#1e3a8a',
    hexAccent: '#facc15',
    speedMult: 1.12,
    accelMult: 1.09,
    handlingMult: 1.09,
    statSpeed: 9,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'biddybuggy',
    name: 'Biddybuggy',
    category: 'atv',
    tagline: 'Spotted ladybug featherweight with ultra-tight cornering reflexes',
    price: 48,
    bodyColor: 0xef4444,
    trimColor: 0x18181b,
    hexPrimary: '#ef4444',
    hexAccent: '#facc15',
    speedMult: 1.03,
    accelMult: 1.15,
    handlingMult: 1.14,
    statSpeed: 7,
    statAccel: 10,
    statHandling: 10,
  },
  {
    id: 'tiny_titan',
    name: 'Tiny Titan',
    category: 'heavy',
    tagline: 'Compact monster-tire 4x4 crushing rough terrain without slowing down',
    price: 50,
    bodyColor: 0x15803d,
    trimColor: 0xfbbf24,
    hexPrimary: '#15803d',
    hexAccent: '#fbbf24',
    speedMult: 1.1,
    accelMult: 1.09,
    handlingMult: 1.05,
    statSpeed: 9,
    statAccel: 8,
    statHandling: 7,
  },
  {
    id: 'dread_sled',
    name: 'Dread Sled',
    category: 'special',
    tagline: 'Obsidian spiked ice-sled slicing glaciers with razor ski runners',
    price: 52,
    bodyColor: 0x1e1b4b,
    trimColor: 0xe11d48,
    hexPrimary: '#312e81',
    hexAccent: '#e11d48',
    speedMult: 1.12,
    accelMult: 1.07,
    handlingMult: 1.08,
    statSpeed: 9,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'stellar_sled',
    name: 'Stellar Sled',
    category: 'special',
    tagline: 'Luminous starlight hover-sled gliding above cosmic Rainbow roads',
    price: 54,
    bodyColor: 0x0ea5e9,
    trimColor: 0xfef08a,
    hexPrimary: '#0ea5e9',
    hexAccent: '#fef08a',
    speedMult: 1.12,
    accelMult: 1.1,
    handlingMult: 1.11,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'rob_hog',
    name: 'R.O.B. H.O.G.',
    category: 'bike',
    tagline: 'Retro robotic gyro-cycle engineered with NES precision balance',
    price: 56,
    bodyColor: 0xd1d5db,
    trimColor: 0x991b1b,
    hexPrimary: '#d1d5db',
    hexAccent: '#dc2626',
    speedMult: 1.11,
    accelMult: 1.11,
    handlingMult: 1.1,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'fin_twin',
    name: 'Fin Twin',
    category: 'bike',
    tagline: 'Dual-fin hydro superbike slicing straightaways with aquatic trim',
    price: 58,
    bodyColor: 0x06b6d4,
    trimColor: 0xf8fafc,
    hexPrimary: '#06b6d4',
    hexAccent: '#f8fafc',
    speedMult: 1.12,
    accelMult: 1.1,
    handlingMult: 1.11,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'bumble_v',
    name: 'Bumble V',
    category: 'kart',
    tagline: 'Honeybee-striped aerodynamic V-frame buzzing with rapid turbo launches',
    price: 60,
    bodyColor: 0xfacc15,
    trimColor: 0x18181b,
    hexPrimary: '#facc15',
    hexAccent: '#18181b',
    speedMult: 1.09,
    accelMult: 1.14,
    handlingMult: 1.12,
    statSpeed: 8,
    statAccel: 10,
    statHandling: 9,
  },
  {
    id: 'reel_racer',
    name: 'Reel Racer',
    category: 'special',
    tagline: 'Classic cinema projector racer rolling big-screen speed on film reels',
    price: 62,
    bodyColor: 0x334155,
    trimColor: 0xfbbf24,
    hexPrimary: '#334155',
    hexAccent: '#fbbf24',
    speedMult: 1.11,
    accelMult: 1.11,
    handlingMult: 1.09,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'carpet_flyer',
    name: 'Carpet Flyer',
    category: 'special',
    tagline: 'Enchanted Bazaar hover-carpet weaving smoothly over sand & boosts',
    price: 64,
    bodyColor: 0x7e22ce,
    trimColor: 0xfacc15,
    hexPrimary: '#7e22ce',
    hexAccent: '#facc15',
    speedMult: 1.1,
    accelMult: 1.13,
    handlingMult: 1.13,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 10,
  },
  {
    id: 'cloud_9',
    name: 'Cloud 9',
    category: 'special',
    tagline: 'Fluffy sky-cruiser floating weightlessly through rainbow turns',
    price: 66,
    bodyColor: 0xf8fafc,
    trimColor: 0x38bdf8,
    hexPrimary: '#f8fafc',
    hexAccent: '#38bdf8',
    speedMult: 1.08,
    accelMult: 1.14,
    handlingMult: 1.14,
    statSpeed: 8,
    statAccel: 10,
    statHandling: 10,
  },
  {
    id: 'dolphin_dasher',
    name: 'Dolphin Dasher',
    category: 'bike',
    tagline: 'Sleek coastal dolphin hydro-bike leaping effortlessly over ramps',
    price: 68,
    bodyColor: 0x38bdf8,
    trimColor: 0xfef08a,
    hexPrimary: '#38bdf8',
    hexAccent: '#fef08a',
    speedMult: 1.12,
    accelMult: 1.12,
    handlingMult: 1.11,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'blastronaut_3',
    name: 'Blastronaut 3',
    category: 'special',
    tagline: 'Orbital space-shuttle rocket kart armed with triple thruster boosters',
    price: 70,
    bodyColor: 0xe2e8f0,
    trimColor: 0xf97316,
    hexPrimary: '#e2e8f0',
    hexAccent: '#f97316',
    speedMult: 1.15,
    accelMult: 1.1,
    handlingMult: 1.08,
    statSpeed: 10,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'mecha_trike',
    name: 'Mecha Trike',
    category: 'atv',
    tagline: 'Cyber-plated reverse trike locking dual front tires into apexes',
    price: 72,
    bodyColor: 0x475569,
    trimColor: 0x22d3ee,
    hexPrimary: '#475569',
    hexAccent: '#22d3ee',
    speedMult: 1.13,
    accelMult: 1.11,
    handlingMult: 1.12,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 9,
  },
  {
    id: 'loco_moto',
    name: 'Loco Moto',
    category: 'special',
    tagline: 'Steam-powered express locomotive kart chugging at full throttle',
    price: 74,
    bodyColor: 0xb91c1c,
    trimColor: 0xfacc15,
    hexPrimary: '#b91c1c',
    hexAccent: '#facc15',
    speedMult: 1.14,
    accelMult: 1.09,
    handlingMult: 1.07,
    statSpeed: 10,
    statAccel: 8,
    statHandling: 8,
  },
  {
    id: 'lil_dumpy',
    name: "Li'l Dumpy",
    category: 'heavy',
    tagline: 'Heavy-duty yellow construction dump-truck built tough for contact',
    price: 76,
    bodyColor: 0xfacc15,
    trimColor: 0x1e293b,
    hexPrimary: '#facc15',
    hexAccent: '#f97316',
    speedMult: 1.12,
    accelMult: 1.11,
    handlingMult: 1.08,
    statSpeed: 9,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'big_horn',
    name: 'Big Horn',
    category: 'atv',
    tagline: 'Longhorn chrome bull-bar quad charging through packs with raw torque',
    price: 78,
    bodyColor: 0x7c2d12,
    trimColor: 0xfef3c7,
    hexPrimary: '#92400e',
    hexAccent: '#fef3c7',
    speedMult: 1.14,
    accelMult: 1.1,
    handlingMult: 1.09,
    statSpeed: 10,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'pipe_frame',
    name: 'Pipe Frame',
    category: 'kart',
    tagline: 'Pure lightweight tubular Grand Prix legend with razor response',
    price: 80,
    bodyColor: 0xdc2626,
    trimColor: 0xe2e8f0,
    hexPrimary: '#dc2626',
    hexAccent: '#e2e8f0',
    speedMult: 1.14,
    accelMult: 1.14,
    handlingMult: 1.13,
    statSpeed: 10,
    statAccel: 10,
    statHandling: 10,
  },
  {
    id: 'billdozer',
    name: 'Billdozer',
    category: 'heavy',
    tagline: 'Armored Bullet-Bill bulldozer plowing straight through rival traffic',
    price: 85,
    bodyColor: 0x111827,
    trimColor: 0xef4444,
    hexPrimary: '#1f2937',
    hexAccent: '#ef4444',
    speedMult: 1.15,
    accelMult: 1.12,
    handlingMult: 1.09,
    statSpeed: 10,
    statAccel: 9,
    statHandling: 8,
  },
  {
    id: 'rallygator',
    name: 'Rallygator',
    category: 'kart',
    tagline: 'Swamp-armored apex predator chassis with twin gator snout intakes',
    price: 90,
    bodyColor: 0x15803d,
    trimColor: 0xa3e635,
    hexPrimary: '#15803d',
    hexAccent: '#a3e635',
    speedMult: 1.15,
    accelMult: 1.14,
    handlingMult: 1.13,
    statSpeed: 10,
    statAccel: 10,
    statHandling: 10,
  },
  {
    id: 'bowser_bruiser',
    name: 'Bowser Bruiser',
    category: 'heavy',
    tagline: 'Spiked gold-and-obsidian flagship juggernaut with triple flame pipes',
    price: 100,
    bodyColor: 0x18181b,
    trimColor: 0xfacc15,
    hexPrimary: '#eab308',
    hexAccent: '#ef4444',
    speedMult: 1.17,
    accelMult: 1.15,
    handlingMult: 1.14,
    statSpeed: 10,
    statAccel: 10,
    statHandling: 10,
  },
];

export function getCarSpec(carId: CarId): CarSpec {
  return CAR_CATALOG.find((c) => c.id === carId) ?? CAR_CATALOG[0];
}

export type CharacterId =
  | 'bingbong'
  | 'waluigi'
  | 'mario'
  | 'luigi'
  | 'wario'
  | 'black_panther'
  | 'iron_man'
  | 'bung'
  | 'yoshi'
  | 'toad'
  | 'toadette'
  | 'goomba'
  | 'peepa'
  | 'king_boo'
  | 'shy_guy'
  | 'conkdor'
  | 'bowser'
  | 'bowser_jr'
  | 'cheep_cheep'
  | 'fish_bone'
  | 'villager_boy'
  | 'villager_girl'
  | 'peach'
  | 'daisy'
  | 'rosalina'
  | 'pauline'
  | 'baby_peach'
  | 'baby_daisy'
  | 'baby_rosalina'
  | 'inkling_boy'
  | 'inkling_girl'
  | 'donkey_kong'
  | 'bully_cullibug'
  | 'cow'
  | 'penguin'
  | 'stingby'
  | 'dry_bones'
  | 'koopa_troopa'
  | 'lakitu'
  | 'birdo'
  | 'nabbit'
  | 'piranha_plant'
  | 'spike'
  | 'wiggler'
  | 'hammer_bro'
  | 'sidestepper'
  | 'cataquack'
  | 'monty_mole'
  | 'pianta'
  | 'rocky_wrench'
  | 'swoop'
  | 'pokey'
  | 'coin_coffer'
  | 'snowman'
  | 'dolphin'
  | 'para_biddybud'
  | 'chargin_chuck';

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  species: string;
  tagline: string;
  hexPrimary: string;
  hexAccent: string;
}

export const CHARACTER_CATALOG: CharacterSpec[] = [
  {
    id: 'bingbong',
    name: 'BingBong',
    species: 'Brontosaurus',
    tagline: 'Friendly green dinosaur with the signature red back disc',
    hexPrimary: '#22c55e',
    hexAccent: '#ef4444',
  },
  {
    id: 'waluigi',
    name: 'Waluigi',
    species: 'Human',
    tagline: 'Mischievous purple cap rival with a crooked mustache and relentless speed',
    hexPrimary: '#7e22ce',
    hexAccent: '#facc15',
  },
  {
    id: 'mario',
    name: 'Mario',
    species: 'Human',
    tagline: 'All-around red cap champion with classic blue overalls and turbo spirit',
    hexPrimary: '#ef4444',
    hexAccent: '#2563eb',
  },
  {
    id: 'luigi',
    name: 'Luigi',
    species: 'Human',
    tagline: 'Agile green cap speedster known for razor-sharp drifts and comebacks',
    hexPrimary: '#16a34a',
    hexAccent: '#1d4ed8',
  },
  {
    id: 'wario',
    name: 'Wario',
    species: 'Human',
    tagline: 'Heavyweight yellow cap powerhouse with a zigzag mustache and golden ambition',
    hexPrimary: '#eab308',
    hexAccent: '#7e22ce',
  },
  {
    id: 'black_panther',
    name: 'Black Panther',
    species: 'Human',
    tagline: 'Vibranium-suited apex racer with razor reflexes and stealth aerodynamics',
    hexPrimary: '#8b5cf6',
    hexAccent: '#e2e8f0',
  },
  {
    id: 'iron_man',
    name: 'Iron Man',
    species: 'Human',
    tagline: 'Arc-reactor armored ace engineered in crimson and gold titanium alloy',
    hexPrimary: '#dc2626',
    hexAccent: '#facc15',
  },
  {
    id: 'bung',
    name: 'Bung',
    species: 'Human',
    tagline: 'Goofy buck-toothed turbo speedster pulling wild faces on every overtake',
    hexPrimary: '#06b6d4',
    hexAccent: '#f97316',
  },
  {
    id: 'yoshi',
    name: 'Yoshi',
    species: 'Dinosaur',
    tagline: 'Zippy green dinosaur with a red shell saddle and unstoppable flutter-boost energy',
    hexPrimary: '#22c55e',
    hexAccent: '#ef4444',
  },
  {
    id: 'toad',
    name: 'Toad',
    species: 'Toad',
    tagline: 'Speed-loving mushroom attendant in a red-spotted cap and blue royal vest',
    hexPrimary: '#ef4444',
    hexAccent: '#2563eb',
  },
  {
    id: 'toadette',
    name: 'Toadette',
    species: 'Toad',
    tagline: 'Cheerful pink-capped speedster rocking twin pigtails and snappy cornering',
    hexPrimary: '#ec4899',
    hexAccent: '#fef08a',
  },
  {
    id: 'goomba',
    name: 'Goomba',
    species: 'Goomba',
    tagline: 'Scowling mushroom-capped underdog steering with pure grit and lower fangs',
    hexPrimary: '#b45309',
    hexAccent: '#fde68a',
  },
  {
    id: 'peepa',
    name: 'Peepa',
    species: 'Ghost',
    tagline: 'Mischievous floating sprite drifting silently through hairpin turns',
    hexPrimary: '#cbd5e1',
    hexAccent: '#f472b6',
  },
  {
    id: 'king_boo',
    name: 'King Boo',
    species: 'Ghost',
    tagline: 'Crowned phantom sovereign laughing past rivals with spectral heavyweight speed',
    hexPrimary: '#f8fafc',
    hexAccent: '#facc15',
  },
  {
    id: 'shy_guy',
    name: 'Shy Guy',
    species: 'Shy Guy',
    tagline: 'Masked crimson racer keeping a cool poker face through tight chicanes',
    hexPrimary: '#dc2626',
    hexAccent: '#f8fafc',
  },
  {
    id: 'conkdor',
    name: 'Conkdor',
    species: 'Bird',
    tagline: 'Long-necked desert condor diving nose-first into every apex with its orange beak',
    hexPrimary: '#f97316',
    hexAccent: '#1e293b',
  },
  {
    id: 'bowser',
    name: 'Bowser',
    species: 'Koopa',
    tagline: 'Fire-breathing King of the Koopas bringing spiked shell muscle to the grid',
    hexPrimary: '#16a34a',
    hexAccent: '#facc15',
  },
  {
    id: 'bowser_jr',
    name: 'Bowser Jr.',
    species: 'Koopa',
    tagline: 'Feisty prince of the Koopas rocking a toothy bandana and relentless drift speed',
    hexPrimary: '#22c55e',
    hexAccent: '#f97316',
  },
  {
    id: 'cheep_cheep',
    name: 'Cheep Cheep',
    species: 'Fish',
    tagline: 'Plump crimson flying fish flapping golden wing fins past the pack',
    hexPrimary: '#ef4444',
    hexAccent: '#facc15',
  },
  {
    id: 'fish_bone',
    name: 'Fish Bone',
    species: 'Skeleton Fish',
    tagline: 'Rattling skeletal deep-sea flyer slicing through straightaways with zero drag',
    hexPrimary: '#e2e8f0',
    hexAccent: '#38bdf8',
  },
  {
    id: 'villager_boy',
    name: 'Villager Boy',
    species: 'Villager',
    tagline: 'Cheerful island neighbor rocking his #1 red tee and pocket-full of turbo tricks',
    hexPrimary: '#ef4444',
    hexAccent: '#60a5fa',
  },
  {
    id: 'villager_girl',
    name: 'Villager Girl',
    species: 'Villager',
    tagline: 'Sunny town mayor bringing rosy cheeks, ribbon style, and cozy Grand Prix speed',
    hexPrimary: '#f472b6',
    hexAccent: '#fde047',
  },
  {
    id: 'peach',
    name: 'Peach',
    species: 'Human',
    tagline: 'Mushroom Kingdom royal racing in pink satin with golden crown grace',
    hexPrimary: '#f472b6',
    hexAccent: '#facc15',
  },
  {
    id: 'daisy',
    name: 'Daisy',
    species: 'Human',
    tagline: 'Sarasaland dynamo charging every hairpin turn with sunny orange energy',
    hexPrimary: '#f97316',
    hexAccent: '#facc15',
  },
  {
    id: 'rosalina',
    name: 'Rosalina',
    species: 'Human',
    tagline: 'Cosmic comet guardian gliding cleanly across apexes under starlight',
    hexPrimary: '#38bdf8',
    hexAccent: '#fef08a',
  },
  {
    id: 'pauline',
    name: 'Pauline',
    species: 'Human',
    tagline: 'New Donk City superstar tearing up the asphalt in crimson stage glam',
    hexPrimary: '#dc2626',
    hexAccent: '#facc15',
  },
  {
    id: 'baby_peach',
    name: 'Baby Peach',
    species: 'Human',
    tagline: 'Pint-sized pink princess zipping past rivals with fearless tiny-kart agility',
    hexPrimary: '#f9a8d4',
    hexAccent: '#fde047',
  },
  {
    id: 'baby_daisy',
    name: 'Baby Daisy',
    species: 'Human',
    tagline: 'Spunky mini monarch drifting wide with sunny pigtails and boundless pep',
    hexPrimary: '#fb923c',
    hexAccent: '#fde047',
  },
  {
    id: 'baby_rosalina',
    name: 'Baby Rosalina',
    species: 'Human',
    tagline: 'Little stargazer piloting pastel aqua speed through every boost pad',
    hexPrimary: '#67e8f9',
    hexAccent: '#fde047',
  },
  {
    id: 'inkling_boy',
    name: 'Inkling Boy',
    species: 'Inkling',
    tagline: 'Turf-war sprinter with cobalt tentacle top-knot and high-pressure drift control',
    hexPrimary: '#2563eb',
    hexAccent: '#38bdf8',
  },
  {
    id: 'inkling_girl',
    name: 'Inkling Girl',
    species: 'Inkling',
    tagline: 'Splat-zone ace blasting down straightaways in neon orange tentacle style',
    hexPrimary: '#f97316',
    hexAccent: '#a3e635',
  },
  {
    id: 'donkey_kong',
    name: 'Donkey Kong',
    species: 'Kong',
    tagline: 'Heavyweight jungle powerhouse rocking his signature red DK tie and barrel-busting speed',
    hexPrimary: '#92400e',
    hexAccent: '#ef4444',
  },
  {
    id: 'bully_cullibug',
    name: 'Bully Cullibug',
    species: 'Bully Bug',
    tagline: 'Horned obsidian-shelled charger ramming rivals off the apex with gleaming gold horns',
    hexPrimary: '#312e81',
    hexAccent: '#facc15',
  },
  {
    id: 'cow',
    name: 'Cow',
    species: 'Bovine',
    tagline: 'Moo Moo Meadows superstar drifting cleanly with a golden cowbell and spotless charm',
    hexPrimary: '#f8fafc',
    hexAccent: '#fb7185',
  },
  {
    id: 'penguin',
    name: 'Penguin',
    species: 'Penguin',
    tagline: 'Cool icy Tuxedo flyer carving frozen hairpins with frosty agility and yellow crest tufts',
    hexPrimary: '#2563eb',
    hexAccent: '#f97316',
  },
  {
    id: 'stingby',
    name: 'Stingby',
    species: 'Bee',
    tagline: 'Buzzy striped honey-bee racer hovering low into corners with razor stinger precision',
    hexPrimary: '#facc15',
    hexAccent: '#18181b',
  },
  {
    id: 'dry_bones',
    name: 'Dry Bones',
    species: 'Skeleton Koopa',
    tagline: 'Rattling undead Koopa Troopa drifting through volcanic embers with glowing yellow eyes',
    hexPrimary: '#e2e8f0',
    hexAccent: '#facc15',
  },
  {
    id: 'koopa_troopa',
    name: 'Koopa Troopa',
    species: 'Koopa',
    tagline: 'Classic green-shelled Koopa carving tight corners with joyful precision',
    hexPrimary: '#22c55e',
    hexAccent: '#facc15',
  },
  {
    id: 'lakitu',
    name: 'Lakitu',
    species: 'Koopa',
    tagline: 'Cloud-riding race referee trading his flag for a full-throttle steering wheel',
    hexPrimary: '#facc15',
    hexAccent: '#ef4444',
  },
  {
    id: 'birdo',
    name: 'Birdo',
    species: 'Birdo',
    tagline: 'Bright pink powerhouse rocking her signature crimson bow and fearless drift speed',
    hexPrimary: '#ec4899',
    hexAccent: '#ef4444',
  },
  {
    id: 'nabbit',
    name: 'Nabbit',
    species: 'Nabbit',
    tagline: 'Mischievous purple bandit snatching shortcuts with a grin-masked bandana',
    hexPrimary: '#7e22ce',
    hexAccent: '#f8fafc',
  },
  {
    id: 'piranha_plant',
    name: 'Piranha Plant',
    species: 'Plant',
    tagline: 'Snapping white-spotted chomper leaning into every turn straight from its warp pipe',
    hexPrimary: '#dc2626',
    hexAccent: '#22c55e',
  },
  {
    id: 'spike',
    name: 'Spike',
    species: 'Spike',
    tagline: 'Blue-mohawked green lizard hurling heavy spike-ball momentum down every straight',
    hexPrimary: '#16a34a',
    hexAccent: '#2563eb',
  },
  {
    id: 'wiggler',
    name: 'Wiggler',
    species: 'Caterpillar',
    tagline: 'Flower-crowned sunny caterpillar speeding faster whenever rivals bump his segments',
    hexPrimary: '#eab308',
    hexAccent: '#f97316',
  },
  {
    id: 'hammer_bro',
    name: 'Hammer Bro',
    species: 'Koopa',
    tagline: 'Helmeted Koopa elite hammering apexes with disciplined heavyweight focus',
    hexPrimary: '#15803d',
    hexAccent: '#f8fafc',
  },
  {
    id: 'sidestepper',
    name: 'Sidestepper',
    species: 'Crab',
    tagline: 'Snapping crimson beach crab sideways-drifting past everyone on coastal sand',
    hexPrimary: '#ef4444',
    hexAccent: '#fbbf24',
  },
  {
    id: 'cataquack',
    name: 'Cataquack',
    species: 'Cataquack',
    tagline: 'Coastal blue duckling flipping rivals sky-high with its wide orange bill',
    hexPrimary: '#2563eb',
    hexAccent: '#f97316',
  },
  {
    id: 'monty_mole',
    name: 'Monty Mole',
    species: 'Mole',
    tagline: 'Tunnel-digging brown speedster popping onto the grid in cool shades',
    hexPrimary: '#92400e',
    hexAccent: '#fef08a',
  },
  {
    id: 'pianta',
    name: 'Pianta',
    species: 'Pianta',
    tagline: 'Isle Delfino powerhouse rocking a sunny palm-tree topknot and aloha vibes',
    hexPrimary: '#0ea5e9',
    hexAccent: '#22c55e',
  },
  {
    id: 'rocky_wrench',
    name: 'Rocky Wrench',
    species: 'Mole',
    tagline: 'Airship-fortress pit-crew mole tuning maximum boost out of every turbo pipe',
    hexPrimary: '#64748b',
    hexAccent: '#a855f7',
  },
  {
    id: 'swoop',
    name: 'Swoop',
    species: 'Bat',
    tagline: 'Midnight cave bat banking sharply through twilight hairpins with wide purple wings',
    hexPrimary: '#6b21a8',
    hexAccent: '#f472b6',
  },
  {
    id: 'pokey',
    name: 'Pokey',
    species: 'Cactus',
    tagline: 'Spiny desert cactus tower stacked high for prickly Sun-drenched Grand Prix glory',
    hexPrimary: '#facc15',
    hexAccent: '#22c55e',
  },
  {
    id: 'coin_coffer',
    name: 'Coin Coffer',
    species: 'Coin Coffer',
    tagline: 'Jovial emerald coin-purse creature tearing down every corner of the track',
    hexPrimary: '#16a34a',
    hexAccent: '#facc15',
  },
  {
    id: 'snowman',
    name: 'Snowman',
    species: 'Snowman',
    tagline: 'Jolly carrot-nosed frost racer keeping ice-cold composure on snowy summits',
    hexPrimary: '#f8fafc',
    hexAccent: '#ef4444',
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    species: 'Dolphin',
    tagline: 'Aerodynamic ocean jumper riding coastal drafts with smooth hydrodynamic lines',
    hexPrimary: '#38bdf8',
    hexAccent: '#f8fafc',
  },
  {
    id: 'para_biddybud',
    name: 'Para-Biddybud',
    species: 'Beetle',
    tagline: 'Winged scarlet ladybug sprite buzzing tightly around inner corners',
    hexPrimary: '#ef4444',
    hexAccent: '#facc15',
  },
  {
    id: 'chargin_chuck',
    name: "Chargin' Chuck",
    species: 'Koopa',
    tagline: 'Armored gridiron Koopa linebacker blasting straight through packs at full charge',
    hexPrimary: '#7e22ce',
    hexAccent: '#facc15',
  },
];

export function getCharacterSpec(charId: CharacterId): CharacterSpec {
  return CHARACTER_CATALOG.find((c) => c.id === charId) ?? CHARACTER_CATALOG[0];
}

export interface RacerProfile {
  id: number;
  name: string;
  isPlayer: boolean;
  carId: CarId;
  characterId: CharacterId;
  kartColor: number;
  trimColor: number;
  driverColor: number;
  visorColor: number;
  hexColor: string;
  skill: number; // 0.92 - 1.04 base pace factor for CPUs
}

export const RACER_PROFILES: RacerProfile[] = [
  {
    id: 0,
    name: 'BingBong',
    isPlayer: true,
    carId: 'standard_kart',
    characterId: 'bingbong',
    kartColor: 0x16a34a,
    trimColor: 0xef4444,
    driverColor: 0x56b922,
    visorColor: 0xfef08a,
    hexColor: '#22c55e',
    skill: 1.0,
  },
  {
    id: 1,
    name: 'Waluigi',
    isPlayer: false,
    carId: 'b_dasher',
    characterId: 'waluigi',
    kartColor: 0x6b21a8,
    trimColor: 0xfacc15,
    driverColor: 0x7e22ce,
    visorColor: 0xfacc15,
    hexColor: '#9333ea',
    skill: 1.03,
  },
  {
    id: 2,
    name: 'Mario',
    isPlayer: false,
    carId: 'pipe_frame',
    characterId: 'mario',
    kartColor: 0xdc2626,
    trimColor: 0x2563eb,
    driverColor: 0xef4444,
    visorColor: 0xf8fafc,
    hexColor: '#ef4444',
    skill: 1.025,
  },
  {
    id: 3,
    name: 'Bowser',
    isPlayer: false,
    carId: 'bowser_bruiser',
    characterId: 'bowser',
    kartColor: 0x15803d,
    trimColor: 0xfacc15,
    driverColor: 0xfacc15,
    visorColor: 0xdc2626,
    hexColor: '#16a34a',
    skill: 1.028,
  },
  {
    id: 4,
    name: 'Peach',
    isPlayer: false,
    carId: 'roadster_royale',
    characterId: 'peach',
    kartColor: 0xf472b6,
    trimColor: 0xfacc15,
    driverColor: 0xf472b6,
    visorColor: 0x38bdf8,
    hexColor: '#f472b6',
    skill: 1.015,
  },
  {
    id: 5,
    name: 'Shy Guy',
    isPlayer: false,
    carId: 'rally_kart',
    characterId: 'shy_guy',
    kartColor: 0xdc2626,
    trimColor: 0xf8fafc,
    driverColor: 0xdc2626,
    visorColor: 0xf8fafc,
    hexColor: '#dc2626',
    skill: 1.005,
  },
  {
    id: 6,
    name: 'Rosalina',
    isPlayer: false,
    carId: 'stellar_sled',
    characterId: 'rosalina',
    kartColor: 0x38bdf8,
    trimColor: 0xfef08a,
    driverColor: 0x38bdf8,
    visorColor: 0xfef08a,
    hexColor: '#38bdf8',
    skill: 1.008,
  },
  {
    id: 7,
    name: 'Bung',
    isPlayer: false,
    carId: 'zoom_buggy',
    characterId: 'bung',
    kartColor: 0x0891b2,
    trimColor: 0xf97316,
    driverColor: 0x06b6d4,
    visorColor: 0xf97316,
    hexColor: '#06b6d4',
    skill: 0.99,
  },
  {
    id: 8,
    name: 'Yoshi',
    isPlayer: false,
    carId: 'standard_bike',
    characterId: 'yoshi',
    kartColor: 0x16a34a,
    trimColor: 0xef4444,
    driverColor: 0x22c55e,
    visorColor: 0xfef08a,
    hexColor: '#22c55e',
    skill: 0.99,
  },
  {
    id: 9,
    name: 'Inkling Girl',
    isPlayer: false,
    carId: 'mach_rocket',
    characterId: 'inkling_girl',
    kartColor: 0xf97316,
    trimColor: 0xa3e635,
    driverColor: 0xf97316,
    visorColor: 0xa3e635,
    hexColor: '#f97316',
    skill: 0.985,
  },
  {
    id: 10,
    name: 'Donkey Kong',
    isPlayer: false,
    carId: 'funky_dorrie',
    characterId: 'donkey_kong',
    kartColor: 0x92400e,
    trimColor: 0xef4444,
    driverColor: 0x78350f,
    visorColor: 0xfacc15,
    hexColor: '#b45309',
    skill: 1.01,
  },
  {
    id: 11,
    name: 'Cow',
    isPlayer: false,
    carId: 'plushbuggy',
    characterId: 'cow',
    kartColor: 0xf8fafc,
    trimColor: 0xf43f5e,
    driverColor: 0xf8fafc,
    visorColor: 0xfacc15,
    hexColor: '#f8fafc',
    skill: 0.975,
  },
  {
    id: 12,
    name: 'Penguin',
    isPlayer: false,
    carId: 'dolphin_dasher',
    characterId: 'penguin',
    kartColor: 0x1d4ed8,
    trimColor: 0xf97316,
    driverColor: 0x1e293b,
    visorColor: 0xf97316,
    hexColor: '#38bdf8',
    skill: 0.97,
  },
  {
    id: 13,
    name: 'King Boo',
    isPlayer: false,
    carId: 'dread_sled',
    characterId: 'king_boo',
    kartColor: 0x312e81,
    trimColor: 0xfacc15,
    driverColor: 0xf8fafc,
    visorColor: 0xdc2626,
    hexColor: '#a855f7',
    skill: 0.995,
  },
];

export interface ActiveEffectHud {
  type: 'bullet_bill' | 'invincible_star' | 'nitro_mushroom';
  remaining: number;
  duration: number;
}

export interface MinimapDot {
  id: number;
  x: number;
  z: number;
  isPlayer: boolean;
  rank: number;
  color: string;
}

export interface StandingEntry {
  id: number;
  name: string;
  isPlayer: boolean;
  isHuman?: boolean;
  rank: number;
  finishTime: number;
  hexColor: string;
  points?: number;
  cupPoints?: number;
  score?: number;
  balloons?: number;
  eliminated?: boolean;
}

export interface CupStandingEntry {
  id: number;
  name: string;
  isPlayer: boolean;
  isHuman?: boolean;
  rank: number;
  points: number;
  hexColor: string;
}

export interface KnockoutHudState {
  stageIndex: number;
  totalStages: number;
  gatesPassed: number;
  totalGates: number;
  remainingRacers: number;
  nextGateProgress: number;
  cutoffRank: number;
  isInDanger: boolean;
  eliminated: boolean;
  stageCleared: boolean;
  tourComplete: boolean;
}

export type ReplayCameraAngle = 'chase' | 'tv_trackside' | 'helicopter' | 'bumper' | 'orbit';
export type ReplaySpeed = 0.5 | 1 | 2 | 4;

export interface ReplayRacerMeta {
  id: number;
  name: string;
  characterId: CharacterId;
  carId: CarId;
  hexColor: string;
}

export interface ReplayRacerFrame {
  id: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  steerAngle: number;
  jumpY: number;
  stunSpinAngle: number;
  lap: number;
  rank: number;
  nitro: boolean;
  star: boolean;
  bullet: boolean;
  eliminated: boolean;
  balloons: number;
}

export interface ReplayFrame {
  t: number;
  racers: ReplayRacerFrame[];
}

export interface SavedRaceReplay {
  courseId: CourseId;
  mode: GameMode;
  engineClass: EngineClass;
  totalDuration: number;
  playerSlotId: number;
  racerMeta: ReplayRacerMeta[];
  frames: ReplayFrame[];
}

export interface ReplayHudState {
  active: boolean;
  paused: boolean;
  time: number;
  duration: number;
  speed: ReplaySpeed;
  cameraAngle: ReplayCameraAngle;
  targetRacerId: number;
  targetRacerName: string;
  targetRacerRank: number;
  racers: Array<{ id: number; name: string; rank: number; hexColor: string }>;
  courseId: CourseId;
  mode: GameMode;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameMode;
  courseId: CourseId;
  engineClass: EngineClass;
  isMultiplayer?: boolean;
  countdown: number; // 3, 2, 1, 0 (GO)
  rank: number;
  totalRacers: number;
  lap: number;
  totalLaps: number;
  speedKmh: number;
  heldItem: ItemType | null;
  rouletteItem: ItemType | null;
  activeEffect: ActiveEffectHud | null;
  spinyIncoming: boolean;
  driftLevel: 0 | 1 | 2;
  eventBanner: string | null;
  raceTime: number;
  minimapDots: MinimapDot[];
  minimapPath: Array<{ x: number; z: number }>;
  standings: StandingEntry[];
  // Grand Prix
  gpRaceIndex: number;
  gpTotalRaces: number;
  cupStandings: CupStandingEntry[];
  // Knockout Tour
  knockout: KnockoutHudState | null;
  // Time Trial & Ghost
  mushroomsLeft: number;
  lapSplits: number[];
  personalBest: number | null;
  newRecord: boolean;
  ghostActive: boolean;
  ghostEnabled: boolean;
  ghostDeltaSec: number | null;
  // Balloon Battle
  battleBalloons: number;
  battleScore: number;
  battleTimeLeft: number;
  // Replay Viewer
  hasReplay: boolean;
  replay: ReplayHudState | null;
}
