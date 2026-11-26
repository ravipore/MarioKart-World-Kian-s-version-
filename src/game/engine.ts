import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AudioEngine } from './audio';
import type { MusicTrackId } from './music';
import {
  createBananaPeelModel,
  createGreenShellModel,
  createKartModel,
  createSpinyShellModel,
  KartRig,
} from './models';
import { createWorldTextures, WorldTextures } from './textures';
import {
  createTrackData,
  disposeTrackData,
  ROAD_HALF_WIDTH,
  TrackData,
} from './track';
import {
  BATTLE_ARENA_RADIUS,
  BATTLE_BOOST_PADS,
  BATTLE_PILLARS,
} from './trackMath';
import {
  ALL_ITEMS,
  CarId,
  CharacterId,
  CourseId,
  CupStandingEntry,
  DEFAULT_RACE_CONFIG,
  ENGINE_CLASS_MULT,
  GamePhase,
  getCarSpec,
  getCharacterSpec,
  getCourseDefaultLaps,
  getCupSpec,
  getKnockoutCupSpec,
  GP_POINTS_TABLE,
  HudSnapshot,
  ITEM_METADATA,
  ItemType,
  KNOCKOUT_STAGE_KEEP_COUNTS,
  KnockoutHudState,
  MinimapDot,
  RACER_PROFILES,
  RaceConfig,
  RacerProfile,
  ReplayCameraAngle,
  ReplayFrame,
  ReplayHudState,
  ReplayRacerFrame,
  ReplayRacerMeta,
  ReplaySpeed,
  SavedRaceReplay,
  StandingEntry,
} from './types';
import type { RoomPlayerInfo, ServerMessage } from './multiplayerTypes';

const START_T = 0.06;
const BASE_MAX_SPEED = 62;
const BATTLE_DURATION_SEC = 90;
const TT_STORAGE_KEY = 'dino_turbo_gp_tt_v1';
const REPLAY_STORAGE_KEY = 'mkw_last_replay_v1';

const BATTLE_ITEMS: ItemType[] = [
  'green_shell',
  'banana_peel',
  'invincible_star',
  'lightning_bolt',
  'nitro_mushroom',
];

type GhostSample = [number, number, number, number, number?, number?];

interface TimeTrialRecord {
  bestTime: number;
  carId?: CarId;
  characterId?: CharacterId;
  samples: GhostSample[];
}

// Pre-allocated math helpers (zero GC inside tick)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3();
const _m1 = new THREE.Matrix4();
const _c1 = new THREE.Color();

interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  useItemPressed: boolean;
}

interface RacerState {
  profile: RacerProfile;
  carId: CarId;
  characterId: CharacterId;
  displayName: string;
  isHuman: boolean;
  rig: KartRig;
  position: THREE.Vector3;
  heading: number;
  speed: number;
  lateralVel: number;
  steerAngle: number;
  splineT: number;
  unwrappedProgress: number;
  maxProgress: number;
  lap: number;
  rank: number;
  finished: boolean;
  finishTime: number;
  eliminated: boolean;
  balloons: number;
  battleScore: number;
  battleShieldTimer: number;
  heldItem: ItemType | null;
  rouletteTimer: number;
  rouletteItem: ItemType | null;
  pendingItem: ItemType | null;
  nitroTimer: number;
  starTimer: number;
  bulletTimer: number;
  lightningSlowTimer: number;
  boostPadTimer: number;
  stunTimer: number;
  stunSpinAngle: number;
  jumpY: number;
  jumpVelY: number;
  driftDir: -1 | 0 | 1;
  driftCharge: number;
  aiTargetLat: number;
  aiItemCooldown: number;
  aiLaneTimer: number;
  aiBattleTargetId: number;
  aiBattleTimer: number;
  mpDriftLevel: 0 | 1 | 2;
  mpRouletteItem: ItemType | null;
}

interface MpRacerTarget {
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  steerAngle: number;
  jumpY: number;
  stunSpinAngle: number;
  driftLevel: 0 | 1 | 2;
}

interface SpinyShellEntity {
  mesh: THREE.Group;
  ownerId: number;
  targetId: number;
  splineT: number;
  lateral: number;
  position: THREE.Vector3;
  phase: 'chase' | 'hover';
  hoverTimer: number;
  life: number;
}

interface GreenShellEntity {
  mesh: THREE.Group;
  ownerId: number;
  position: THREE.Vector3;
  heading: number;
  speed: number;
  splineT: number;
  bouncesLeft: number;
  life: number;
}

interface BananaHazardEntity {
  mesh: THREE.Group;
  ownerId: number;
  position: THREE.Vector3;
  graceTimer: number;
  life: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  maxScale: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class RaceEngine {
  private container: HTMLElement;
  private onHudUpdate: (hud: HudSnapshot) => void;
  private audio = new AudioEngine();

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private keyLight!: THREE.DirectionalLight;
  private textures!: WorldTextures;
  private track!: TrackData;

  private isSoftwareGl = false;
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();

  private phase: GamePhase = 'title';
  private raceConfig: RaceConfig = { ...DEFAULT_RACE_CONFIG };
  private gpRaceIndex = 1;
  private knockoutStageIndex = 1;
  private knockoutEliminatedStage = new Map<number, number>();
  private cupPoints: number[] = new Array(14).fill(0);
  private mpKnockoutState: KnockoutHudState | null = null;
  private mpCupStandings: CupStandingEntry[] = [];
  private battleTimeLeft = BATTLE_DURATION_SEC;

  // Time Trial & Ghost state
  private mushroomsLeft = 3;
  private lapSplits: number[] = [];
  private lapStartTime = 0;
  private personalBest: number | null = null;
  private newRecord = false;
  private ghostEnabled = true;
  private ghostRig: KartRig | null = null;
  private ghostSamples: GhostSample[] | null = null;
  private ghostRecordCarId: CarId | null = null;
  private ghostRecordCharacterId: CharacterId | null = null;
  private ghostWheelSpin = 0;
  private recordingSamples: GhostSample[] = [];
  private recordTimer = 0;

  // Replay Recorder & Viewer state
  private lastReplay: SavedRaceReplay | null = null;
  private replayRecordingFrames: ReplayFrame[] = [];
  private replayRecordTimer = 0;
  private replayMode = false;
  private replayPaused = false;
  private replayTime = 0;
  private replaySpeed: ReplaySpeed = 1;
  private replayCameraAngle: ReplayCameraAngle = 'chase';
  private replayTargetRacerId = 0;
  private replayReturnPhase: 'title' | 'finished' = 'title';
  private replayOrbitAngle = 0.6;
  private replayTvCamPos = new THREE.Vector3(0, 12, 0);
  private replayTvCamValid = false;
  private replayRigs: Array<{ id: number; rig: KartRig; meta: ReplayRacerMeta }> = [];
  private replayLatestFrames = new Map<number, ReplayRacerFrame>();

  private countdownTimer = 3.2;
  private lastCountdownInt = 4;
  private raceTime = 0;
  private finishOrderCount = 0;
  private hitstopTimer = 0;
  private cameraShake = 0;
  private titleOrbitAngle = 0.6;
  private finishOrbitAngle = 0;
  private playerCarId: CarId = 'standard_kart';
  private playerCharacterId: CharacterId = 'bingbong';
  private uiModalOpen = false;

  private isMultiplayer = false;
  private mpMySlot = 0;
  private mpCountdown = 3;
  private mpSpinyIncoming = false;
  private mpWasStarActive = false;
  private mpInputCallback:
    | ((input: { up: boolean; down: boolean; left: boolean; right: boolean; drift: boolean; useItem: boolean }) => void)
    | null = null;
  private mpInputTimer = 0;
  private mpLastInput = { up: false, down: false, left: false, right: false, drift: false };
  private mpServerTargets: MpRacerTarget[] = [];
  private mpVisualProjectiles = new Map<
    string,
    { mesh: THREE.Group; target: THREE.Vector3; spinRate: number }
  >();

  private eventBanner: string | null = null;
  private eventBannerTimer = 0;
  private hudThrottleTimer = 0;

  private racers: RacerState[] = [];
  private spinyShells: SpinyShellEntity[] = [];
  private greenShells: GreenShellEntity[] = [];
  private bananaHazards: BananaHazardEntity[] = [];
  private shockwaves: ShockwaveRing[] = [];

  private particleMesh!: THREE.InstancedMesh;
  private particles: Particle[] = [];
  private readonly maxParticles = 240;

  private camPos = new THREE.Vector3(0, 12, -110);
  private camLook = new THREE.Vector3(0, 2, -70);

  private input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    useItemPressed: false,
  };

  constructor(container: HTMLElement, onHudUpdate: (hud: HudSnapshot) => void) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.initThree();
    this.initEntities();
    this.bindEvents();
    this.lastReplay = this.loadSavedReplay();
    this.resetRace('title');
    this.pushHudSnapshot();
    this.startLoop();
  }

  private detectSoftwareWebGL(): boolean {
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  }

  private initThree(): void {
    this.isSoftwareGl = this.detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x7cc4fa);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(skyColor, 190, 560);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(64, width / height, 0.5, 950);

    const hemi = new THREE.HemisphereLight(0xa5d8ff, 0x3b6e35, 0.78);
    this.scene.add(hemi);

    this.keyLight = new THREE.DirectionalLight(0xfff5db, 1.55);
    this.keyLight.position.set(80, 120, 60);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    const d = 65;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.camera.near = 10;
    this.keyLight.shadow.camera.far = 320;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    rimLight.position.set(-90, 55, -80);
    this.scene.add(rimLight);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createWorldTextures(maxAniso);
    this.track = createTrackData(this.scene, this.textures, this.raceConfig.courseId, false);

    // Decorative clouds in sky
    const cloudGeo = new THREE.SphereGeometry(1, 10, 8);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
    const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, 28);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const rad = 260 + (i % 4) * 55;
      dummy.position.set(Math.cos(a) * rad + 60, 75 + (i % 3) * 14, Math.sin(a) * rad - 45);
      dummy.scale.set(22 + (i % 5) * 6, 7 + (i % 3) * 2, 14 + (i % 4) * 4);
      dummy.rotation.y = a;
      dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
    }
    clouds.instanceMatrix.needsUpdate = true;
    clouds.computeBoundingSphere();
    this.scene.add(clouds);

    // Pooled InstancedMesh particles
    const pGeo = new THREE.IcosahedronGeometry(0.45, 0);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.maxParticles);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -500,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: new THREE.Color(0xffffff),
      });
      _m1.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _m1);
      this.particleMesh.setColorAt(i, _c1.setHex(0xffffff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
  }

  private initEntities(): void {
    for (const profile of RACER_PROFILES) {
      const carId = profile.isPlayer ? this.playerCarId : profile.carId;
      const characterId = profile.isPlayer ? this.playerCharacterId : profile.characterId;
      const displayName = profile.isPlayer ? getCharacterSpec(characterId).name : profile.name;
      const rig = createKartModel(profile, this.textures, carId, characterId);
      this.scene.add(rig.root);
      this.racers.push({
        profile,
        carId,
        characterId,
        displayName,
        isHuman: profile.isPlayer,
        rig,
        position: new THREE.Vector3(),
        heading: 0,
        speed: 0,
        lateralVel: 0,
        steerAngle: 0,
        splineT: START_T,
        unwrappedProgress: 0,
        maxProgress: 0,
        lap: 1,
        rank: profile.id + 1,
        finished: false,
        finishTime: 0,
        eliminated: false,
        balloons: 3,
        battleScore: 0,
        battleShieldTimer: 0,
        heldItem: null,
        rouletteTimer: 0,
        rouletteItem: null,
        pendingItem: null,
        nitroTimer: 0,
        starTimer: 0,
        bulletTimer: 0,
        lightningSlowTimer: 0,
        boostPadTimer: 0,
        stunTimer: 0,
        stunSpinAngle: 0,
        jumpY: 0,
        jumpVelY: 0,
        driftDir: 0,
        driftCharge: 0,
        aiTargetLat: 0,
        aiItemCooldown: 2 + Math.random() * 3,
        aiLaneTimer: 1 + Math.random() * 2,
        aiBattleTargetId: (profile.id + 3) % 14,
        aiBattleTimer: 2 + Math.random() * 2,
        mpDriftLevel: 0,
        mpRouletteItem: null,
      });
    }

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private getEffectiveCourseId(): CourseId {
    if (this.raceConfig.mode === 'grand_prix') {
      const cupCourses = getCupSpec(this.raceConfig.cupId).courses;
      return cupCourses[(this.gpRaceIndex - 1) % cupCourses.length];
    }
    if (this.raceConfig.mode === 'knockout_tour') {
      const koCourses = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses;
      return koCourses[(this.knockoutStageIndex - 1) % koCourses.length];
    }
    return this.raceConfig.courseId;
  }

  private getEffectiveTotalLaps(): number {
    const courseId = this.getEffectiveCourseId();
    if (this.raceConfig.mode === 'battle') return 1;
    if (this.raceConfig.mode === 'vs_race') return this.raceConfig.laps;
    if (this.raceConfig.mode === 'time_trial') {
      return courseId === 'bung_stadium' ? 100 : this.raceConfig.laps;
    }
    return getCourseDefaultLaps(courseId);
  }

  private rebuildWorldTrack(courseId: CourseId, isBattle: boolean): void {
    if (this.track.courseId === courseId && this.track.isBattle === isBattle) {
      return;
    }
    disposeTrackData(this.scene, this.track);
    this.track = createTrackData(this.scene, this.textures, courseId, isBattle);
    this.scene.background = new THREE.Color(this.track.skyHex);
    this.scene.fog = new THREE.Fog(this.track.fogHex, 190, 560);
  }

  private loadTimeTrialRecord(courseId: CourseId, engineClass: RaceConfig['engineClass']): TimeTrialRecord | null {
    try {
      const raw = localStorage.getItem(TT_STORAGE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, TimeTrialRecord>;
      return map[`${courseId}_${engineClass}`] ?? null;
    } catch {
      return null;
    }
  }

  private saveTimeTrialRecord(
    courseId: CourseId,
    engineClass: RaceConfig['engineClass'],
    record: TimeTrialRecord,
  ): void {
    try {
      const raw = localStorage.getItem(TT_STORAGE_KEY);
      const map: Record<string, TimeTrialRecord> = raw ? JSON.parse(raw) : {};
      map[`${courseId}_${engineClass}`] = record;
      localStorage.setItem(TT_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore storage errors
    }
  }

  private loadSavedReplay(): SavedRaceReplay | null {
    try {
      const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedRaceReplay;
      if (!parsed || !Array.isArray(parsed.frames) || parsed.frames.length < 2) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private persistSavedReplay(replay: SavedRaceReplay): void {
    try {
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replay));
    } catch {
      // If oversized, downsample frames 2:1 and retry once
      try {
        const trimmed: SavedRaceReplay = {
          ...replay,
          frames: replay.frames.filter((_, i) => i % 2 === 0 || i === replay.frames.length - 1),
        };
        localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // ignore storage errors
      }
    }
  }

  private ensureGhostRig(): void {
    if (this.ghostRig) {
      this.scene.remove(this.ghostRig.root);
      this.ghostRig.root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      this.ghostRig = null;
    }
    if (
      this.raceConfig.mode !== 'time_trial' ||
      !this.ghostSamples ||
      this.ghostSamples.length < 2
    ) {
      return;
    }
    const ghostRig = createKartModel(
      RACER_PROFILES[0],
      this.textures,
      this.ghostRecordCarId ?? this.playerCarId,
      this.ghostRecordCharacterId ?? this.playerCharacterId,
    );
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.44,
      roughness: 0.3,
      metalness: 0.15,
      depthWrite: false,
    });
    ghostRig.root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.material = ghostMat;
      }
    });
    ghostRig.balloonGroup.visible = false;
    ghostRig.bulletGroup.visible = false;
    ghostRig.starAuraGroup.visible = false;
    ghostRig.flameL.visible = false;
    ghostRig.flameR.visible = false;
    this.scene.add(ghostRig.root);
    this.ghostRig = ghostRig;
  }

  public setGhostEnabled(enabled: boolean): void {
    this.ghostEnabled = enabled;
    if (this.ghostRig && !enabled) {
      this.ghostRig.root.visible = false;
    }
    this.pushHudSnapshot();
  }

  public toggleGhost(): boolean {
    this.setGhostEnabled(!this.ghostEnabled);
    return this.ghostEnabled;
  }

  public setRaceConfig(patch: Partial<RaceConfig>): void {
    const prevMode = this.raceConfig.mode;
    const prevCup = this.raceConfig.cupId;
    const prevKnockoutCup = this.raceConfig.knockoutCupId;
    const prevCourse = this.raceConfig.courseId;
    this.raceConfig = {
      ...this.raceConfig,
      ...patch,
    };

    if (this.raceConfig.mode === 'grand_prix') {
      if (prevMode !== 'grand_prix' || (patch.cupId && patch.cupId !== prevCup)) {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
      }
      const cupCourses = getCupSpec(this.raceConfig.cupId).courses;
      this.raceConfig.courseId = cupCourses[this.gpRaceIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (this.raceConfig.mode === 'knockout_tour') {
      if (
        prevMode !== 'knockout_tour' ||
        (patch.knockoutCupId && patch.knockoutCupId !== prevKnockoutCup)
      ) {
        this.knockoutStageIndex = 1;
        this.knockoutEliminatedStage.clear();
      }
      const koCourses = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses;
      this.raceConfig.courseId = koCourses[this.knockoutStageIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (patch.courseId && patch.courseId !== prevCourse && patch.laps === undefined) {
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (
      this.raceConfig.mode === 'time_trial' &&
      prevMode !== 'time_trial' &&
      patch.laps === undefined
    ) {
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (this.raceConfig.courseId !== 'bung_stadium' && this.raceConfig.laps > 1000) {
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    }

    if (!this.isMultiplayer && this.phase === 'title') {
      const targetCourse = this.getEffectiveCourseId();
      const targetBattle = this.raceConfig.mode === 'battle';
      this.rebuildWorldTrack(targetCourse, targetBattle);
      this.resetRace('title');
      this.pushHudSnapshot();
    }
  }

  public getRaceConfig(): RaceConfig {
    return { ...this.raceConfig };
  }

  public startRace(options?: { keepCup?: boolean }): void {
    this.isMultiplayer = false;
    this.clearMpVisualProjectiles();
    this.audio.unlock();

    if (!options?.keepCup) {
      if (this.raceConfig.mode === 'grand_prix') {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
        this.raceConfig.courseId = getCupSpec(this.raceConfig.cupId).courses[0];
      } else if (this.raceConfig.mode === 'knockout_tour') {
        this.knockoutStageIndex = 1;
        this.knockoutEliminatedStage.clear();
        this.raceConfig.courseId = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses[0];
      }
    }

    const targetCourse = this.getEffectiveCourseId();
    if (this.raceConfig.mode === 'grand_prix' || this.raceConfig.mode === 'knockout_tour') {
      this.raceConfig.laps = getCourseDefaultLaps(targetCourse);
    }
    const targetBattle = this.raceConfig.mode === 'battle';
    this.rebuildWorldTrack(targetCourse, targetBattle);

    this.resetRace('countdown');
    this.pushHudSnapshot();
  }

  public startNextGpRace(): void {
    if (this.raceConfig.mode === 'grand_prix') {
      if (this.gpRaceIndex < 4) {
        this.gpRaceIndex++;
      } else {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
      }
      const cupCourses = getCupSpec(this.raceConfig.cupId).courses;
      this.raceConfig.courseId = cupCourses[this.gpRaceIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
      this.startRace({ keepCup: true });
      return;
    }

    if (this.raceConfig.mode === 'knockout_tour') {
      const playerEliminated = this.racers[0]?.eliminated ?? false;
      if (this.knockoutStageIndex < KNOCKOUT_STAGE_KEEP_COUNTS.length && !playerEliminated) {
        this.knockoutStageIndex++;
      } else {
        this.knockoutStageIndex = 1;
        this.knockoutEliminatedStage.clear();
      }
      const koCourses = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses;
      this.raceConfig.courseId = koCourses[this.knockoutStageIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
      this.startRace({ keepCup: true });
    }
  }

  public togglePause(): void {
    if (this.isMultiplayer) return;
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.audio.updateEngine(false, 0, false, false);
      this.audio.setMusicPaused(true);
      this.pushHudSnapshot();
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.lastTime = performance.now();
      this.audio.setMusicPaused(false);
      this.pushHudSnapshot();
    }
  }

  public returnToTitle(): void {
    this.audio.stopStarMusic();
    this.audio.stopMusic();
    this.audio.updateEngine(false, 0, false, false);
    if (this.raceConfig.mode === 'grand_prix') {
      this.gpRaceIndex = 1;
      this.cupPoints.fill(0);
      this.raceConfig.courseId = getCupSpec(this.raceConfig.cupId).courses[0];
    } else if (this.raceConfig.mode === 'knockout_tour') {
      this.knockoutStageIndex = 1;
      this.knockoutEliminatedStage.clear();
      this.raceConfig.courseId = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses[0];
    }
    const targetCourse = this.getEffectiveCourseId();
    this.rebuildWorldTrack(targetCourse, this.raceConfig.mode === 'battle');
    this.resetRace('title');
    this.audio.startMusic('title', { reset: true });
    this.pushHudSnapshot();
  }

  public toggleMute(): boolean {
    this.audio.unlock();
    const next = !this.audio.isMuted();
    this.audio.setMuted(next);
    return next;
  }

  public isMuted(): boolean {
    return this.audio.isMuted();
  }

  public triggerUseItem(): void {
    this.audio.unlock();
    this.input.useItemPressed = true;
  }

  public setUiModalOpen(open: boolean): void {
    this.uiModalOpen = open;
  }

  public playPurchaseSound(): void {
    this.audio.unlock();
    this.audio.playItemAcquire();
  }

  private disposeReplayRigs(): void {
    for (const entry of this.replayRigs) {
      this.scene.remove(entry.rig.root);
      entry.rig.root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material?.dispose();
        }
      });
    }
    this.replayRigs = [];
    this.replayLatestFrames.clear();
  }

  public startReplay(): void {
    if (!this.lastReplay || this.lastReplay.frames.length < 2) return;
    this.audio.unlock();
    this.audio.stopStarMusic();
    this.audio.updateEngine(false, 0, false, false);
    this.clearProjectiles();
    this.clearMpVisualProjectiles();
    this.disposeReplayRigs();

    this.replayReturnPhase = this.phase === 'finished' ? 'finished' : 'title';
    this.replayMode = true;
    this.replayPaused = false;
    this.replayTime = 0;
    this.replaySpeed = 1;
    this.replayCameraAngle = 'chase';
    this.replayTargetRacerId = this.lastReplay.playerSlotId;
    this.replayTvCamValid = false;
    this.replayOrbitAngle = 0.6;

    const isBattle = this.lastReplay.mode === 'battle';
    this.rebuildWorldTrack(this.lastReplay.courseId, isBattle);

    for (const r of this.racers) {
      r.rig.root.visible = false;
    }
    if (this.ghostRig) {
      this.ghostRig.root.visible = false;
    }

    for (const meta of this.lastReplay.racerMeta) {
      const baseProfile = RACER_PROFILES[meta.id] ?? RACER_PROFILES[0];
      const replayProfile: RacerProfile = {
        ...baseProfile,
        name: meta.name,
        isPlayer: meta.id === this.lastReplay.playerSlotId,
        carId: meta.carId,
        characterId: meta.characterId,
        hexColor: meta.hexColor,
      };
      const rig = createKartModel(replayProfile, this.textures, meta.carId, meta.characterId);
      rig.balloonGroup.visible = isBattle;
      this.scene.add(rig.root);
      this.replayRigs.push({ id: meta.id, rig, meta });
    }

    this.applyReplayFrameAtTime(this.replayTime, 0);
    const initialTarget = this.replayLatestFrames.get(this.replayTargetRacerId);
    if (initialTarget) {
      const fwdX = Math.sin(initialTarget.heading);
      const fwdZ = Math.cos(initialTarget.heading);
      this.camPos.set(
        initialTarget.x - fwdX * 11,
        initialTarget.y + 5.2,
        initialTarget.z - fwdZ * 11,
      );
      this.camLook.set(
        initialTarget.x + fwdX * 9,
        initialTarget.y + 1.8,
        initialTarget.z + fwdZ * 9,
      );
    }
    const replayTrackId: MusicTrackId =
      this.lastReplay.mode === 'battle' ? 'battle' : this.lastReplay.courseId;
    this.audio.startMusic(replayTrackId, { reset: true });
    this.pushHudSnapshot();
  }

  public stopReplay(): void {
    if (!this.replayMode) return;
    this.replayMode = false;
    this.replayPaused = false;
    this.audio.stopMusic();
    this.disposeReplayRigs();

    if (this.replayReturnPhase === 'finished') {
      const targetCourse = this.getEffectiveCourseId();
      this.rebuildWorldTrack(targetCourse, this.raceConfig.mode === 'battle');
      const isTimeTrial = this.raceConfig.mode === 'time_trial';
      for (const r of this.racers) {
        r.rig.root.visible = isTimeTrial ? r.profile.isPlayer : !r.eliminated;
      }
      this.pushHudSnapshot();
    } else {
      this.returnToTitle();
    }
  }

  public setReplayPaused(paused: boolean): void {
    if (!this.replayMode) return;
    if (!paused && this.lastReplay && this.replayTime >= this.lastReplay.totalDuration - 0.02) {
      this.replayTime = 0;
    }
    this.replayPaused = paused;
    this.audio.setMusicPaused(paused);
    this.pushHudSnapshot();
  }

  public toggleReplayPaused(): void {
    this.setReplayPaused(!this.replayPaused);
  }

  public seekReplay(timeSec: number): void {
    if (!this.replayMode || !this.lastReplay) return;
    this.replayTime = THREE.MathUtils.clamp(timeSec, 0, this.lastReplay.totalDuration);
    this.applyReplayFrameAtTime(this.replayTime, 0);
    this.replayTvCamValid = false;
    this.pushHudSnapshot();
  }

  public rewindReplay(deltaSec = 5): void {
    if (!this.replayMode) return;
    this.seekReplay(this.replayTime - deltaSec);
  }

  public setReplaySpeed(speed: ReplaySpeed): void {
    if (!this.replayMode) return;
    this.replaySpeed = speed;
    this.pushHudSnapshot();
  }

  public setReplayCameraAngle(angle: ReplayCameraAngle): void {
    if (!this.replayMode) return;
    this.replayCameraAngle = angle;
    this.replayTvCamValid = false;
    this.pushHudSnapshot();
  }

  public setReplayTargetRacer(racerId: number): void {
    if (!this.replayMode) return;
    this.replayTargetRacerId = racerId;
    this.replayTvCamValid = false;
    this.pushHudSnapshot();
  }

  private getLocalPlayer(): RacerState {
    if (this.isMultiplayer) {
      return this.racers[this.mpMySlot] ?? this.racers[0];
    }
    return this.racers[0];
  }

  private rebuildRacerRig(racer: RacerState): void {
    this.scene.remove(racer.rig.root);
    racer.rig.root.traverse((obj) => {
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

    const isGenericCpu = !racer.isHuman && racer.displayName !== getCharacterSpec(racer.characterId).name;
    const rigProfile = isGenericCpu
      ? { ...racer.profile, id: 99, isPlayer: false }
      : racer.isHuman === racer.profile.isPlayer
        ? racer.profile
        : { ...racer.profile, isPlayer: racer.isHuman };
    racer.rig = createKartModel(rigProfile, this.textures, racer.carId, racer.characterId);
    this.scene.add(racer.rig.root);
    this.syncKartVisuals(racer, 0);
  }

  public setPlayerCar(carId: CarId): void {
    this.playerCarId = carId;
    if (this.isMultiplayer) return;
    const player = this.racers[0];
    if (!player || player.carId === carId) return;

    player.carId = carId;
    this.rebuildRacerRig(player);
  }

  public setPlayerCharacter(charId: CharacterId): void {
    this.playerCharacterId = charId;
    if (this.isMultiplayer || this.racers.length === 0) return;

    const spec = getCharacterSpec(charId);
    for (const r of this.racers) {
      const prevCharId = r.characterId;
      const prevCarId = r.carId;
      const prevIsHuman = r.isHuman;
      r.isHuman = r.profile.isPlayer;
      r.carId = r.profile.isPlayer ? this.playerCarId : r.profile.carId;
      if (r.profile.isPlayer) {
        r.characterId = charId;
        r.displayName = spec.name;
      } else if (charId !== 'bingbong' && r.profile.name.toLowerCase() === spec.name.toLowerCase()) {
        r.characterId = 'bung';
        r.displayName = 'Chris';
      } else {
        r.characterId = r.profile.characterId;
        r.displayName = r.profile.name;
      }

      if (r.characterId !== prevCharId || r.carId !== prevCarId || r.isHuman !== prevIsHuman) {
        this.rebuildRacerRig(r);
      }
    }
    this.pushHudSnapshot();
  }

  public setMultiplayerInputCallback(
    cb: ((input: { up: boolean; down: boolean; left: boolean; right: boolean; drift: boolean; useItem: boolean }) => void) | null,
  ): void {
    this.mpInputCallback = cb;
  }

  private clearMpVisualProjectiles(): void {
    for (const entry of this.mpVisualProjectiles.values()) {
      this.scene.remove(entry.mesh);
    }
    this.mpVisualProjectiles.clear();
  }

  public configureMultiplayerRoster(
    mySlot: number,
    players: RoomPlayerInfo[],
    raceConfig?: RaceConfig,
    gpRaceIndex?: number,
    cupStandings?: CupStandingEntry[],
    knockoutStageIndex?: number,
    knockoutEliminatedIds?: number[],
  ): void {
    this.isMultiplayer = true;
    this.mpMySlot = mySlot;
    this.mpWasStarActive = false;
    this.input.useItemPressed = false;
    this.clearProjectiles();
    this.clearMpVisualProjectiles();
    this.mpServerTargets = [];

    if (raceConfig) {
      this.raceConfig = { ...raceConfig };
    }
    if (typeof gpRaceIndex === 'number') {
      this.gpRaceIndex = gpRaceIndex;
    }
    if (typeof knockoutStageIndex === 'number') {
      this.knockoutStageIndex = knockoutStageIndex;
    }
    this.mpCupStandings = cupStandings ?? [];
    this.mpKnockoutState = null;

    if (this.ghostRig) {
      this.ghostRig.root.visible = false;
    }

    const effectiveCourse = this.getEffectiveCourseId();
    const isBattle = this.raceConfig.mode === 'battle';
    this.rebuildWorldTrack(effectiveCourse, isBattle);

    const elimSet = new Set(knockoutEliminatedIds ?? []);
    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      const p = players[i];
      if (!p) continue;
      const needsRebuild =
        r.characterId !== p.characterId ||
        r.carId !== p.carId ||
        r.isHuman !== !p.isCpu;
      r.characterId = p.characterId;
      r.carId = p.carId;
      r.displayName = p.name;
      r.isHuman = !p.isCpu;
      r.eliminated = elimSet.has(i);
      r.balloons = 3;
      r.battleScore = 0;
      r.rig.root.visible = !r.eliminated;
      if (needsRebuild) {
        this.rebuildRacerRig(r);
      }
    }
  }

  public exitMultiplayerMode(): void {
    this.isMultiplayer = false;
    this.mpMySlot = 0;
    this.mpWasStarActive = false;
    this.mpServerTargets = [];
    this.mpKnockoutState = null;
    this.mpCupStandings = [];
    this.clearMpVisualProjectiles();
    this.audio.stopStarMusic();
    this.audio.stopMusic();
    this.audio.updateEngine(false, 0, false, false);

    this.setPlayerCharacter(this.playerCharacterId);
    const targetCourse = this.getEffectiveCourseId();
    this.rebuildWorldTrack(targetCourse, this.raceConfig.mode === 'battle');
    this.resetRace('title');
    this.audio.startMusic('title', { reset: true });
    this.pushHudSnapshot();
  }

  public applyMultiplayerState(msg: Extract<ServerMessage, { type: 'race_state' }>): void {
    if (!this.isMultiplayer) return;

    const prevPhase = this.phase;
    this.phase = msg.phase;
    this.mpCountdown = msg.countdown;
    this.raceTime = msg.raceTime;
    this.raceConfig.mode = msg.mode;
    this.raceConfig.courseId = msg.courseId;
    this.raceConfig.engineClass = msg.engineClass;
    this.raceConfig.laps = msg.totalLaps;
    this.gpRaceIndex = msg.gpRaceIndex;
    this.mpCupStandings = msg.cupStandings;
    this.battleTimeLeft = msg.battleTimeLeft;

    if (this.track.courseId !== msg.courseId || this.track.isBattle !== (msg.mode === 'battle')) {
      this.rebuildWorldTrack(msg.courseId, msg.mode === 'battle');
    }

    if (prevPhase !== 'countdown' && msg.phase === 'countdown') {
      this.audio.unlock();
      this.audio.stopStarMusic();
      this.audio.stopMusic();
      this.mpWasStarActive = false;
      this.eventBanner = null;
      this.eventBannerTimer = 0;
      this.replayRecordingFrames = [];
      this.replayRecordTimer = 0;
    }

    for (const sr of msg.racers) {
      const r = this.racers[sr.id];
      if (!r) continue;
      const hadTarget = Boolean(this.mpServerTargets[sr.id]);
      const prevDistSq = hadTarget
        ? (r.position.x - sr.x) ** 2 + (r.position.z - sr.z) ** 2
        : 9999;

      this.mpServerTargets[sr.id] = {
        x: sr.x,
        y: sr.y,
        z: sr.z,
        heading: sr.heading,
        speed: sr.speed,
        steerAngle: sr.steerAngle,
        jumpY: sr.jumpY,
        stunSpinAngle: sr.stunSpinAngle,
        driftLevel: sr.driftLevel,
      };

      if (!hadTarget || prevDistSq > 400) {
        const dzWrap = sr.z - r.position.z;
        if (this.track.isStraight && sr.id === this.mpMySlot && Math.abs(dzWrap) > 120) {
          this.camPos.z += dzWrap;
          this.camLook.z += dzWrap;
          this.camera.position.z += dzWrap;
        }
        r.position.set(sr.x, sr.y, sr.z);
        r.heading = sr.heading;
        r.jumpY = sr.jumpY;
        r.stunSpinAngle = sr.stunSpinAngle;
        r.speed = sr.speed;
        r.steerAngle = sr.steerAngle;
        this.syncKartVisuals(r, 0);
      }

      r.lap = sr.lap;
      r.rank = sr.rank;
      r.finished = sr.finished;
      r.finishTime = sr.finishTime;
      r.heldItem = sr.heldItem;
      r.mpRouletteItem = sr.rouletteItem;
      r.nitroTimer = sr.nitroTimer;
      r.starTimer = sr.starTimer;
      r.bulletTimer = sr.bulletTimer;
      r.lightningSlowTimer = sr.lightningSlowTimer;
      r.boostPadTimer = sr.boostPadTimer;
      r.stunTimer = sr.stunTimer;
      r.mpDriftLevel = sr.driftLevel;
      r.eliminated = Boolean(sr.eliminated);
      r.rig.root.visible = !r.eliminated;
      r.balloons = typeof sr.balloons === 'number' ? sr.balloons : 3;
      r.battleScore = typeof sr.battleScore === 'number' ? sr.battleScore : 0;
    }

    const me = this.getLocalPlayer();
    if (msg.knockout) {
      this.mpKnockoutState = {
        ...msg.knockout,
        isInDanger: !me.eliminated && me.rank > msg.knockout.cutoffRank,
        eliminated: me.eliminated,
      };
    } else {
      this.mpKnockoutState = null;
    }

    if (prevPhase !== 'countdown' && msg.phase === 'countdown') {
      _v1.set(Math.sin(me.heading), 0, Math.cos(me.heading));
      this.camPos.copy(me.position).addScaledVector(_v1, -11.5);
      this.camPos.y += 5.2;
      this.camLook.copy(me.position).addScaledVector(_v1, 8);
      this.camLook.y += 1.8;
    }

    const isStar = me.starTimer > 0;
    if (isStar && !this.mpWasStarActive) {
      this.audio.startStarMusic();
    } else if (!isStar && this.mpWasStarActive) {
      this.audio.stopStarMusic();
    }
    this.mpWasStarActive = isStar;

    for (let i = 0; i < this.track.itemBoxes.length; i++) {
      const active = msg.projectiles.itemBoxActive[i];
      if (active !== undefined) {
        this.track.itemBoxes[i].mesh.visible = active;
        this.track.itemBoxes[i].respawnTimer = active ? 0 : 1;
      }
    }

    this.mpSpinyIncoming = msg.projectiles.spinyShells.some((s) => s.targetId === this.mpMySlot);
    const activeKeys = new Set<string>();
    const syncList = (
      prefix: string,
      items: Array<{ id: number; x: number; y: number; z: number }>,
      factory: () => THREE.Group,
      spinRate: number,
    ) => {
      for (const item of items) {
        const key = `${prefix}_${item.id}`;
        activeKeys.add(key);
        let entry = this.mpVisualProjectiles.get(key);
        if (!entry) {
          const mesh = factory();
          mesh.position.set(item.x, item.y, item.z);
          this.scene.add(mesh);
          entry = {
            mesh,
            target: new THREE.Vector3(item.x, item.y, item.z),
            spinRate,
          };
          this.mpVisualProjectiles.set(key, entry);
        } else {
          entry.target.set(item.x, item.y, item.z);
        }
      }
    };

    syncList('spiny', msg.projectiles.spinyShells, createSpinyShellModel, 10);
    syncList('gshell', msg.projectiles.greenShells, createGreenShellModel, 13);
    syncList('banana', msg.projectiles.bananaHazards, createBananaPeelModel, 0);

    for (const [key, entry] of this.mpVisualProjectiles.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(entry.mesh);
        this.mpVisualProjectiles.delete(key);
      }
    }

    const totalLaps = this.getEffectiveTotalLaps();
    for (const ev of msg.events) {
      switch (ev.type) {
        case 'countdown':
          this.audio.playCountdown(false);
          break;
        case 'go':
          this.audio.playCountdown(true);
          this.audio.startMusic(msg.mode === 'battle' ? 'battle' : msg.courseId, { reset: true });
          this.showBanner(
            this.raceConfig.mode === 'battle'
              ? 'BATTLE START! POP RIVAL BALLOONS!'
              : this.raceConfig.mode === 'knockout_tour'
                ? this.mpKnockoutState?.stageIndex === 6
                  ? 'FINAL STAGE 6/6 — RACE FOR GOLD!'
                  : `STAGE ${this.mpKnockoutState?.stageIndex ?? 1}/6 — TOP ${this.mpKnockoutState?.cutoffRank ?? 12} ADVANCE!`
                : 'GO! TOP 3 WIN!',
            1.8,
          );
          break;
        case 'item_pickup':
          if (ev.x !== undefined && ev.y !== undefined && ev.z !== undefined) {
            this.spawnBurst(_v4.set(ev.x, ev.y, ev.z), 10, 0x38bdf8, 10, 0.45);
          }
          break;
        case 'item_roulette_tick':
          if (ev.racerId === this.mpMySlot) this.audio.playRouletteTick();
          break;
        case 'item_acquire':
          if (ev.racerId === this.mpMySlot) this.audio.playItemAcquire();
          break;
        case 'boost_pad':
          if (ev.racerId === this.mpMySlot) this.audio.playNitroBoost();
          break;
        case 'drift_release':
          if (ev.racerId === this.mpMySlot) this.audio.playDriftRelease();
          break;
        case 'balloon_pop':
          if (ev.x !== undefined && ev.y !== undefined && ev.z !== undefined) {
            this.spawnBurst(_v4.set(ev.x, ev.y, ev.z), 16, 0xf43f5e, 14, 0.55);
          }
          if (ev.racerId === this.mpMySlot || ev.targetId === this.mpMySlot) {
            this.audio.playBalloonPop();
            if (ev.racerId === this.mpMySlot && ev.targetId !== this.mpMySlot) {
              const victimName = this.racers[ev.targetId ?? -1]?.displayName ?? 'RIVAL';
              this.showBanner(`POPPED ${victimName.toUpperCase()}'S BALLOON! (+1 PT)`, 1.5);
            }
          }
          break;
        case 'eliminated':
          if (ev.x !== undefined && ev.y !== undefined && ev.z !== undefined) {
            this.spawnBurst(_v4.set(ev.x, ev.y, ev.z), 20, 0xf97316, 16, 0.65);
          }
          if (ev.racerId === this.mpMySlot) {
            this.audio.playElimination();
            this.showBanner('KNOCKED OUT OF THE TOUR!', 2.4);
          } else if (ev.text) {
            this.showBanner(ev.text, 1.5);
          }
          break;
        case 'knockdown':
          if (ev.x !== undefined && ev.y !== undefined && ev.z !== undefined) {
            this.spawnBurst(_v4.set(ev.x, ev.y, ev.z), 12, ev.colorHex ?? 0xfacc15, 13, 0.55);
          }
          if (ev.racerId === this.mpMySlot) this.audio.playBump();
          break;
        case 'spiny_explode':
          if (ev.x !== undefined && ev.y !== undefined && ev.z !== undefined) {
            _v4.set(ev.x, ev.y, ev.z);
            this.spawnShockwave(_v4, 0x2563eb, 14);
            this.spawnBurst(_v4, 28, 0x3b82f6, 18, 0.7);
            if (ev.targetId === this.mpMySlot || ev.racerId === this.mpMySlot) {
              this.audio.playSpinyExplosion();
              this.cameraShake = ev.targetId === this.mpMySlot ? 0.6 : 0.25;
              this.showBanner(ev.targetId === this.mpMySlot ? 'STRUCK BY SPINY SHELL!' : (ev.text ?? 'SPINY SHELL HIT!'), 1.8);
            }
          }
          break;
        case 'item_use': {
          const isMe = ev.racerId === this.mpMySlot;
          if (ev.item === 'lightning_bolt') {
            this.audio.playLightningStrike();
            this.cameraShake = 0.45;
          } else if (isMe) {
            if (ev.item === 'bullet_bill') {
              this.audio.playBulletBill();
              this.cameraShake = 0.4;
              this.showBanner('BULLET BILL LAUNCH — 10s!', 1.8);
            } else if (ev.item === 'nitro_mushroom') {
              this.audio.playNitroBoost();
              this.showBanner('NITRO BOOST — 2s!', 1.4);
            } else if (ev.item === 'invincible_star') {
              this.showBanner('INVINCIBLE STAR — 5s!', 1.8);
            } else if (ev.item === 'green_shell') {
              this.audio.playGreenShellLaunch();
            } else if (ev.item === 'banana_peel') {
              this.audio.playBananaDrop();
            } else if (ev.item === 'spiny_shell') {
              this.audio.playSpinyLaunch();
            }
          }
          break;
        }
        case 'lap':
          if (ev.racerId === this.mpMySlot && ev.value) {
            const isFinalLap = ev.value === totalLaps;
            this.audio.playLapComplete(isFinalLap);
            if (isFinalLap && totalLaps > 1) {
              this.audio.setMusicFinalLap(true);
            }
            this.showBanner(isFinalLap ? 'FINAL LAP!' : `LAP ${ev.value} / ${totalLaps}`, 2.0);
          }
          break;
        case 'finish':
          if (ev.racerId === this.mpMySlot) {
            this.audio.playLapComplete(true);
            this.showBanner(`FINISHED ${me.rank <= 3 ? 'IN TOP 3!' : `P${me.rank}!`}`, 2.5);
          }
          break;
        case 'banner':
          if (ev.text && (ev.racerId === this.mpMySlot || ev.targetId === this.mpMySlot || ev.text.includes('LIGHTNING'))) {
            this.showBanner(ev.text, 1.8);
          }
          break;
      }
    }

    if (prevPhase !== 'playing' && msg.phase === 'playing') {
      this.audio.startMusic(msg.mode === 'battle' ? 'battle' : msg.courseId, {
        finalLap: me.lap >= totalLaps && totalLaps > 1,
      });
    }

    if (prevPhase !== 'finished' && msg.phase === 'finished') {
      this.finishOrbitAngle = 0;
      this.audio.stopStarMusic();
      this.audio.stopMusic();
      this.audio.updateEngine(false, 0, false, false);
      this.audio.playFinishFanfare(me.rank <= 3 && !me.eliminated);
      this.finalizeSavedReplay();
      this.pushHudSnapshot();
    } else if (prevPhase !== msg.phase) {
      this.pushHudSnapshot();
    }
  }

  private clearProjectiles(): void {
    for (const s of this.spinyShells) this.scene.remove(s.mesh);
    this.spinyShells.length = 0;

    for (const gs of this.greenShells) this.scene.remove(gs.mesh);
    this.greenShells.length = 0;

    for (const bh of this.bananaHazards) this.scene.remove(bh.mesh);
    this.bananaHazards.length = 0;

    for (const sw of this.shockwaves) this.scene.remove(sw.mesh);
    this.shockwaves.length = 0;
  }

  private resetRace(targetPhase: GamePhase): void {
    this.clearProjectiles();
    this.audio.stopStarMusic();
    this.audio.stopMusic();
    this.phase = targetPhase;
    this.countdownTimer = 3.2;
    this.lastCountdownInt = 4;
    this.raceTime = 0;
    this.finishOrderCount = 0;
    this.hitstopTimer = 0;
    this.cameraShake = 0;
    this.eventBanner = null;
    this.eventBannerTimer = 0;
    this.input.useItemPressed = false;
    this.battleTimeLeft = BATTLE_DURATION_SEC;

    const isTimeTrial = this.raceConfig.mode === 'time_trial';
    const isBattle = this.raceConfig.mode === 'battle';
    const isKnockout = this.raceConfig.mode === 'knockout_tour';
    const isVsSolo = this.raceConfig.mode === 'vs_race' && Boolean(this.raceConfig.vsSolo);
    const hideBoxes = isTimeTrial || this.raceConfig.itemFrequency === 'none';

    for (const box of this.track.itemBoxes) {
      box.respawnTimer = hideBoxes ? 9999 : 0;
      box.mesh.visible = !hideBoxes;
    }

    // Time Trial & Replay setup
    this.mushroomsLeft = isTimeTrial ? 3 : 0;
    this.lapSplits = [];
    this.lapStartTime = 0;
    this.newRecord = false;
    this.recordingSamples = [];
    this.recordTimer = 0;
    this.ghostWheelSpin = 0;
    this.replayRecordingFrames = [];
    this.replayRecordTimer = 0;
    if (isTimeTrial) {
      const rec = this.loadTimeTrialRecord(this.getEffectiveCourseId(), this.raceConfig.engineClass);
      this.personalBest = rec ? rec.bestTime : null;
      this.ghostSamples = rec ? rec.samples : null;
      this.ghostRecordCarId = rec?.carId ?? null;
      this.ghostRecordCharacterId = rec?.characterId ?? null;
      this.ensureGhostRig();
    } else {
      this.personalBest = null;
      this.ghostSamples = null;
      this.ghostRecordCarId = null;
      this.ghostRecordCharacterId = null;
      if (this.ghostRig) this.ghostRig.root.visible = false;
    }

    const baseSlots: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 11, 12, 13];
    const activeSlots = isVsSolo
      ? [0]
      : isKnockout
        ? baseSlots.filter((id) => !this.knockoutEliminatedStage.has(id))
        : baseSlots;

    let activeGridIdx = 0;
    baseSlots.forEach((racerId, slotIdx) => {
      const racer = this.racers[racerId];
      const preEliminated =
        (isKnockout && this.knockoutEliminatedStage.has(racerId)) ||
        (isVsSolo && !racer.profile.isPlayer);
      if (isTimeTrial) {
        this.track.sampleAt(START_T - 0.006, _v1, _v2, _v3);
        racer.position.copy(_v1);
        racer.heading = Math.atan2(_v2.x, _v2.z);
        racer.splineT = START_T - 0.006;
        racer.unwrappedProgress = -0.006;
        racer.maxProgress = -0.006;
        racer.rank = 1;
        racer.rig.root.visible = racer.profile.isPlayer;
      } else if (isBattle) {
        const angle = (racerId / 14) * Math.PI * 2;
        const rad = 52;
        racer.position.set(Math.sin(angle) * rad, 0.2, Math.cos(angle) * rad);
        racer.heading = Math.atan2(-racer.position.x, -racer.position.z);
        racer.splineT = START_T;
        racer.unwrappedProgress = 0;
        racer.maxProgress = 0;
        racer.rank = slotIdx + 1;
        racer.rig.root.visible = true;
      } else if (preEliminated) {
        racer.position.set(0, -100, 0);
        racer.heading = 0;
        racer.splineT = START_T;
        racer.unwrappedProgress = -1;
        racer.maxProgress = -1;
        racer.rank = activeSlots.length + 1;
        racer.rig.root.visible = false;
      } else {
        const gridPos = activeGridIdx++;
        const row = Math.floor(gridPos / 2);
        const col = gridPos % 2;
        const tOffset = -0.006 - row * 0.0055;
        const t = (START_T + tOffset + 1) % 1;
        const lat = isVsSolo ? 0 : (col === 0 ? -4.2 : 4.2) + (row % 2 === 0 ? -0.6 : 0.6);

        this.track.sampleAt(t, _v1, _v2, _v3);
        racer.position.copy(_v1).addScaledVector(_v3, lat);
        racer.heading = Math.atan2(_v2.x, _v2.z);
        racer.splineT = t;
        racer.unwrappedProgress = tOffset;
        racer.maxProgress = tOffset;
        racer.rank = gridPos + 1;
        racer.aiTargetLat = lat * 0.6;
        racer.rig.root.visible = true;
      }

      racer.speed = 0;
      racer.lateralVel = 0;
      racer.steerAngle = 0;
      racer.lap = 1;
      racer.finished = preEliminated;
      racer.finishTime = 0;
      racer.eliminated = preEliminated;
      racer.balloons = 3;
      racer.battleScore = 0;
      racer.battleShieldTimer = isBattle ? 1.5 : 0;
      racer.heldItem = isTimeTrial && racer.profile.isPlayer ? 'nitro_mushroom' : null;
      racer.rouletteTimer = 0;
      racer.rouletteItem = null;
      racer.pendingItem = null;
      racer.nitroTimer = 0;
      racer.starTimer = 0;
      racer.bulletTimer = 0;
      racer.lightningSlowTimer = 0;
      racer.boostPadTimer = 0;
      racer.stunTimer = 0;
      racer.stunSpinAngle = 0;
      racer.jumpY = 0;
      racer.jumpVelY = 0;
      racer.driftDir = 0;
      racer.driftCharge = 0;
      racer.aiItemCooldown = 1.8 + Math.random() * 2.6;
      racer.aiLaneTimer = 1 + Math.random() * 2;

      racer.rig.bulletGroup.visible = false;
      racer.rig.kartBodyGroup.visible = true;
      racer.rig.starAuraGroup.visible = false;
      racer.rig.flameL.visible = false;
      racer.rig.flameR.visible = false;
      racer.rig.paintMaterials.forEach((mat, idx) => {
        mat.color.copy(racer.rig.baseColors[idx]);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      });
      this.syncKartVisuals(racer, 0);
    });
    if (isKnockout) {
      this.computeRanks();
    }

    const player = this.racers[0];
    _v1.set(Math.sin(player.heading), 0, Math.cos(player.heading));
    this.camPos.copy(player.position).addScaledVector(_v1, -11.5);
    this.camPos.y += 5.2;
    this.camLook.copy(player.position).addScaledVector(_v1, 8);
    this.camLook.y += 1.8;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
      return;
    }

    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.drift = true;

    if (e.code === 'Space' || e.code === 'KeyE') {
      if (this.phase === 'playing') {
        e.preventDefault();
        this.audio.unlock();
        this.input.useItemPressed = true;
      } else if (this.phase === 'title' && e.code === 'Space' && !this.uiModalOpen) {
        e.preventDefault();
        this.startRace();
      }
    }

    if (e.code === 'Enter' && this.phase === 'title' && !this.uiModalOpen) {
      e.preventDefault();
      this.startRace();
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.drift = false;
  };

  private handleBlur = (): void => {
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;
    this.input.drift = false;
  };

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    life: number,
    size: number,
    hexColor: number,
  ): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = vx;
        p.vy = vy;
        p.vz = vz;
        p.life = life;
        p.maxLife = life;
        p.size = size;
        p.color.setHex(hexColor);
        return;
      }
    }
  }

  private spawnBurst(pos: THREE.Vector3, count: number, hexColor: number, speed = 14, size = 0.55): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.4 + Math.random() * 0.8) * speed;
      this.spawnParticle(
        pos.x,
        pos.y + 0.8,
        pos.z,
        Math.cos(a) * sp,
        4 + Math.random() * 10,
        Math.sin(a) * sp,
        0.45 + Math.random() * 0.4,
        size * (0.7 + Math.random() * 0.6),
        hexColor,
      );
    }
  }

  private spawnShockwave(pos: THREE.Vector3, colorHex: number, maxScale = 12): void {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.0, 28),
      new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.35, pos.z);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, age: 0, maxAge: 0.55, maxScale });
  }

  private showBanner(text: string, duration = 2.0): void {
    this.eventBanner = text;
    this.eventBannerTimer = duration;
  }

  private pickItemForRank(rank: number): ItemType {
    if (this.raceConfig.mode === 'battle') {
      return BATTLE_ITEMS[Math.floor(Math.random() * BATTLE_ITEMS.length)];
    }

    const isFrantic = this.raceConfig.itemFrequency === 'frantic';
    const r = Math.random();
    if (isFrantic) {
      if (r < 0.18) return 'bullet_bill';
      if (r < 0.38) return 'invincible_star';
      if (r < 0.56) return 'spiny_shell';
      if (r < 0.72) return 'lightning_bolt';
      if (r < 0.86) return 'green_shell';
      return 'nitro_mushroom';
    }

    if (rank <= 3) {
      if (r < 0.26) return 'nitro_mushroom';
      if (r < 0.52) return 'banana_peel';
      if (r < 0.78) return 'green_shell';
      if (r < 0.90) return 'invincible_star';
      if (r < 0.96) return 'spiny_shell';
      return 'bullet_bill';
    }
    if (rank <= 8) {
      if (r < 0.22) return 'nitro_mushroom';
      if (r < 0.44) return 'green_shell';
      if (r < 0.62) return 'banana_peel';
      if (r < 0.78) return 'invincible_star';
      if (r < 0.89) return 'spiny_shell';
      if (r < 0.95) return 'lightning_bolt';
      return 'bullet_bill';
    }
    if (r < 0.24) return 'bullet_bill';
    if (r < 0.46) return 'invincible_star';
    if (r < 0.64) return 'lightning_bolt';
    if (r < 0.80) return 'spiny_shell';
    if (r < 0.90) return 'green_shell';
    return 'nitro_mushroom';
  }

  private activateItem(racer: RacerState): void {
    const item = racer.heldItem;
    if (!item) return;

    const isPlayer = racer.profile.isPlayer;

    if (this.raceConfig.mode === 'time_trial' && isPlayer && item === 'nitro_mushroom') {
      if (this.mushroomsLeft <= 0) {
        racer.heldItem = null;
        return;
      }
      this.mushroomsLeft--;
      racer.heldItem = this.mushroomsLeft > 0 ? 'nitro_mushroom' : null;
      racer.nitroTimer = 2.0;
      this.audio.playNitroBoost();
      this.cameraShake = 0.25;
      this.showBanner(`NITRO MUSHROOM! (${this.mushroomsLeft} LEFT)`, 1.3);
      this.spawnBurst(racer.position, 10, 0x38bdf8, 12, 0.55);
      return;
    }

    racer.heldItem = null;

    switch (item) {
      case 'bullet_bill': {
        racer.bulletTimer = 10.0;
        racer.stunTimer = 0;
        racer.lightningSlowTimer = 0;
        racer.jumpY = 0;
        if (isPlayer) {
          this.audio.playBulletBill();
          this.cameraShake = 0.45;
          this.showBanner('BULLET BILL LAUNCH — 10s!', 1.8);
        }
        this.spawnBurst(racer.position, 14, 0xf97316, 16, 0.7);
        break;
      }
      case 'nitro_mushroom': {
        racer.nitroTimer = 2.0;
        if (isPlayer) {
          this.audio.playNitroBoost();
          this.cameraShake = 0.25;
          this.showBanner('NITRO BOOST — 2s!', 1.4);
        }
        this.spawnBurst(racer.position, 10, 0x38bdf8, 12, 0.55);
        break;
      }
      case 'invincible_star': {
        racer.starTimer = 5.0;
        racer.stunTimer = 0;
        racer.lightningSlowTimer = 0;
        if (isPlayer) {
          this.audio.startStarMusic();
          this.cameraShake = 0.3;
          this.showBanner('INVINCIBLE STAR — 5s!', 2.0);
        }
        this.spawnBurst(racer.position, 16, 0xfacc15, 14, 0.65);
        break;
      }
      case 'spiny_shell': {
        const firstPlace = this.racers.find((r) => !r.eliminated && r.rank === 1) ?? this.racers[0];
        const target =
          firstPlace.profile.id === racer.profile.id
            ? this.racers.find((r) => !r.eliminated && r.rank === 2) ?? null
            : firstPlace;

        if (!target || target.profile.id === racer.profile.id) {
          racer.nitroTimer = 2.0;
          if (isPlayer) {
            this.audio.playNitroBoost();
            this.showBanner('SOLO NITRO BOOST — 2s!', 1.4);
          }
          this.spawnBurst(racer.position, 10, 0x38bdf8, 12, 0.55);
          break;
        }

        const mesh = createSpinyShellModel();
        mesh.position.copy(racer.position);
        mesh.position.y += 1.0;
        this.scene.add(mesh);

        this.spinyShells.push({
          mesh,
          ownerId: racer.profile.id,
          targetId: target.profile.id,
          splineT: racer.splineT,
          lateral: 0,
          position: mesh.position.clone(),
          phase: 'chase',
          hoverTimer: 0.55,
          life: 16,
        });

        if (isPlayer) {
          this.audio.playSpinyLaunch();
          this.showBanner(`SPINY SHELL LOCKED ON ${target.displayName.toUpperCase()}!`, 2.0);
        } else if (target.profile.isPlayer) {
          this.audio.playSpinyWarning();
        }
        break;
      }
      case 'green_shell': {
        const mesh = createGreenShellModel();
        const fwdX = Math.sin(racer.heading);
        const fwdZ = Math.cos(racer.heading);
        mesh.position.set(
          racer.position.x + fwdX * 2.8,
          racer.position.y + 0.55,
          racer.position.z + fwdZ * 2.8,
        );
        this.scene.add(mesh);
        this.greenShells.push({
          mesh,
          ownerId: racer.profile.id,
          position: mesh.position.clone(),
          heading: racer.heading,
          speed: 112,
          splineT: racer.splineT,
          bouncesLeft: this.raceConfig.mode === 'battle' ? 6 : 4,
          life: 8,
        });
        if (isPlayer) {
          this.audio.playGreenShellLaunch();
          this.showBanner('GREEN SHELL FIRED!', 1.2);
        }
        break;
      }
      case 'banana_peel': {
        const mesh = createBananaPeelModel();
        const fwdX = Math.sin(racer.heading);
        const fwdZ = Math.cos(racer.heading);
        mesh.position.set(
          racer.position.x - fwdX * 3.0,
          racer.position.y + 0.06,
          racer.position.z - fwdZ * 3.0,
        );
        this.scene.add(mesh);
        this.bananaHazards.push({
          mesh,
          ownerId: racer.profile.id,
          position: mesh.position.clone(),
          graceTimer: 0.55,
          life: 24,
        });
        if (isPlayer) {
          this.audio.playBananaDrop();
          this.showBanner('BANANA TRAP DROPPED!', 1.2);
        }
        break;
      }
      case 'lightning_bolt': {
        this.audio.playLightningStrike();
        this.cameraShake = 0.5;
        if (isPlayer) {
          this.hitstopTimer = 0.045;
          this.showBanner('LIGHTNING BOLT! ALL RIVALS ZAPPED!', 2.2);
        } else {
          this.showBanner(`${racer.displayName.toUpperCase()} USED LIGHTNING!`, 1.8);
        }
        for (const r of this.racers) {
          if (r.profile.id === racer.profile.id || r.eliminated) continue;
          if (r.starTimer > 0 || r.bulletTimer > 0) continue;
          r.lightningSlowTimer = 4.0;
          this.handleAttackHit(racer.profile.id, r, 0.9, 0xa855f7);
          this.spawnShockwave(r.position, 0xfacc15, 6);
          for (let b = 0; b < 5; b++) {
            this.spawnParticle(
              r.position.x,
              r.position.y + 2 + b * 2.2,
              r.position.z,
              (Math.random() - 0.5) * 4,
              -8,
              (Math.random() - 0.5) * 4,
              0.35,
              0.55,
              b % 2 === 0 ? 0xfacc15 : 0xc084fc,
            );
          }
        }
        break;
      }
    }
  }

  private handleAttackHit(
    attackerId: number,
    victim: RacerState,
    duration = 1.5,
    burstColor = 0xfef08a,
  ): void {
    if (victim.starTimer > 0 || victim.bulletTimer > 0 || victim.stunTimer > 0.4) return;
    if (this.raceConfig.mode === 'battle') {
      if (victim.battleShieldTimer > 0) return;
      victim.balloons = Math.max(0, victim.balloons - 1);
      victim.battleShieldTimer = 1.6;
      const attacker = this.racers[attackerId];
      if (attacker && attacker.profile.id !== victim.profile.id) {
        attacker.battleScore += 1;
      }
      this.spawnBurst(
        _v4.set(victim.position.x, victim.position.y + 2.0, victim.position.z),
        16,
        0xf43f5e,
        14,
        0.55,
      );
      if (attackerId === 0 || victim.profile.isPlayer) {
        this.audio.playBalloonPop();
        if (attackerId === 0 && victim.profile.id !== 0) {
          this.showBanner(`POPPED ${victim.displayName.toUpperCase()}'S BALLOON! (+1 PT)`, 1.5);
        }
      }
      if (victim.balloons <= 0) {
        victim.battleScore = Math.max(0, victim.battleScore - 1);
        victim.balloons = 3;
        victim.battleShieldTimer = 2.6;
        const angle = Math.random() * Math.PI * 2;
        victim.position.set(Math.sin(angle) * 44, 0.2, Math.cos(angle) * 44);
        victim.speed = 0;
        if (victim.profile.isPlayer) {
          this.showBanner('ALL BALLOONS POPPED! RESPAWNED (-1 PT)', 2.0);
        }
      }
    }
    this.knockdownRacer(victim, duration, burstColor);
  }

  private knockdownRacer(victim: RacerState, duration = 1.5, burstColor = 0xfef08a): void {
    if (victim.starTimer > 0 || victim.bulletTimer > 0 || victim.stunTimer > 0.4) return;
    victim.stunTimer = duration;
    victim.speed *= 0.25;
    victim.jumpVelY = 12.5;
    this.spawnBurst(victim.position, 14, burstColor, 14, 0.55);
  }

  private finalizeSoloRace(playerWon: boolean): void {
    this.computeRanks();
    this.resolveRemainingCpuFinishes();
    let finalWin = playerWon;
    if (this.raceConfig.mode === 'grand_prix') {
      for (const r of this.racers) {
        this.cupPoints[r.profile.id] =
          (this.cupPoints[r.profile.id] ?? 0) + (GP_POINTS_TABLE[r.rank - 1] ?? 0);
      }
    } else if (this.raceConfig.mode === 'knockout_tour') {
      const cutoffRank = KNOCKOUT_STAGE_KEEP_COUNTS[this.knockoutStageIndex - 1] ?? 3;
      if (this.knockoutStageIndex < KNOCKOUT_STAGE_KEEP_COUNTS.length) {
        for (const r of this.racers) {
          if (!r.eliminated && r.rank > cutoffRank) {
            r.eliminated = true;
            this.knockoutEliminatedStage.set(r.profile.id, this.knockoutStageIndex);
          }
        }
        this.computeRanks();
        finalWin = !this.racers[0].eliminated && this.racers[0].rank <= cutoffRank;
      } else {
        finalWin = !this.racers[0].eliminated && this.racers[0].rank <= 3;
      }
    }
    this.phase = 'finished';
    this.finishOrbitAngle = 0;
    this.audio.stopStarMusic();
    this.audio.updateEngine(false, 0, false, false);
    this.audio.playFinishFanfare(finalWin);
    this.finalizeSavedReplay();
    this.pushHudSnapshot();
  }

  private updateRacer(racer: RacerState, dt: number): void {
    const isPlayer = racer.profile.isPlayer;
    const isBattle = this.raceConfig.mode === 'battle';
    const isTimeTrial = this.raceConfig.mode === 'time_trial';
    const totalLaps = this.getEffectiveTotalLaps();
    const classMult = ENGINE_CLASS_MULT[this.raceConfig.engineClass] ?? 1.04;

    if (racer.eliminated) {
      racer.speed = THREE.MathUtils.damp(racer.speed, 0, 5, dt);
      this.syncKartVisuals(racer, dt);
      return;
    }

    if (racer.nitroTimer > 0) racer.nitroTimer = Math.max(0, racer.nitroTimer - dt);
    if (racer.boostPadTimer > 0) racer.boostPadTimer = Math.max(0, racer.boostPadTimer - dt);
    if (racer.bulletTimer > 0) racer.bulletTimer = Math.max(0, racer.bulletTimer - dt);
    if (racer.lightningSlowTimer > 0) racer.lightningSlowTimer = Math.max(0, racer.lightningSlowTimer - dt);
    if (racer.battleShieldTimer > 0) racer.battleShieldTimer = Math.max(0, racer.battleShieldTimer - dt);

    if (racer.stunTimer > 0) {
      racer.stunTimer = Math.max(0, racer.stunTimer - dt);
      racer.stunSpinAngle += dt * 15;
    } else {
      racer.stunSpinAngle = 0;
    }

    if (racer.starTimer > 0) {
      racer.starTimer = Math.max(0, racer.starTimer - dt);
      if (racer.starTimer === 0 && isPlayer) {
        this.audio.stopStarMusic();
      }
    }

    if (racer.rouletteTimer > 0) {
      const prevStep = Math.floor(racer.rouletteTimer * 12);
      racer.rouletteTimer = Math.max(0, racer.rouletteTimer - dt);
      const nextStep = Math.floor(racer.rouletteTimer * 12);
      if (nextStep !== prevStep) {
        const pool = isBattle ? BATTLE_ITEMS : ALL_ITEMS;
        racer.rouletteItem = pool[Math.floor(Math.random() * pool.length)];
        if (isPlayer) this.audio.playRouletteTick();
      }
      if (racer.rouletteTimer === 0) {
        racer.heldItem = racer.pendingItem;
        racer.pendingItem = null;
        racer.rouletteItem = null;
        if (isPlayer && racer.heldItem) {
          this.audio.playItemAcquire();
        }
      }
    }

    if (racer.jumpY > 0 || racer.jumpVelY > 0) {
      racer.jumpY += racer.jumpVelY * dt;
      racer.jumpVelY -= 36 * dt;
      if (racer.jumpY <= 0) {
        racer.jumpY = 0;
        racer.jumpVelY = 0;
      }
    }

    if (isPlayer && this.phase === 'playing' && this.input.useItemPressed) {
      this.input.useItemPressed = false;
      if (racer.heldItem) {
        this.activateItem(racer);
      }
    }

    if (isBattle) {
      let throttle = 0;
      let steerInput = 0;
      let wantsDrift = false;

      if (racer.stunTimer > 0) {
        racer.speed = THREE.MathUtils.damp(racer.speed, 0, 3.5, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isPlayer && this.phase === 'playing') {
        throttle = this.input.up ? 1 : this.input.down ? -0.6 : 0;
        steerInput = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
        wantsDrift = this.input.drift;
      } else {
        racer.aiBattleTimer -= dt;
        if (racer.aiBattleTimer <= 0) {
          racer.aiBattleTimer = 1.6 + Math.random() * 2.0;
          const candidates = this.racers.filter((o) => o.profile.id !== racer.profile.id);
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          if (pick) racer.aiBattleTargetId = pick.profile.id;
        }

        let aimX = 0;
        let aimZ = 0;
        if (!racer.heldItem && this.raceConfig.itemFrequency !== 'none') {
          let bestD2 = Infinity;
          for (const box of this.track.itemBoxes) {
            if (box.respawnTimer > 0) continue;
            const d2 = racer.position.distanceToSquared(box.position);
            if (d2 < bestD2) {
              bestD2 = d2;
              aimX = box.position.x;
              aimZ = box.position.z;
            }
          }
        } else {
          const target = this.racers[racer.aiBattleTargetId] ?? this.racers[0];
          aimX = target.position.x;
          aimZ = target.position.z;
        }

        const desiredHeading = Math.atan2(aimX - racer.position.x, aimZ - racer.position.z);
        const diff = Math.atan2(
          Math.sin(desiredHeading - racer.heading),
          Math.cos(desiredHeading - racer.heading),
        );
        steerInput = THREE.MathUtils.clamp(diff * 2.2, -1, 1);
        throttle = 0.92;

        if (!isPlayer && this.phase === 'playing' && racer.heldItem) {
          racer.aiItemCooldown -= dt;
          if (racer.aiItemCooldown <= 0) {
            this.activateItem(racer);
            racer.aiItemCooldown = 1.8 + Math.random() * 2.4;
          }
        }
      }

      if (racer.stunTimer <= 0) {
        const carSpec = getCarSpec(racer.carId);
        const diffMult =
          this.raceConfig.cpuDifficulty === 'master'
            ? 1.07
            : this.raceConfig.cpuDifficulty === 'hard'
              ? 1.035
              : 1.0;

        const paceMult =
          (isPlayer ? 1.0 : racer.profile.skill * diffMult) *
          classMult *
          (isPlayer ? carSpec.speedMult : 1 + (carSpec.speedMult - 1) * 0.35);

        let boostMult = 1;
        if (racer.nitroTimer > 0) boostMult = Math.max(boostMult, 1.45);
        if (racer.starTimer > 0) boostMult = Math.max(boostMult, 1.32);
        if (racer.boostPadTimer > 0) boostMult = Math.max(boostMult, 1.38);
        if (racer.lightningSlowTimer > 0 && racer.starTimer <= 0) boostMult *= 0.72;

        const targetMax = BASE_MAX_SPEED * 0.88 * paceMult * boostMult;
        const ccAccelScale = Math.max(0.55, Math.pow(classMult, 0.85));
        const ccSteerScale = 1 + Math.max(0, classMult - 1) * 0.55;
        const driftMinSpeed = Math.min(22, 22 * classMult);

        if (throttle > 0) {
          const baseAccel = racer.nitroTimer > 0 || racer.boostPadTimer > 0 ? 78 : 42;
          const accel = baseAccel * ccAccelScale * (isPlayer ? carSpec.accelMult : 1);
          if (racer.speed < targetMax) {
            racer.speed = Math.min(targetMax, racer.speed + accel * throttle * dt);
          } else {
            racer.speed = THREE.MathUtils.damp(racer.speed, targetMax, 4.5, dt);
          }
        } else if (throttle < 0) {
          const maxRev = -18 * Math.min(1, Math.max(0.45, classMult));
          racer.speed = Math.max(maxRev, racer.speed - 48 * ccAccelScale * dt);
        } else {
          racer.speed = THREE.MathUtils.damp(racer.speed, 0, 1.8, dt);
        }

        if (wantsDrift && Math.abs(racer.speed) > driftMinSpeed && (racer.driftDir !== 0 || Math.abs(steerInput) > 0.1)) {
          if (racer.driftDir === 0) {
            racer.driftDir = steerInput >= 0 ? 1 : -1;
            racer.jumpVelY = Math.max(racer.jumpVelY, 5.2);
          }
          racer.driftCharge = Math.min(2.4, racer.driftCharge + dt);
        } else {
          if (racer.driftDir !== 0 && racer.driftCharge >= 0.7) {
            const boostDur = racer.driftCharge >= 1.5 ? 1.15 : 0.7;
            racer.boostPadTimer = Math.max(racer.boostPadTimer, boostDur);
            if (isPlayer) this.audio.playDriftRelease();
          }
          racer.driftDir = 0;
          racer.driftCharge = 0;
        }

        const speedFactor = THREE.MathUtils.clamp(
          Math.abs(racer.speed) / Math.max(10, 26 * Math.min(1, classMult)),
          0.25,
          1.15,
        );
        const turnDir = racer.speed >= -0.5 ? 1 : -1;
        const steerRate =
          (racer.driftDir !== 0 ? 2.45 : 2.1) * ccSteerScale * (isPlayer ? carSpec.handlingMult : 1);
        const effectiveSteer =
          racer.driftDir !== 0
            ? racer.driftDir * 0.65 + steerInput * 0.65
            : steerInput;

        racer.heading += effectiveSteer * steerRate * speedFactor * turnDir * dt;
        racer.steerAngle = THREE.MathUtils.damp(racer.steerAngle, steerInput * 0.42, 12, dt);
      }

      const battleFwdX = Math.sin(racer.heading);
      const battleFwdZ = Math.cos(racer.heading);
      racer.position.x += battleFwdX * racer.speed * dt;
      racer.position.z += battleFwdZ * racer.speed * dt;

      const distSq = racer.position.x * racer.position.x + racer.position.z * racer.position.z;
      const maxArenaR = BATTLE_ARENA_RADIUS - 1.6;
      if (distSq > maxArenaR * maxArenaR) {
        const dist = Math.sqrt(distSq);
        const nx = racer.position.x / dist;
        const nz = racer.position.z / dist;
        racer.position.x = nx * maxArenaR;
        racer.position.z = nz * maxArenaR;
        racer.speed *= 0.85;
        const inwardHeading = Math.atan2(-nx, -nz);
        const hDiff = Math.atan2(
          Math.sin(inwardHeading - racer.heading),
          Math.cos(inwardHeading - racer.heading),
        );
        racer.heading += hDiff * 0.35;
      }
      for (const pil of BATTLE_PILLARS) {
        const dx = racer.position.x - pil.x;
        const dz = racer.position.z - pil.z;
        const d2 = dx * dx + dz * dz;
        const minR = pil.radius + 1.5;
        if (d2 > 0.0001 && d2 < minR * minR) {
          const d = Math.sqrt(d2);
          racer.position.x = pil.x + (dx / d) * minR;
          racer.position.z = pil.z + (dz / d) * minR;
          racer.speed *= 0.82;
        }
      }
      racer.position.y = 0.2;

      for (const pad of BATTLE_BOOST_PADS) {
        if ((racer.position.x - pad.x) ** 2 + (racer.position.z - pad.z) ** 2 < 11) {
          if (racer.boostPadTimer < 0.85) {
            racer.boostPadTimer = 1.1;
            if (isPlayer) this.audio.playNitroBoost();
          }
        }
      }

      if (this.phase === 'playing' && this.raceConfig.itemFrequency !== 'none') {
        for (const box of this.track.itemBoxes) {
          if (box.respawnTimer > 0) continue;
          const dSq = racer.position.distanceToSquared(box.position);
          if (dSq < 8.4) {
            box.respawnTimer = 3.2;
            box.mesh.visible = false;
            this.spawnBurst(box.position, 10, 0x38bdf8, 10, 0.45);
            if (!racer.heldItem && racer.rouletteTimer <= 0) {
              racer.pendingItem = this.pickItemForRank(racer.rank);
              racer.rouletteTimer = isPlayer ? 0.55 : 0.3;
              racer.rouletteItem = racer.pendingItem;
            }
          }
        }
      }
    } else {
      let throttle = 0;
      let playerSteerInput = 0;
      let wantsDrift = false;
      const isBullet = racer.bulletTimer > 0;
      const isStunned = racer.stunTimer > 0;
      const isHumanControlled = isPlayer && this.phase === 'playing';
      const isAiDriver = !isBullet && !isStunned && !isHumanControlled;

      if (isBullet) {
        racer.speed = THREE.MathUtils.damp(racer.speed, BASE_MAX_SPEED * classMult * 1.85, 8, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isStunned) {
        racer.speed = THREE.MathUtils.damp(racer.speed, 0, 3.5, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isHumanControlled) {
        throttle = this.input.up ? 1 : this.input.down ? -0.6 : 0;
        playerSteerInput = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
        wantsDrift = this.input.drift;
      } else {
        racer.aiLaneTimer -= dt;
        if (racer.aiLaneTimer <= 0) {
          racer.aiLaneTimer = 1.4 + Math.random() * 2.2;
          racer.aiTargetLat = (Math.random() - 0.5) * (ROAD_HALF_WIDTH * 1.15);
        }
        throttle = 1;
        if (!isPlayer && this.phase === 'playing' && racer.heldItem) {
          racer.aiItemCooldown -= dt;
          if (racer.aiItemCooldown <= 0) {
            this.activateItem(racer);
            racer.aiItemCooldown = 2.5 + Math.random() * 3.5;
          }
        }
      }

      const carSpec = getCarSpec(racer.carId);
      const ccSteerScale = isPlayer
        ? 1 + Math.min(3.5, Math.max(0, classMult - 1) * 0.32)
        : 1 + Math.max(0, classMult - 1) * 0.55;

      if (!isBullet && !isStunned) {
        const diffMult =
          this.raceConfig.cpuDifficulty === 'master'
            ? 1.07
            : this.raceConfig.cpuDifficulty === 'hard'
              ? 1.035
              : 1.0;

        let paceMult =
          (isPlayer ? 1.0 : racer.profile.skill * diffMult) *
          classMult *
          (isPlayer ? carSpec.speedMult : 1 + (carSpec.speedMult - 1) * 0.35);

        if (!isPlayer && this.phase === 'playing') {
          const playerProg = this.racers[0].unwrappedProgress;
          const gap = playerProg - racer.unwrappedProgress;
          if (gap > 0.06) paceMult *= 1.07;
          else if (gap < -0.14) paceMult *= 0.94;
        }

        let boostMult = 1;
        if (racer.nitroTimer > 0) boostMult = Math.max(boostMult, 1.45);
        if (racer.starTimer > 0) boostMult = Math.max(boostMult, 1.32);
        if (racer.boostPadTimer > 0) boostMult = Math.max(boostMult, 1.38);
        if (racer.lightningSlowTimer > 0 && racer.starTimer <= 0) boostMult *= 0.72;

        const targetMax = BASE_MAX_SPEED * paceMult * boostMult;
        const ccAccelScale = Math.max(0.55, Math.pow(classMult, 0.85));
        const driftMinSpeed = Math.min(22, 22 * classMult);

        if (throttle > 0) {
          const baseAccel = racer.nitroTimer > 0 || racer.boostPadTimer > 0 ? 78 : 42;
          const accel = baseAccel * ccAccelScale * (isPlayer ? carSpec.accelMult : 1);
          if (racer.speed < targetMax) {
            racer.speed = Math.min(targetMax, racer.speed + accel * throttle * dt);
          } else {
            racer.speed = THREE.MathUtils.damp(racer.speed, targetMax, 4.5, dt);
          }
        } else if (throttle < 0) {
          const maxRev = -18 * Math.min(1, Math.max(0.45, classMult));
          racer.speed = Math.max(maxRev, racer.speed - 48 * ccAccelScale * dt);
        } else {
          racer.speed = THREE.MathUtils.damp(racer.speed, 0, 1.8, dt);
        }

        if (wantsDrift && Math.abs(racer.speed) > driftMinSpeed && (racer.driftDir !== 0 || Math.abs(playerSteerInput) > 0.1)) {
          if (racer.driftDir === 0) {
            racer.driftDir = playerSteerInput >= 0 ? 1 : -1;
            racer.jumpVelY = Math.max(racer.jumpVelY, 5.2);
          }
          racer.driftCharge = Math.min(2.4, racer.driftCharge + dt);
        } else {
          if (racer.driftDir !== 0 && racer.driftCharge >= 0.7) {
            const boostDur = racer.driftCharge >= 1.5 ? 1.15 : 0.7;
            racer.boostPadTimer = Math.max(racer.boostPadTimer, boostDur);
            if (isPlayer) this.audio.playDriftRelease();
          }
          racer.driftDir = 0;
          racer.driftCharge = 0;
        }
      }

      const subSteps = Math.min(24, Math.max(1, Math.ceil((Math.abs(racer.speed) * dt) / 12)));
      const subDt = dt / subSteps;
      const maxLat = ROAD_HALF_WIDTH - 0.9;
      let lastSteerInput = playerSteerInput;

      for (let step = 0; step < subSteps; step++) {
        if (isBullet) {
          if (this.track.isStraight) {
            _v1.set(0, 0.2, racer.position.z + 18);
          } else {
            const lookAheadT = (racer.splineT + Math.min(0.05, 0.022 + Math.max(0, classMult - 1) * 0.002)) % 1;
            this.track.sampleAt(lookAheadT, _v1, _v2, _v3);
          }
          const dx = _v1.x - racer.position.x;
          const dz = _v1.z - racer.position.z;
          const desiredHeading = Math.atan2(dx, dz);
          const diff = Math.atan2(Math.sin(desiredHeading - racer.heading), Math.cos(desiredHeading - racer.heading));
          const bulletTurnRate = Math.max(5, classMult * 1.4);
          racer.heading += THREE.MathUtils.clamp(diff, -bulletTurnRate * subDt, bulletTurnRate * subDt);
          lastSteerInput = 0;
        } else if (!isStunned) {
          let stepSteer = playerSteerInput;
          if (isAiDriver) {
            if (this.track.isStraight) {
              _v1.set(-racer.aiTargetLat, 0.2, racer.position.z + 20);
            } else {
              const lookAheadT = (racer.splineT + Math.min(0.052, 0.026 + Math.max(0, classMult - 1) * 0.0025)) % 1;
              this.track.sampleAt(lookAheadT, _v1, _v2, _v3);
              _v1.addScaledVector(_v3, racer.aiTargetLat);
            }
            const dx = _v1.x - racer.position.x;
            const dz = _v1.z - racer.position.z;
            const desiredHeading = Math.atan2(dx, dz);
            const diff = Math.atan2(Math.sin(desiredHeading - racer.heading), Math.cos(desiredHeading - racer.heading));
            stepSteer = THREE.MathUtils.clamp(diff * 2.4, -1, 1);
          }
          lastSteerInput = stepSteer;

          const speedFactor = THREE.MathUtils.clamp(
            Math.abs(racer.speed) / Math.max(10, 26 * Math.min(1, classMult)),
            0.25,
            1.15,
          );
          const turnDir = racer.speed >= -0.5 ? 1 : -1;
          const steerRate =
            (racer.driftDir !== 0 ? 2.45 : 2.1) * ccSteerScale * (isPlayer ? carSpec.handlingMult : 1);
          const effectiveSteer =
            racer.driftDir !== 0
              ? racer.driftDir * 0.65 + stepSteer * 0.65
              : stepSteer;

          racer.heading += effectiveSteer * steerRate * speedFactor * turnDir * subDt;
        }

        const stepFwdX = Math.sin(racer.heading);
        const stepFwdZ = Math.cos(racer.heading);
        racer.position.x += stepFwdX * racer.speed * subDt;
        racer.position.z += stepFwdZ * racer.speed * subDt;

        if (this.track.isStraight) {
          const halfLen = this.track.totalLength * 0.5;
          let wrapShiftZ = 0;
          if (racer.position.z >= halfLen) {
            wrapShiftZ = -this.track.totalLength;
          } else if (racer.position.z < -halfLen) {
            wrapShiftZ = this.track.totalLength;
          }
          if (wrapShiftZ !== 0) {
            racer.position.z += wrapShiftZ;
            if (isPlayer) {
              this.camPos.z += wrapShiftZ;
              this.camLook.z += wrapShiftZ;
              this.camera.position.z += wrapShiftZ;
            }
          }
        }

        const postClosest = this.track.closestPoint(racer.position.x, racer.position.z, racer.splineT);
        if (Math.abs(postClosest.lateral) > maxLat) {
          const clampedLat = THREE.MathUtils.clamp(postClosest.lateral, -maxLat, maxLat);
          racer.position.x = postClosest.point.x + postClosest.right.x * clampedLat;
          racer.position.z = postClosest.point.z + postClosest.right.z * clampedLat;
          racer.speed *= 1 - 0.06 / subSteps;
          const trackHeading = Math.atan2(postClosest.tangent.x, postClosest.tangent.z);
          const hDiff = Math.atan2(Math.sin(trackHeading - racer.heading), Math.cos(trackHeading - racer.heading));
          racer.heading += hDiff * (0.22 / subSteps);
        }

        racer.position.y = postClosest.point.y;

        const deltaT = ((postClosest.t - racer.splineT + 1.5) % 1) - 0.5;
        racer.splineT = postClosest.t;
        racer.unwrappedProgress += deltaT;
        if (racer.unwrappedProgress > racer.maxProgress) {
          racer.maxProgress = racer.unwrappedProgress;
        }

        if (!racer.finished && this.phase === 'playing') {
          const nextLap = Math.min(totalLaps, Math.max(1, Math.floor(racer.maxProgress) + 1));
          if (nextLap > racer.lap) {
            racer.lap = nextLap;
            if (isPlayer && isTimeTrial) {
              this.lapSplits.push(this.raceTime - this.lapStartTime);
              this.lapStartTime = this.raceTime;
            }
            if (isPlayer) {
              const isFinalLap = nextLap === totalLaps;
              this.audio.playLapComplete(isFinalLap);
              if (isFinalLap && totalLaps > 1) {
                this.audio.setMusicFinalLap(true);
              }
              this.showBanner(isFinalLap ? 'FINAL LAP!' : `LAP ${nextLap} / ${totalLaps}`, 2.0);
            }
          }

          if (racer.maxProgress >= totalLaps) {
            racer.finished = true;
            racer.finishTime = this.raceTime;
            this.finishOrderCount++;
            if (isPlayer) {
              if (isTimeTrial) {
                this.lapSplits.push(this.raceTime - this.lapStartTime);
                if (this.personalBest === null || racer.finishTime < this.personalBest) {
                  this.newRecord = true;
                  this.personalBest = racer.finishTime;
                  this.saveTimeTrialRecord(this.getEffectiveCourseId(), this.raceConfig.engineClass, {
                    bestTime: racer.finishTime,
                    carId: this.playerCarId,
                    characterId: this.playerCharacterId,
                    samples: this.recordingSamples,
                  });
                }
                this.finalizeSoloRace(true);
              } else {
                this.computeRanks();
                this.finalizeSoloRace(racer.rank <= 3);
              }
            }
          }
        }

        for (const pad of this.track.boostPads) {
          let dtPad = Math.abs(postClosest.t - pad.t);
          if (dtPad > 0.5) dtPad = 1 - dtPad;
          if (dtPad < pad.halfLengthT && Math.abs(postClosest.lateral - pad.lateral) < pad.halfWidth) {
            if (racer.boostPadTimer < 0.85) {
              racer.boostPadTimer = 1.1;
              if (isPlayer) this.audio.playNitroBoost();
            }
          }
        }

        if (this.phase === 'playing' && !isTimeTrial && this.raceConfig.itemFrequency !== 'none') {
          for (const box of this.track.itemBoxes) {
            if (box.respawnTimer > 0) continue;
            const dSq = racer.position.distanceToSquared(box.position);
            if (dSq < 7.8) {
              box.respawnTimer = this.raceConfig.itemFrequency === 'frantic' ? 2.6 : 4.2;
              box.mesh.visible = false;
              this.spawnBurst(box.position, 10, 0x38bdf8, 10, 0.45);
              if (!racer.heldItem && racer.rouletteTimer <= 0) {
                racer.pendingItem = this.pickItemForRank(racer.rank);
                racer.rouletteTimer = isPlayer ? 0.65 : 0.35;
                racer.rouletteItem = racer.pendingItem;
              }
            }
          }
        }
      }

      if (!isBullet && !isStunned) {
        racer.steerAngle = THREE.MathUtils.damp(racer.steerAngle, lastSteerInput * 0.42, 12, dt);
      }
    }

    const fwdX = Math.sin(racer.heading);
    const fwdZ = Math.cos(racer.heading);
    if (this.phase === 'playing') {
      if (racer.bulletTimer > 0 && Math.random() < 0.75) {
        this.spawnParticle(
          racer.position.x - fwdX * 2.4 + (Math.random() - 0.5) * 0.7,
          racer.position.y + 1.2,
          racer.position.z - fwdZ * 2.4 + (Math.random() - 0.5) * 0.7,
          -fwdX * 12,
          1 + Math.random() * 2,
          -fwdZ * 12,
          0.35,
          0.85,
          Math.random() < 0.5 ? 0xf97316 : 0xfacc15,
        );
      } else if ((racer.nitroTimer > 0 || racer.boostPadTimer > 0) && Math.random() < 0.65) {
        this.spawnParticle(
          racer.position.x - fwdX * 2.1 + (Math.random() - 0.5) * 0.6,
          racer.position.y + 0.75,
          racer.position.z - fwdZ * 2.1 + (Math.random() - 0.5) * 0.6,
          -fwdX * 8,
          1.2,
          -fwdZ * 8,
          0.28,
          0.55,
          racer.nitroTimer > 0 ? 0x22d3ee : 0xf97316,
        );
      } else if (racer.starTimer > 0 && Math.random() < 0.55) {
        const rainbow = [0xfacc15, 0xf43f5e, 0x38bdf8, 0x4ade80];
        this.spawnParticle(
          racer.position.x + (Math.random() - 0.5) * 2.2,
          racer.position.y + 0.8 + Math.random(),
          racer.position.z + (Math.random() - 0.5) * 2.2,
          0,
          3.5,
          0,
          0.38,
          0.45,
          rainbow[Math.floor(Math.random() * rainbow.length)],
        );
      } else if (racer.driftDir !== 0 && racer.driftCharge >= 0.7 && Math.random() < 0.5) {
        this.spawnParticle(
          racer.position.x - fwdX * 1.4,
          racer.position.y + 0.25,
          racer.position.z - fwdZ * 1.4,
          (Math.random() - 0.5) * 4,
          2,
          (Math.random() - 0.5) * 4,
          0.22,
          0.38,
          racer.driftCharge >= 1.5 ? 0xf97316 : 0x38bdf8,
        );
      }
    }

    this.syncKartVisuals(racer, dt);
  }

  private syncKartVisuals(racer: RacerState, dt: number): void {
    const rig = racer.rig;
    rig.root.visible =
      !racer.eliminated && (this.raceConfig.mode !== 'time_trial' || racer.profile.isPlayer);
    if (!rig.root.visible) return;
    rig.root.position.set(racer.position.x, racer.position.y + racer.jumpY, racer.position.z);
    rig.root.rotation.set(0, racer.heading + racer.stunSpinAngle, 0);

    const targetScale = racer.lightningSlowTimer > 0 && racer.bulletTimer <= 0 ? 0.72 : 1.0;
    const curScale = THREE.MathUtils.damp(rig.root.scale.x, targetScale, 10, dt || 0.016);
    rig.root.scale.setScalar(curScale);

    // Balloons visibility in Battle mode
    const isBattle = this.raceConfig.mode === 'battle';
    rig.balloonGroup.visible = isBattle && !racer.eliminated;
    if (isBattle) {
      for (let b = 0; b < rig.balloons.length; b++) {
        rig.balloons[b].visible = b < racer.balloons;
        if (rig.balloons[b].visible) {
          rig.balloons[b].position.y = 2.05 + Math.sin(performance.now() * 0.006 + b * 2 + racer.profile.id) * 0.08;
        }
      }
    }

    const isBullet = racer.bulletTimer > 0 && !isBattle;
    rig.bulletGroup.visible = isBullet;
    rig.kartBodyGroup.visible = !isBullet;

    if (isBullet) {
      const fScale = 0.85 + Math.sin(performance.now() * 0.04) * 0.25;
      rig.bulletFlame.scale.set(fScale, 1, fScale);
    }

    const isStar = racer.starTimer > 0;
    rig.starAuraGroup.visible = isStar;
    if (isStar) {
      rig.starAuraGroup.rotation.y += dt * 7;
      const hue = (performance.now() * 0.0022) % 1;
      _c1.setHSL(hue, 0.95, 0.58);
      rig.paintMaterials.forEach((mat) => {
        mat.color.copy(_c1);
        mat.emissive.copy(_c1);
        mat.emissiveIntensity = 0.42;
      });
    } else {
      rig.paintMaterials.forEach((mat, idx) => {
        mat.color.copy(rig.baseColors[idx]);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      });
    }

    const showFlame = racer.nitroTimer > 0 || racer.boostPadTimer > 0;
    rig.flameL.visible = showFlame;
    rig.flameR.visible = showFlame;
    if (showFlame) {
      const fs = 0.8 + Math.sin(performance.now() * 0.05) * 0.35;
      const flameColor = racer.nitroTimer > 0 ? 0x22d3ee : 0xf97316;
      (rig.flameL.material as THREE.MeshBasicMaterial).color.setHex(flameColor);
      (rig.flameR.material as THREE.MeshBasicMaterial).color.setHex(flameColor);
      rig.flameL.scale.set(1, fs, 1);
      rig.flameR.scale.set(1, fs, 1);
    }

    const wheelDelta = (racer.speed * dt) / 0.44;
    for (const w of rig.wheels) {
      w.rotation.x += wheelDelta;
    }
    for (const pivot of rig.frontSteerPivots) {
      pivot.rotation.y = racer.steerAngle;
    }
  }

  private handleRacerCollisions(): void {
    if (this.raceConfig.mode === 'time_trial') return;
    const minDist = 2.65;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < this.racers.length; i++) {
      for (let j = i + 1; j < this.racers.length; j++) {
        const a = this.racers[i];
        const b = this.racers[j];
        if (a.eliminated || b.eliminated) continue;
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const dSq = dx * dx + dz * dz;
        if (dSq > 0.0001 && dSq < minDistSq) {
          const dist = Math.sqrt(dSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = (minDist - dist) * 0.5;

          a.position.x -= nx * overlap;
          a.position.z -= nz * overlap;
          b.position.x += nx * overlap;
          b.position.z += nz * overlap;

          const aCanKnock = a.starTimer > 0 || a.bulletTimer > 0;
          const bCanKnock = b.starTimer > 0 || b.bulletTimer > 0;

          if (aCanKnock && !bCanKnock && b.stunTimer <= 0.1) {
            this.handleAttackHit(a.profile.id, b, 1.6, 0xfacc15);
            if (a.profile.isPlayer) {
              this.audio.playStarKnockdown();
              this.hitstopTimer = 0.048;
              this.cameraShake = 0.42;
              this.showBanner(`KNOCKED DOWN ${b.displayName.toUpperCase()}!`, 1.4);
            }
          } else if (bCanKnock && !aCanKnock && a.stunTimer <= 0.1) {
            this.handleAttackHit(b.profile.id, a, 1.6, 0xfacc15);
            if (b.profile.isPlayer) {
              this.audio.playStarKnockdown();
              this.hitstopTimer = 0.048;
              this.cameraShake = 0.42;
              this.showBanner(`KNOCKED DOWN ${a.displayName.toUpperCase()}!`, 1.4);
            }
          } else if (a.profile.isPlayer || b.profile.isPlayer) {
            if (Math.abs(a.speed - b.speed) > 10) {
              this.audio.playBump();
            }
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const isBattle = this.raceConfig.mode === 'battle';

    // 1. Spiny Shells
    for (let i = this.spinyShells.length - 1; i >= 0; i--) {
      const shell = this.spinyShells[i];
      shell.life -= dt;
      const currentFirst = this.racers.find((r) => !r.eliminated && r.rank === 1);
      const target =
        currentFirst && currentFirst.profile.id !== shell.ownerId
          ? currentFirst
          : this.racers[shell.targetId];
      if (target) {
        shell.targetId = target.profile.id;
      }

      if (shell.phase === 'chase') {
        const stepT = (148 * dt) / this.track.totalLength;
        shell.splineT = (shell.splineT + stepT) % 1;
        this.track.sampleAt(shell.splineT, _v1, _v2, _v3);
        const targetClosest = this.track.closestPoint(target.position.x, target.position.z, target.splineT);
        shell.lateral = THREE.MathUtils.damp(shell.lateral, targetClosest.lateral, 5, dt);

        shell.position.copy(_v1).addScaledVector(_v3, shell.lateral);
        shell.position.y += 1.05;
        shell.mesh.position.copy(shell.position);
        shell.mesh.rotation.y += dt * 11;

        if (Math.random() < 0.65) {
          this.spawnParticle(
            shell.position.x,
            shell.position.y,
            shell.position.z,
            (Math.random() - 0.5) * 3,
            1.5,
            (Math.random() - 0.5) * 3,
            0.25,
            0.42,
            0x3b82f6,
          );
        }

        if (shell.position.distanceTo(target.position) < 6.8 || shell.life <= 0.6) {
          shell.phase = 'hover';
          shell.hoverTimer = 0.55;
        }
      } else {
        shell.hoverTimer -= dt;
        shell.position.set(target.position.x, target.position.y + 3.4, target.position.z);
        shell.mesh.position.copy(shell.position);
        shell.mesh.rotation.y += dt * 18;

        if (shell.hoverTimer <= 0) {
          this.spawnShockwave(target.position, 0x2563eb, 14);
          this.spawnBurst(target.position, 32, 0x3b82f6, 20, 0.72);
          this.spawnBurst(target.position, 16, 0xf8fafc, 16, 0.5);

          for (const r of this.racers) {
            if (!r.eliminated && r.position.distanceTo(target.position) < 6.2) {
              this.handleAttackHit(shell.ownerId, r, 1.85, 0x3b82f6);
            }
          }

          if (target.profile.isPlayer || target.position.distanceTo(this.racers[0].position) < 42) {
            this.audio.playSpinyExplosion();
            this.cameraShake = target.profile.isPlayer ? 0.65 : 0.25;
            if (target.profile.isPlayer) {
              this.hitstopTimer = 0.06;
              this.showBanner('STRUCK BY SPINY SHELL!', 1.8);
            } else if (shell.ownerId === 0) {
              this.showBanner(`1ST PLACE ${target.displayName.toUpperCase()} HIT!`, 1.8);
            }
          }

          this.scene.remove(shell.mesh);
          this.spinyShells.splice(i, 1);
        }
      }
    }

    // 2. Green Shells
    for (let i = this.greenShells.length - 1; i >= 0; i--) {
      const gs = this.greenShells[i];
      gs.life -= dt;
      gs.position.x += Math.sin(gs.heading) * gs.speed * dt;
      gs.position.z += Math.cos(gs.heading) * gs.speed * dt;

      if (isBattle) {
        gs.position.y = 0.75;
        const rDist = Math.hypot(gs.position.x, gs.position.z);
        if (rDist > BATTLE_ARENA_RADIUS - 1.2) {
          gs.bouncesLeft--;
          const nx = gs.position.x / rDist;
          const nz = gs.position.z / rDist;
          gs.position.x = nx * (BATTLE_ARENA_RADIUS - 1.3);
          gs.position.z = nz * (BATTLE_ARENA_RADIUS - 1.3);
          const vx = Math.sin(gs.heading);
          const vz = Math.cos(gs.heading);
          const dot = vx * nx + vz * nz;
          gs.heading = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
          this.spawnBurst(gs.position, 6, 0x22c55e, 10, 0.35);
        }
        for (const pil of BATTLE_PILLARS) {
          const dx = gs.position.x - pil.x;
          const dz = gs.position.z - pil.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.001 && d < pil.radius + 0.9) {
            gs.bouncesLeft--;
            const nx = dx / d;
            const nz = dz / d;
            gs.position.x = pil.x + nx * (pil.radius + 1.0);
            gs.position.z = pil.z + nz * (pil.radius + 1.0);
            const vx = Math.sin(gs.heading);
            const vz = Math.cos(gs.heading);
            const dot = vx * nx + vz * nz;
            gs.heading = Math.atan2(vx - 2 * dot * nx, vz - 2 * dot * nz);
            this.spawnBurst(gs.position, 6, 0x22c55e, 10, 0.35);
          }
        }
      } else {
        if (this.track.isStraight) {
          const halfLen = this.track.totalLength * 0.5;
          if (gs.position.z >= halfLen) gs.position.z -= this.track.totalLength;
          else if (gs.position.z < -halfLen) gs.position.z += this.track.totalLength;
        }
        const closest = this.track.closestPoint(gs.position.x, gs.position.z, gs.splineT);
        gs.splineT = closest.t;
        gs.position.y = closest.point.y + 0.55;

        const maxLat = ROAD_HALF_WIDTH - 0.8;
        if (Math.abs(closest.lateral) > maxLat) {
          gs.bouncesLeft--;
          const clamped = THREE.MathUtils.clamp(closest.lateral, -maxLat, maxLat);
          gs.position.x = closest.point.x + closest.right.x * clamped;
          gs.position.z = closest.point.z + closest.right.z * clamped;
          const trackHeading = Math.atan2(closest.tangent.x, closest.tangent.z);
          gs.heading = trackHeading - (gs.heading - trackHeading);
          this.spawnBurst(gs.position, 6, 0x22c55e, 10, 0.35);
        }
      }

      gs.mesh.position.copy(gs.position);
      gs.mesh.rotation.y += dt * 15;

      let hit = false;
      for (const r of this.racers) {
        if (r.eliminated) continue;
        if (r.profile.id === gs.ownerId && gs.life > 7.5) continue;
        if (gs.position.distanceToSquared(r.position) < 11.5) {
          this.handleAttackHit(gs.ownerId, r, 1.45, 0x22c55e);
          this.spawnBurst(gs.position, 16, 0x22c55e, 14, 0.5);
          if (gs.ownerId === 0 || r.profile.isPlayer) {
            this.audio.playBump();
          }
          hit = true;
          break;
        }
      }

      if (hit || gs.bouncesLeft < 0 || gs.life <= 0) {
        this.scene.remove(gs.mesh);
        this.greenShells.splice(i, 1);
      }
    }

    // 5. Banana Peel Traps
    for (let i = this.bananaHazards.length - 1; i >= 0; i--) {
      const bh = this.bananaHazards[i];
      bh.life -= dt;
      if (bh.graceTimer > 0) bh.graceTimer = Math.max(0, bh.graceTimer - dt);

      let tripped = false;
      for (const r of this.racers) {
        if (r.eliminated) continue;
        if (r.profile.id === bh.ownerId && bh.graceTimer > 0) continue;
        if (bh.position.distanceToSquared(r.position) < 7.8) {
          if (r.starTimer <= 0 && r.bulletTimer <= 0) {
            this.handleAttackHit(bh.ownerId, r, 1.25, 0xfacc15);
            if (r.profile.isPlayer || bh.ownerId === 0) {
              this.audio.playBananaSlip();
            }
          } else {
            this.spawnBurst(bh.position, 8, 0xfacc15, 10, 0.4);
          }
          tripped = true;
          break;
        }
      }

      if (tripped || bh.life <= 0) {
        this.scene.remove(bh.mesh);
        this.bananaHazards.splice(i, 1);
      }
    }

    // 6. Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += dt;
      const t = sw.age / sw.maxAge;
      if (t >= 1) {
        this.scene.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
        sw.mesh.geometry.dispose();
        this.shockwaves.splice(i, 1);
      } else {
        const sc = THREE.MathUtils.lerp(1, sw.maxScale, t);
        sw.mesh.scale.set(sc, sc, 1);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
      }
    }
  }

  private updateParticles(dt: number): void {
    let dirty = false;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      dirty = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _m1.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _m1);
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 12 * dt;
        const sc = p.size * (p.life / p.maxLife);
        _m1.makeTranslation(p.x, p.y, p.z);
        _m1.scale(_v1.set(sc, sc, sc));
        this.particleMesh.setMatrixAt(i, _m1);
        this.particleMesh.setColorAt(i, p.color);
      }
    }
    if (dirty) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private computeRanks(): void {
    if (this.raceConfig.mode === 'time_trial') {
      this.racers[0].rank = 1;
      return;
    }

    if (this.raceConfig.mode === 'battle') {
      const sorted = [...this.racers].sort((a, b) => {
        if (b.battleScore !== a.battleScore) return b.battleScore - a.battleScore;
        if (b.balloons !== a.balloons) return b.balloons - a.balloons;
        return a.profile.id - b.profile.id;
      });
      sorted.forEach((r, idx) => {
        r.rank = idx + 1;
      });
      return;
    }

    const sorted = [...this.racers].sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      if (a.eliminated && b.eliminated) {
        const stageDiff =
          (this.knockoutEliminatedStage.get(b.profile.id) ?? 0) -
          (this.knockoutEliminatedStage.get(a.profile.id) ?? 0);
        if (stageDiff !== 0) return stageDiff;
        return a.finishTime - b.finishTime;
      }
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.unwrappedProgress - a.unwrappedProgress;
    });
    sorted.forEach((r, idx) => {
      r.rank = idx + 1;
    });
  }

  private resolveRemainingCpuFinishes(): void {
    if (this.raceConfig.mode === 'time_trial') return;
    if (this.raceConfig.mode === 'battle') {
      for (const r of this.racers) {
        r.finished = true;
        r.finishTime = this.raceTime;
      }
      this.computeRanks();
      return;
    }

    const totalLaps = this.getEffectiveTotalLaps();
    const player = this.racers[0];
    const remaining = this.racers
      .filter((r) => !r.finished && !r.eliminated)
      .sort((a, b) => b.unwrappedProgress - a.unwrappedProgress);

    remaining.forEach((r) => {
      const progressLeft = Math.max(0.02, totalLaps - r.unwrappedProgress);
      const estSeconds = (progressLeft * this.track.totalLength) / Math.max(35, r.speed || BASE_MAX_SPEED);
      r.finished = true;
      r.finishTime = player.finishTime + estSeconds;
    });
    this.computeRanks();
  }

  private recordReplaySample(): void {
    if (this.replayRecordingFrames.length >= 3600) return;
    const isTimeTrial = this.raceConfig.mode === 'time_trial';
    const isVsSolo = this.raceConfig.mode === 'vs_race' && Boolean(this.raceConfig.vsSolo);
    const list = isTimeTrial
      ? [this.racers[0]]
      : isVsSolo
        ? this.racers.filter((r) => !r.eliminated)
        : this.racers;
    this.replayRecordingFrames.push({
      t: Number(this.raceTime.toFixed(3)),
      racers: list.map((r) => ({
        id: r.profile.id,
        x: Number(r.position.x.toFixed(2)),
        y: Number(r.position.y.toFixed(2)),
        z: Number(r.position.z.toFixed(2)),
        heading: Number(r.heading.toFixed(3)),
        speed: Number(r.speed.toFixed(1)),
        steerAngle: Number(r.steerAngle.toFixed(3)),
        jumpY: Number(r.jumpY.toFixed(2)),
        stunSpinAngle: Number(r.stunSpinAngle.toFixed(2)),
        lap: r.lap,
        rank: r.rank,
        nitro: r.nitroTimer > 0 || r.boostPadTimer > 0,
        star: r.starTimer > 0,
        bullet: r.bulletTimer > 0,
        eliminated: r.eliminated,
        balloons: r.balloons,
      })),
    });
  }

  private finalizeSavedReplay(): void {
    if (this.replayRecordingFrames.length === 0) return;
    this.recordReplaySample();
    if (this.replayRecordingFrames.length < 2) return;
    const isTimeTrial = this.raceConfig.mode === 'time_trial';
    const isVsSolo = this.raceConfig.mode === 'vs_race' && Boolean(this.raceConfig.vsSolo);
    const list = isTimeTrial
      ? [this.racers[0]]
      : isVsSolo
        ? this.racers.filter((r) => !r.eliminated)
        : this.racers;
    const replay: SavedRaceReplay = {
      courseId: this.getEffectiveCourseId(),
      mode: this.raceConfig.mode,
      engineClass: this.raceConfig.engineClass,
      totalDuration: Math.max(0.2, this.replayRecordingFrames[this.replayRecordingFrames.length - 1].t),
      playerSlotId: this.isMultiplayer ? this.mpMySlot : 0,
      racerMeta: list.map((r) => ({
        id: r.profile.id,
        name: r.displayName,
        characterId: r.characterId,
        carId: r.carId,
        hexColor: r.isHuman ? getCharacterSpec(r.characterId).hexPrimary : r.profile.hexColor,
      })),
      frames: this.replayRecordingFrames,
    };
    this.lastReplay = replay;
    this.persistSavedReplay(replay);
  }

  private applyReplayFrameAtTime(t: number, animDt: number): void {
    if (!this.lastReplay || this.lastReplay.frames.length === 0) return;
    const frames = this.lastReplay.frames;
    let idx = 0;
    if (t >= frames[frames.length - 1].t) {
      idx = Math.max(0, frames.length - 2);
    } else {
      let lo = 0;
      let hi = frames.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (frames[mid].t <= t) lo = mid;
        else hi = mid;
      }
      idx = lo;
    }

    const fa = frames[idx];
    const fb = frames[Math.min(frames.length - 1, idx + 1)];
    const span = Math.max(0.001, fb.t - fa.t);
    const alpha = THREE.MathUtils.clamp((t - fa.t) / span, 0, 1);

    const mapB = new Map<number, ReplayRacerFrame>();
    for (const rb of fb.racers) mapB.set(rb.id, rb);

    for (const entry of this.replayRigs) {
      const a = fa.racers.find((r) => r.id === entry.id);
      if (!a) {
        entry.rig.root.visible = false;
        continue;
      }
      const b = mapB.get(entry.id) ?? a;
      if (a.eliminated && b.eliminated) {
        entry.rig.root.visible = false;
        continue;
      }
      entry.rig.root.visible = true;

      const rx = THREE.MathUtils.lerp(a.x, b.x, alpha);
      const ry = THREE.MathUtils.lerp(a.y, b.y, alpha);
      let bz = b.z;
      if (this.track.isStraight && Math.abs(bz - a.z) > this.track.totalLength * 0.5) {
        bz -= Math.sign(bz - a.z) * this.track.totalLength;
      }
      let rz = THREE.MathUtils.lerp(a.z, bz, alpha);
      if (this.track.isStraight) {
        const halfLen = this.track.totalLength * 0.5;
        if (rz >= halfLen) rz -= this.track.totalLength;
        else if (rz < -halfLen) rz += this.track.totalLength;
      }
      const rJump = THREE.MathUtils.lerp(a.jumpY, b.jumpY, alpha);
      const hDiff = Math.atan2(Math.sin(b.heading - a.heading), Math.cos(b.heading - a.heading));
      const rHeading = a.heading + hDiff * alpha;
      const rSpeed = THREE.MathUtils.lerp(a.speed, b.speed, alpha);
      const rSteer = THREE.MathUtils.lerp(a.steerAngle, b.steerAngle, alpha);
      const rSpin = THREE.MathUtils.lerp(a.stunSpinAngle, b.stunSpinAngle, alpha);

      const frameSnap: ReplayRacerFrame = {
        id: entry.id,
        x: rx,
        y: ry,
        z: rz,
        heading: rHeading,
        speed: rSpeed,
        steerAngle: rSteer,
        jumpY: rJump,
        stunSpinAngle: rSpin,
        lap: alpha > 0.5 ? b.lap : a.lap,
        rank: alpha > 0.5 ? b.rank : a.rank,
        nitro: a.nitro || b.nitro,
        star: a.star || b.star,
        bullet: a.bullet || b.bullet,
        eliminated: false,
        balloons: b.balloons,
      };
      this.replayLatestFrames.set(entry.id, frameSnap);

      const rig = entry.rig;
      rig.root.position.set(rx, ry + rJump, rz);
      rig.root.rotation.set(0, rHeading + rSpin, 0);
      rig.kartBodyGroup.rotation.z = -rSteer * 0.2;
      rig.bulletGroup.visible = frameSnap.bullet;
      rig.kartBodyGroup.visible = !frameSnap.bullet;
      rig.starAuraGroup.visible = frameSnap.star;

      if (frameSnap.star) {
        const hue = (t * 2.5) % 1;
        rig.paintMaterials.forEach((mat, i) => {
          mat.color.setHSL((hue + i * 0.2) % 1, 0.95, 0.56);
          mat.emissive.setHSL((hue + i * 0.2) % 1, 0.9, 0.35);
          mat.emissiveIntensity = 0.7;
        });
      } else {
        rig.paintMaterials.forEach((mat, i) => {
          mat.color.copy(rig.baseColors[i]);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        });
      }

      rig.flameL.visible = frameSnap.nitro;
      rig.flameR.visible = frameSnap.nitro;
      const wDelta = (rSpeed * animDt) / 0.44;
      for (const w of rig.wheels) w.rotation.x += wDelta;
      for (const p of rig.frontSteerPivots) p.rotation.y = rSteer;

      if (this.lastReplay.mode === 'battle') {
        rig.balloonGroup.visible = true;
        rig.balloonGroup.children.forEach((balloon, bIdx) => {
          balloon.visible = bIdx < frameSnap.balloons;
        });
      } else {
        rig.balloonGroup.visible = false;
      }
    }
  }

  private updateReplayCamera(dt: number): void {
    const target =
      this.replayLatestFrames.get(this.replayTargetRacerId) ??
      this.replayLatestFrames.values().next().value;
    if (!target) return;

    this.keyLight.position.set(target.x + 55, target.y + 95, target.z + 45);
    this.keyLight.target.position.set(target.x, target.y, target.z);

    const fwdX = Math.sin(target.heading);
    const fwdZ = Math.cos(target.heading);
    const rightX = Math.cos(target.heading);
    const rightZ = -Math.sin(target.heading);

    if (this.replayCameraAngle === 'bumper') {
      this.camPos.set(target.x + fwdX * 1.4, target.y + target.jumpY + 1.48, target.z + fwdZ * 1.4);
      this.camLook.set(target.x + fwdX * 26, target.y + target.jumpY + 1.4, target.z + fwdZ * 26);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLook);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 74, 8, dt || 0.016);
      this.camera.updateProjectionMatrix();
      return;
    }

    if (this.replayCameraAngle === 'orbit') {
      this.replayOrbitAngle += (dt || 0.016) * 0.55;
      const dist = 11.5;
      this.camera.position.set(
        target.x + Math.sin(this.replayOrbitAngle) * dist,
        target.y + 4.4,
        target.z + Math.cos(this.replayOrbitAngle) * dist,
      );
      this.camera.lookAt(target.x, target.y + 1.5, target.z);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 58, 5, dt || 0.016);
      this.camera.updateProjectionMatrix();
      return;
    }

    if (this.replayCameraAngle === 'helicopter') {
      _v1.set(
        target.x - fwdX * 17 + rightX * 13,
        target.y + 22,
        target.z - fwdZ * 17 + rightZ * 13,
      );
      const lambda = dt > 0 ? 5 : 60;
      this.camPos.x = THREE.MathUtils.damp(this.camPos.x, _v1.x, lambda, dt || 0.016);
      this.camPos.y = THREE.MathUtils.damp(this.camPos.y, _v1.y, lambda, dt || 0.016);
      this.camPos.z = THREE.MathUtils.damp(this.camPos.z, _v1.z, lambda, dt || 0.016);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(target.x + fwdX * 4, target.y + 1.2, target.z + fwdZ * 4);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 54, 5, dt || 0.016);
      this.camera.updateProjectionMatrix();
      return;
    }

    if (this.replayCameraAngle === 'tv_trackside') {
      const distSq =
        (this.replayTvCamPos.x - target.x) ** 2 + (this.replayTvCamPos.z - target.z) ** 2;
      if (!this.replayTvCamValid || distSq > 44 * 44) {
        const closest = this.track.closestPoint(target.x, target.z);
        const postT = (closest.t + 0.032) % 1;
        this.track.sampleAt(postT, _v1, _v2, _v3);
        const side = Math.random() < 0.5 ? 1 : -1;
        this.replayTvCamPos
          .copy(_v1)
          .addScaledVector(_v3, side * (ROAD_HALF_WIDTH + 9));
        this.replayTvCamPos.y += 7.2;
        this.replayTvCamValid = true;
      }
      this.camera.position.copy(this.replayTvCamPos);
      this.camera.lookAt(target.x, target.y + 1.4, target.z);
      const dist = Math.sqrt(
        (this.replayTvCamPos.x - target.x) ** 2 + (this.replayTvCamPos.z - target.z) ** 2,
      );
      const zoomFov = THREE.MathUtils.clamp(62 - dist * 0.65, 32, 62);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, zoomFov, 7, dt || 0.016);
      this.camera.updateProjectionMatrix();
      return;
    }

    // Default 'chase'
    const followDist = target.bullet ? 12.8 : 10.6;
    const followHeight = target.bullet ? 5.2 : 4.6;
    _v1.set(target.x - fwdX * followDist, target.y + followHeight, target.z - fwdZ * followDist);
    _v2.set(target.x + fwdX * 9.5, target.y + 1.7, target.z + fwdZ * 9.5);
    const l = dt > 0 ? 10 : 60;
    this.camPos.x = THREE.MathUtils.damp(this.camPos.x, _v1.x, l, dt || 0.016);
    this.camPos.y = THREE.MathUtils.damp(this.camPos.y, _v1.y, l, dt || 0.016);
    this.camPos.z = THREE.MathUtils.damp(this.camPos.z, _v1.z, l, dt || 0.016);
    this.camLook.x = THREE.MathUtils.damp(this.camLook.x, _v2.x, 14, dt || 0.016);
    this.camLook.y = THREE.MathUtils.damp(this.camLook.y, _v2.y, 14, dt || 0.016);
    this.camLook.z = THREE.MathUtils.damp(this.camLook.z, _v2.z, 14, dt || 0.016);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, target.nitro ? 72 : 64, 7, dt || 0.016);
    this.camera.updateProjectionMatrix();
  }

  private getGhostDeltaSec(): number | null {
    if (
      this.raceConfig.mode !== 'time_trial' ||
      !this.ghostEnabled ||
      !this.ghostSamples ||
      this.ghostSamples.length < 2 ||
      this.phase !== 'playing'
    ) {
      return null;
    }
    const samples = this.ghostSamples;
    const playerProg = this.racers[0]?.maxProgress ?? 0;
    // Only compute split delta when ghost samples carry progress (index 5)
    if (typeof samples[0][5] !== 'number' || typeof samples[samples.length - 1][5] !== 'number') {
      return null;
    }
    for (let i = 1; i < samples.length; i++) {
      const pB = samples[i][5] as number;
      if (pB >= playerProg) {
        const pA = samples[i - 1][5] as number;
        const alpha = THREE.MathUtils.clamp((playerProg - pA) / Math.max(0.0001, pB - pA), 0, 1);
        const ghostTime = THREE.MathUtils.lerp(samples[i - 1][0], samples[i][0], alpha);
        return this.raceTime - ghostTime;
      }
    }
    const last = samples[samples.length - 1];
    return this.raceTime - last[0];
  }

  private updateGhostKart(dt: number): void {
    if (!this.ghostRig) return;
    if (
      !this.ghostEnabled ||
      this.replayMode ||
      this.raceConfig.mode !== 'time_trial' ||
      !this.ghostSamples ||
      this.ghostSamples.length < 2 ||
      (this.phase !== 'playing' && this.phase !== 'countdown')
    ) {
      this.ghostRig.root.visible = false;
      return;
    }
    this.ghostRig.root.visible = true;
    const t = this.phase === 'countdown' ? 0 : this.raceTime;
    const samples = this.ghostSamples;
    if (t <= samples[0][0]) {
      const closest = this.track.closestPoint(samples[0][1], samples[0][2]);
      const gy = typeof samples[0][4] === 'number' ? samples[0][4] : closest.point.y;
      this.ghostRig.root.position.set(samples[0][1], gy, samples[0][2]);
      this.ghostRig.root.rotation.set(0, samples[0][3], 0);
      return;
    }
    const last = samples[samples.length - 1];
    if (t >= last[0]) {
      const closest = this.track.closestPoint(last[1], last[2]);
      const gy = typeof last[4] === 'number' ? last[4] : closest.point.y;
      this.ghostRig.root.position.set(last[1], gy, last[2]);
      this.ghostRig.root.rotation.set(0, last[3], 0);
      return;
    }

    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid][0] <= t) lo = mid;
      else hi = mid;
    }
    const a = samples[lo];
    const b = samples[lo + 1];
    const segDt = Math.max(0.001, b[0] - a[0]);
    const alpha = Math.max(0, Math.min(1, (t - a[0]) / segDt));
    const gx = THREE.MathUtils.lerp(a[1], b[1], alpha);
    let bgz = b[2];
    if (this.track.isStraight && Math.abs(bgz - a[2]) > this.track.totalLength * 0.5) {
      bgz -= Math.sign(bgz - a[2]) * this.track.totalLength;
    }
    let gz = THREE.MathUtils.lerp(a[2], bgz, alpha);
    if (this.track.isStraight) {
      const halfLen = this.track.totalLength * 0.5;
      if (gz >= halfLen) gz -= this.track.totalLength;
      else if (gz < -halfLen) gz += this.track.totalLength;
    }
    const gy =
      typeof a[4] === 'number' && typeof b[4] === 'number'
        ? THREE.MathUtils.lerp(a[4], b[4], alpha)
        : this.track.closestPoint(gx, gz).point.y;
    const hDiff = Math.atan2(Math.sin(b[3] - a[3]), Math.cos(b[3] - a[3]));
    this.ghostRig.root.position.set(gx, gy, gz);
    this.ghostRig.root.rotation.set(0, a[3] + hDiff * alpha, 0);

    const segDist = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const approxSpeed = segDist / segDt;
    this.ghostWheelSpin += (approxSpeed * dt) / 0.44;
    for (const w of this.ghostRig.wheels) {
      w.rotation.x = this.ghostWheelSpin;
    }
  }

  private updateCamera(dt: number): void {
    const localPlayer = this.getLocalPlayer();
    const player =
      this.isMultiplayer && localPlayer.eliminated && this.phase === 'playing'
        ? this.racers.find((r) => !r.eliminated) ?? localPlayer
        : localPlayer;

    this.keyLight.position.set(player.position.x + 55, player.position.y + 95, player.position.z + 45);
    this.keyLight.target.position.copy(player.position);

    if (this.phase === 'title') {
      this.titleOrbitAngle += dt * 0.22;
      const center = this.raceConfig.mode === 'battle' ? _v5.set(0, 0, 0) : player.position;
      const dist = this.raceConfig.mode === 'battle' ? 42 : 24;
      const height = this.raceConfig.mode === 'battle' ? 22 : 8.5;
      this.camera.position.set(
        center.x + Math.sin(this.titleOrbitAngle) * dist,
        center.y + height,
        center.z + Math.cos(this.titleOrbitAngle) * dist,
      );
      this.camera.lookAt(center.x, center.y + 2.2, center.z + (this.raceConfig.mode === 'battle' ? 0 : 8));
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 54, 4, dt);
      this.camera.updateProjectionMatrix();
      return;
    }

    if (this.phase === 'finished') {
      this.finishOrbitAngle += dt * 0.7;
      const dist = 12;
      this.camera.position.set(
        player.position.x + Math.sin(this.finishOrbitAngle) * dist,
        player.position.y + 4.8,
        player.position.z + Math.cos(this.finishOrbitAngle) * dist,
      );
      this.camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 58, 4, dt);
      this.camera.updateProjectionMatrix();
      return;
    }

    const fwdX = Math.sin(player.heading);
    const fwdZ = Math.cos(player.heading);
    const isBoosted = player.nitroTimer > 0 || player.bulletTimer > 0 || player.boostPadTimer > 0;
    const followDist = player.bulletTimer > 0 ? 12.8 : 10.6;
    const followHeight = player.bulletTimer > 0 ? 5.2 : 4.6;

    _v1.set(
      player.position.x - fwdX * followDist,
      player.position.y + followHeight,
      player.position.z - fwdZ * followDist,
    );
    _v2.set(
      player.position.x + fwdX * 9.5,
      player.position.y + 1.7,
      player.position.z + fwdZ * 9.5,
    );

    const posLambda = this.phase === 'countdown' ? 6 : 10;
    this.camPos.x = THREE.MathUtils.damp(this.camPos.x, _v1.x, posLambda, dt);
    this.camPos.y = THREE.MathUtils.damp(this.camPos.y, _v1.y, posLambda, dt);
    this.camPos.z = THREE.MathUtils.damp(this.camPos.z, _v1.z, posLambda, dt);

    this.camLook.x = THREE.MathUtils.damp(this.camLook.x, _v2.x, 14, dt);
    this.camLook.y = THREE.MathUtils.damp(this.camLook.y, _v2.y, 14, dt);
    this.camLook.z = THREE.MathUtils.damp(this.camLook.z, _v2.z, 14, dt);

    this.camera.position.copy(this.camPos);
    if (this.cameraShake > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 1.4;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 1.2;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
    }

    this.camera.lookAt(this.camLook);

    const targetFov = player.bulletTimer > 0 ? 79 : isBoosted ? 74 : 64;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
    this.camera.updateProjectionMatrix();
  }

  private getSoloKnockoutState(): KnockoutHudState | null {
    if (this.raceConfig.mode !== 'knockout_tour') return null;
    const player = this.racers[0];
    const totalStages = KNOCKOUT_STAGE_KEEP_COUNTS.length;
    const cutoffRank = KNOCKOUT_STAGE_KEEP_COUNTS[this.knockoutStageIndex - 1] ?? 3;
    const remainingRacers = this.racers.filter((r) => !r.eliminated).length;
    return {
      stageIndex: this.knockoutStageIndex,
      totalStages,
      gatesPassed: Math.max(0, this.knockoutStageIndex - 1),
      totalGates: totalStages,
      remainingRacers,
      nextGateProgress: this.getEffectiveTotalLaps(),
      cutoffRank,
      isInDanger: !player.eliminated && player.rank > cutoffRank,
      eliminated: player.eliminated,
      stageCleared:
        this.phase === 'finished' &&
        !player.eliminated &&
        this.knockoutStageIndex < totalStages,
      tourComplete:
        this.phase === 'finished' &&
        !player.eliminated &&
        this.knockoutStageIndex >= totalStages,
    };
  }

  private getSoloCupStandings(): CupStandingEntry[] {
    if (this.raceConfig.mode !== 'grand_prix') return [];
    const list: CupStandingEntry[] = this.racers.map((r) => ({
      id: r.profile.id,
      name: r.displayName,
      isPlayer: r.profile.isPlayer,
      isHuman: r.isHuman,
      rank: 1,
      points: this.cupPoints[r.profile.id] ?? 0,
      hexColor: r.isHuman ? getCharacterSpec(r.characterId).hexPrimary : r.profile.hexColor,
    }));
    list.sort((a, b) => b.points - a.points || a.id - b.id);
    list.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    return list;
  }

  private pushHudSnapshot(): void {
    const player = this.getLocalPlayer();
    const isTimeTrial = this.raceConfig.mode === 'time_trial';
    const isBattle = this.raceConfig.mode === 'battle';
    const isVsSolo = this.raceConfig.mode === 'vs_race' && Boolean(this.raceConfig.vsSolo);
    const bounds = this.track.minimapBounds;
    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
    const offsetX = (span - (bounds.maxX - bounds.minX)) * 0.5;
    const offsetZ = (span - (bounds.maxZ - bounds.minZ)) * 0.5;

    const visibleRacers = isTimeTrial
      ? [this.racers[0]]
      : isVsSolo
        ? this.racers.filter((r) => !r.eliminated)
        : this.racers;
    const minimapDots: MinimapDot[] = visibleRacers
      .filter((r) => !r.eliminated)
      .map((r) => {
        const isMe = this.isMultiplayer ? r.profile.id === this.mpMySlot : r.profile.isPlayer;
        return {
          id: r.profile.id,
          x: ((r.position.x - bounds.minX + offsetX) / span) * 100,
          z: ((r.position.z - bounds.minZ + offsetZ) / span) * 100,
          isPlayer: isMe,
          rank: r.rank,
          color: r.isHuman ? getCharacterSpec(r.characterId).hexPrimary : r.profile.hexColor,
        };
      });

    let activeEffect: HudSnapshot['activeEffect'] = null;
    if (player.bulletTimer > 0) {
      activeEffect = { type: 'bullet_bill', remaining: player.bulletTimer, duration: 10.0 };
    } else if (player.starTimer > 0) {
      activeEffect = { type: 'invincible_star', remaining: player.starTimer, duration: 5.0 };
    } else if (player.nitroTimer > 0) {
      activeEffect = { type: 'nitro_mushroom', remaining: player.nitroTimer, duration: 2.0 };
    }

    const spinyIncoming = this.isMultiplayer
      ? this.mpSpinyIncoming
      : this.spinyShells.some((s) => s.targetId === 0);

    const standings: StandingEntry[] =
      this.phase === 'finished'
        ? [...visibleRacers]
            .sort((a, b) => a.rank - b.rank)
            .map((r) => ({
              id: r.profile.id,
              name: r.displayName,
              isPlayer: this.isMultiplayer ? r.profile.id === this.mpMySlot : r.profile.isPlayer,
              isHuman: r.isHuman,
              rank: r.rank,
              finishTime: r.finishTime,
              hexColor: r.isHuman ? getCharacterSpec(r.characterId).hexPrimary : r.profile.hexColor,
              points: this.raceConfig.mode === 'grand_prix' ? GP_POINTS_TABLE[r.rank - 1] ?? 0 : undefined,
              cupPoints:
                this.raceConfig.mode === 'grand_prix'
                  ? (this.isMultiplayer
                      ? this.mpCupStandings.find((c) => c.id === r.profile.id)?.points
                      : this.cupPoints[r.profile.id]) ?? 0
                  : undefined,
              score: isBattle ? r.battleScore : undefined,
              balloons: isBattle ? r.balloons : undefined,
              eliminated: r.eliminated,
            }))
        : [];

    const cupStandings = this.isMultiplayer
      ? this.mpCupStandings.map((c) => ({ ...c, isPlayer: c.id === this.mpMySlot }))
      : this.getSoloCupStandings();

    const knockoutHud = this.isMultiplayer ? this.mpKnockoutState : this.getSoloKnockoutState();

    let replayHud: ReplayHudState | null = null;
    if (this.replayMode && this.lastReplay) {
      const targetMeta =
        this.lastReplay.racerMeta.find((m) => m.id === this.replayTargetRacerId) ??
        this.lastReplay.racerMeta[0];
      const targetFrame = this.replayLatestFrames.get(this.replayTargetRacerId);
      const roster = this.lastReplay.racerMeta.map((m) => ({
        id: m.id,
        name: m.name,
        rank: this.replayLatestFrames.get(m.id)?.rank ?? m.id + 1,
        hexColor: m.hexColor,
      }));
      roster.sort((a, b) => a.rank - b.rank);
      replayHud = {
        active: true,
        paused: this.replayPaused,
        time: this.replayTime,
        duration: this.lastReplay.totalDuration,
        speed: this.replaySpeed,
        cameraAngle: this.replayCameraAngle,
        targetRacerId: targetMeta?.id ?? 0,
        targetRacerName: targetMeta?.name ?? 'Racer',
        targetRacerRank: targetFrame?.rank ?? 1,
        racers: roster,
        courseId: this.lastReplay.courseId,
        mode: this.lastReplay.mode,
      };
    }

    this.onHudUpdate({
      phase: this.phase,
      mode: this.raceConfig.mode,
      courseId: this.getEffectiveCourseId(),
      engineClass: this.raceConfig.engineClass,
      isMultiplayer: this.isMultiplayer,
      countdown: this.isMultiplayer ? this.mpCountdown : Math.max(0, Math.ceil(this.countdownTimer - 0.2)),
      rank: player.rank,
      totalRacers: isTimeTrial
        ? 1
        : isVsSolo
          ? Math.max(1, visibleRacers.length)
          : this.raceConfig.mode === 'knockout_tour' && this.phase !== 'finished' && knockoutHud
            ? Math.max(1, knockoutHud.remainingRacers)
            : this.racers.length,
      lap: player.lap,
      totalLaps: this.getEffectiveTotalLaps(),
      speedKmh: Math.round(Math.abs(player.speed) * 2.7),
      heldItem: player.heldItem,
      rouletteItem: this.isMultiplayer
        ? player.mpRouletteItem
        : player.rouletteTimer > 0
          ? player.rouletteItem
          : null,
      activeEffect,
      spinyIncoming,
      driftLevel: this.isMultiplayer
        ? player.mpDriftLevel
        : player.driftDir === 0
          ? 0
          : player.driftCharge >= 1.5
            ? 2
            : 1,
      eventBanner: this.eventBanner,
      raceTime: this.raceTime,
      minimapDots,
      minimapPath: this.track.minimapPath,
      standings,
      gpRaceIndex: this.gpRaceIndex,
      gpTotalRaces: 4,
      cupStandings,
      knockout: knockoutHud,
      mushroomsLeft: this.mushroomsLeft,
      lapSplits: [...this.lapSplits],
      personalBest: this.personalBest,
      newRecord: this.newRecord,
      ghostActive: Boolean(this.ghostSamples && this.ghostSamples.length >= 2),
      ghostEnabled: this.ghostEnabled,
      ghostDeltaSec: this.getGhostDeltaSec(),
      battleBalloons: player.balloons,
      battleScore: player.battleScore,
      battleTimeLeft: this.battleTimeLeft,
      hasReplay: Boolean(this.lastReplay && this.lastReplay.frames.length >= 2),
      replay: replayHud,
    });
  }

  private stepMultiplayer(dt: number): void {
    if (this.phase === 'playing' && this.mpInputCallback) {
      const changed =
        this.input.up !== this.mpLastInput.up ||
        this.input.down !== this.mpLastInput.down ||
        this.input.left !== this.mpLastInput.left ||
        this.input.right !== this.mpLastInput.right ||
        this.input.drift !== this.mpLastInput.drift ||
        this.input.useItemPressed;

      this.mpInputTimer += dt;
      if (changed || this.mpInputTimer >= 0.05) {
        this.mpInputTimer = 0;
        this.mpLastInput = {
          up: this.input.up,
          down: this.input.down,
          left: this.input.left,
          right: this.input.right,
          drift: this.input.drift,
        };
        this.mpInputCallback({
          ...this.mpLastInput,
          useItem: this.input.useItemPressed,
        });
        this.input.useItemPressed = false;
      }
    }

    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      const t = this.mpServerTargets[i];
      if (t) {
        r.position.x = THREE.MathUtils.damp(r.position.x, t.x, 16, dt);
        r.position.y = THREE.MathUtils.damp(r.position.y, t.y, 16, dt);
        r.position.z = THREE.MathUtils.damp(r.position.z, t.z, 16, dt);
        const hDiff = Math.atan2(Math.sin(t.heading - r.heading), Math.cos(t.heading - r.heading));
        r.heading += hDiff * Math.min(1, 16 * dt);
        r.jumpY = THREE.MathUtils.damp(r.jumpY, t.jumpY, 18, dt);
        r.stunSpinAngle = t.stunSpinAngle;
        r.speed = THREE.MathUtils.damp(r.speed, t.speed, 14, dt);
        r.steerAngle = THREE.MathUtils.damp(r.steerAngle, t.steerAngle, 14, dt);

        if (this.phase === 'playing' && !r.eliminated) {
          const fwdX = Math.sin(r.heading);
          const fwdZ = Math.cos(r.heading);
          if (r.bulletTimer > 0 && Math.random() < 0.7) {
            this.spawnParticle(
              r.position.x - fwdX * 2.4 + (Math.random() - 0.5) * 0.7,
              r.position.y + 1.2,
              r.position.z - fwdZ * 2.4 + (Math.random() - 0.5) * 0.7,
              -fwdX * 12,
              1.5,
              -fwdZ * 12,
              0.35,
              0.85,
              Math.random() < 0.5 ? 0xf97316 : 0xfacc15,
            );
          } else if ((r.nitroTimer > 0 || r.boostPadTimer > 0) && Math.random() < 0.6) {
            this.spawnParticle(
              r.position.x - fwdX * 2.1,
              r.position.y + 0.75,
              r.position.z - fwdZ * 2.1,
              -fwdX * 8,
              1.2,
              -fwdZ * 8,
              0.28,
              0.55,
              r.nitroTimer > 0 ? 0x22d3ee : 0xf97316,
            );
          } else if (r.starTimer > 0 && Math.random() < 0.5) {
            const rainbow = [0xfacc15, 0xf43f5e, 0x38bdf8, 0x4ade80];
            this.spawnParticle(
              r.position.x + (Math.random() - 0.5) * 2.2,
              r.position.y + 0.8 + Math.random(),
              r.position.z + (Math.random() - 0.5) * 2.2,
              0,
              3.5,
              0,
              0.38,
              0.45,
              rainbow[Math.floor(Math.random() * rainbow.length)],
            );
          }
        }
      }
      this.syncKartVisuals(r, dt);
    }

    for (const entry of this.mpVisualProjectiles.values()) {
      entry.mesh.position.x = THREE.MathUtils.damp(entry.mesh.position.x, entry.target.x, 20, dt);
      entry.mesh.position.y = THREE.MathUtils.damp(entry.mesh.position.y, entry.target.y, 20, dt);
      entry.mesh.position.z = THREE.MathUtils.damp(entry.mesh.position.z, entry.target.z, 20, dt);
      if (entry.spinRate !== 0) {
        entry.mesh.rotation.y += entry.spinRate * dt;
      }
    }

    const me = this.getLocalPlayer();
    this.audio.updateEngine(
      this.phase === 'playing' && !me.eliminated,
      Math.min(1, Math.abs(me.speed) / BASE_MAX_SPEED),
      me.nitroTimer > 0 || me.boostPadTimer > 0,
      me.bulletTimer > 0,
    );

    this.updateParticles(dt);
    if (this.phase === 'playing') {
      this.replayRecordTimer += dt;
      if (this.replayRecordTimer >= 0.075) {
        this.replayRecordTimer = 0;
        this.recordReplaySample();
      }
    }
    this.updateCamera(dt);

    this.hudThrottleTimer += dt;
    if (this.hudThrottleTimer >= 0.06) {
      this.hudThrottleTimer = 0;
      this.pushHudSnapshot();
    }
  }

  private stepSimulation(dt: number): void {
    const nowSec = performance.now() * 0.001;
    const hideBoxes =
      !this.isMultiplayer &&
      (this.raceConfig.mode === 'time_trial' || this.raceConfig.itemFrequency === 'none');

    for (const box of this.track.itemBoxes) {
      if (hideBoxes) {
        box.mesh.visible = false;
      } else if (this.isMultiplayer) {
        if (box.mesh.visible) {
          box.mesh.rotation.y = nowSec * 1.8 + box.id * 0.5;
          box.mesh.rotation.x = Math.sin(nowSec * 1.4 + box.id) * 0.2;
          box.innerMesh.rotation.y = -nowSec * 3.2;
          box.mesh.position.y = box.position.y + Math.sin(nowSec * 2.6 + box.id) * 0.22;
        }
      } else if (box.respawnTimer > 0) {
        box.respawnTimer = Math.max(0, box.respawnTimer - dt);
        if (box.respawnTimer === 0) box.mesh.visible = true;
      } else {
        box.mesh.rotation.y = nowSec * 1.8 + box.id * 0.5;
        box.mesh.rotation.x = Math.sin(nowSec * 1.4 + box.id) * 0.2;
        box.innerMesh.rotation.y = -nowSec * 3.2;
        box.mesh.position.y = box.position.y + Math.sin(nowSec * 2.6 + box.id) * 0.22;
      }
    }

    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer = Math.max(0, this.eventBannerTimer - dt);
      if (this.eventBannerTimer === 0) this.eventBanner = null;
    }

    if (this.replayMode && this.lastReplay) {
      if (!this.replayPaused) {
        this.replayTime += dt * this.replaySpeed;
        if (this.replayTime >= this.lastReplay.totalDuration) {
          this.replayTime = this.lastReplay.totalDuration;
          this.replayPaused = true;
          this.audio.setMusicPaused(true);
        }
      }
      const animDt = this.replayPaused ? 0 : dt * this.replaySpeed;
      this.applyReplayFrameAtTime(this.replayTime, animDt);
      this.updateReplayCamera(dt);
      this.hudThrottleTimer += dt;
      if (this.hudThrottleTimer >= 0.06) {
        this.hudThrottleTimer = 0;
        this.pushHudSnapshot();
      }
      return;
    }

    if (this.isMultiplayer) {
      this.stepMultiplayer(dt);
      return;
    }

    if (this.phase === 'paused') {
      return;
    }

    if (this.phase === 'countdown') {
      this.countdownTimer -= dt;
      const cInt = Math.max(0, Math.ceil(this.countdownTimer - 0.2));
      if (cInt !== this.lastCountdownInt) {
        this.lastCountdownInt = cInt;
        if (cInt >= 1 && cInt <= 3) {
          this.audio.playCountdown(false);
        } else if (cInt === 0) {
          this.audio.playCountdown(true);
          this.phase = 'playing';
          const musicTrack: MusicTrackId =
            this.raceConfig.mode === 'battle' ? 'battle' : this.getEffectiveCourseId();
          this.audio.startMusic(musicTrack, { reset: true });
          const koCutoff = KNOCKOUT_STAGE_KEEP_COUNTS[this.knockoutStageIndex - 1] ?? 3;
          const bannerMsg =
            this.raceConfig.mode === 'battle'
              ? 'BATTLE START! POP BALLOONS!'
              : this.raceConfig.mode === 'knockout_tour'
                ? this.knockoutStageIndex === 6
                  ? 'FINAL STAGE 6/6 — RACE FOR GOLD!'
                  : `STAGE ${this.knockoutStageIndex}/6 — TOP ${koCutoff} ADVANCE!`
                : this.raceConfig.mode === 'time_trial'
                  ? 'TIME TRIAL! BEAT THE CLOCK!'
                  : this.raceConfig.mode === 'grand_prix'
                    ? `RACE ${this.gpRaceIndex}/4 — GO!`
                    : 'GO! TOP 3 WIN!';
          this.showBanner(bannerMsg, 1.8);
        }
        this.pushHudSnapshot();
      }
      this.updateGhostKart(dt);
      this.updateCamera(dt);
      return;
    }

    if (this.phase === 'playing' || this.phase === 'finished') {
      const isTimeTrial = this.raceConfig.mode === 'time_trial';
      const isBattle = this.raceConfig.mode === 'battle';

      if (this.phase === 'playing') {
        this.raceTime += dt;
        if (isBattle) {
          this.battleTimeLeft = Math.max(0, this.battleTimeLeft - dt);
          if (this.battleTimeLeft <= 0) {
            this.finalizeSoloRace(this.racers[0].rank <= 3);
          }
        }
        if (isTimeTrial) {
          this.recordTimer += dt;
          if (this.recordTimer >= 0.08 && this.recordingSamples.length < 4000) {
            this.recordTimer = 0;
            const p = this.racers[0];
            this.recordingSamples.push([
              Number(this.raceTime.toFixed(2)),
              Number(p.position.x.toFixed(2)),
              Number(p.position.z.toFixed(2)),
              Number(p.heading.toFixed(2)),
              Number(p.position.y.toFixed(2)),
              Number(p.maxProgress.toFixed(4)),
            ]);
          }
        }
        this.replayRecordTimer += dt;
        if (this.replayRecordTimer >= 0.075) {
          this.replayRecordTimer = 0;
          this.recordReplaySample();
        }
      }

      const activeList = isTimeTrial ? [this.racers[0]] : this.racers;
      for (const racer of activeList) {
        this.updateRacer(racer, dt);
      }
      this.handleRacerCollisions();
      for (const racer of activeList) {
        this.syncKartVisuals(racer, 0);
      }
      this.updateProjectiles(dt);
      this.computeRanks();
      this.updateGhostKart(dt);

      const player = this.racers[0];
      this.audio.updateEngine(
        this.phase === 'playing' && !player.eliminated,
        Math.min(1, Math.abs(player.speed) / BASE_MAX_SPEED),
        player.nitroTimer > 0 || player.boostPadTimer > 0,
        player.bulletTimer > 0,
      );
    }

    this.updateParticles(dt);
    this.updateCamera(dt);

    this.hudThrottleTimer += dt;
    if (this.hudThrottleTimer >= 0.06) {
      this.hudThrottleTimer = 0;
      this.pushHudSnapshot();
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else {
        this.stepSimulation(dt);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);

    this.audio.dispose();

    this.scene.traverse((obj) => {
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

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export { ITEM_METADATA };
