import * as THREE from 'three';
import type { WebSocket } from 'ws';
import type {
  LobbyState,
  RoomPlayerInfo,
  ServerProjectileState,
  ServerRaceEvent,
  ServerRacerState,
} from '../game/multiplayerTypes.ts';
import {
  BATTLE_ARENA_RADIUS,
  BATTLE_BOOST_PADS,
  BATTLE_ITEM_SPOTS,
  BATTLE_PILLARS,
  createTrackMath,
  ROAD_HALF_WIDTH,
} from '../game/trackMath.ts';
import type { TrackMath } from '../game/trackMath.ts';
import {
  ALL_ITEMS,
  DEFAULT_RACE_CONFIG,
  ENGINE_CLASS_MULT,
  getCarSpec,
  getCharacterSpec,
  getCourseDefaultLaps,
  getCupSpec,
  getKnockoutCupSpec,
  GP_POINTS_TABLE,
  KNOCKOUT_STAGE_KEEP_COUNTS,
  RACER_PROFILES,
} from '../game/types.ts';
import type {
  CarId,
  CharacterId,
  CourseId,
  CupStandingEntry,
  GamePhase,
  ItemType,
  KnockoutHudState,
  RaceConfig,
} from '../game/types.ts';

const START_T = 0.06;
const BASE_MAX_SPEED = 62;
const TICK_MS = 50; // 20 Hz server simulation
const BATTLE_DURATION_SEC = 90;

const BATTLE_ITEMS: ItemType[] = [
  'green_shell',
  'banana_peel',
  'invincible_star',
  'lightning_bolt',
  'nitro_mushroom',
];

const trackCache = new Map<CourseId, TrackMath>();
function getTrackMath(courseId: CourseId): TrackMath {
  let cached = trackCache.get(courseId);
  if (!cached) {
    cached = createTrackMath(courseId);
    trackCache.set(courseId, cached);
  }
  return cached;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3();

interface HumanSeat {
  slotIndex: number;
  clientId: string;
  ws: WebSocket | null;
  name: string;
  characterId: CharacterId;
  carId: CarId;
  connected: boolean;
  input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    useItemPressed: boolean;
  };
}

interface SimRacer {
  id: number;
  name: string;
  isHuman: boolean;
  carId: CarId;
  characterId: CharacterId;
  skill: number;
  position: THREE.Vector3;
  heading: number;
  speed: number;
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
}

interface SpinyShell {
  id: number;
  ownerId: number;
  targetId: number;
  splineT: number;
  lateral: number;
  position: THREE.Vector3;
  phase: 'chase' | 'hover';
  hoverTimer: number;
  life: number;
}

interface GreenShell {
  id: number;
  ownerId: number;
  position: THREE.Vector3;
  heading: number;
  speed: number;
  splineT: number;
  bouncesLeft: number;
  life: number;
}

interface BananaHazard {
  id: number;
  ownerId: number;
  position: THREE.Vector3;
  graceTimer: number;
  life: number;
}

export class RaceRoom {
  public readonly roomCode: string;
  public hostId: string;
  public status: LobbyState['status'] = 'lobby';
  public lastActivity = Date.now();
  public raceConfig: RaceConfig = { ...DEFAULT_RACE_CONFIG };
  public gpRaceIndex = 1;
  public knockoutStageIndex = 1;

  private cupPoints: number[] = new Array(14).fill(0);
  private knockoutEliminatedStage = new Map<number, number>();
  private seats: Array<HumanSeat | null> = new Array(14).fill(null);
  private racers: SimRacer[] = [];
  private activeTrack: TrackMath = getTrackMath(DEFAULT_RACE_CONFIG.courseId);
  private itemBoxTimers: number[] = new Array(this.activeTrack.itemBoxSpecs.length).fill(0);
  private battleTimeLeft = BATTLE_DURATION_SEC;

  private spinyShells: SpinyShell[] = [];
  private greenShells: GreenShell[] = [];
  private bananaHazards: BananaHazard[] = [];
  private nextEntityId = 1;

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private phase: GamePhase = 'title';
  private countdownTimer = 3.2;
  private lastCountdownInt = 4;
  private raceTime = 0;
  private firstHumanFinishAt: number | null = null;
  private pendingEvents: ServerRaceEvent[] = [];

  constructor(roomCode: string, hostId: string) {
    this.roomCode = roomCode;
    this.hostId = hostId;
  }

  public getHumanCount(): number {
    return this.seats.filter((s) => s !== null && s.connected).length;
  }

  public getTotalSeatedCount(): number {
    return this.seats.filter((s) => s !== null).length;
  }

  public getHostName(): string {
    const hostSeat = this.seats.find((s) => s && s.clientId === this.hostId);
    return hostSeat?.name ?? 'Host';
  }

  public findSeatByClientId(clientId: string): HumanSeat | null {
    return this.seats.find((s) => s !== null && s.clientId === clientId) ?? null;
  }

  public setRaceConfig(requesterId: string, patch: Partial<RaceConfig>): { ok: true } | { error: string } {
    if (requesterId !== this.hostId) {
      return { error: 'Only the room host can change race settings.' };
    }
    if (this.status !== 'lobby') {
      return { error: 'Cannot change mode while a race is running.' };
    }
    const prevCourse = this.raceConfig.courseId;
    const prevMode = this.raceConfig.mode;
    const prevKnockoutCup = this.raceConfig.knockoutCupId;
    this.raceConfig = {
      ...this.raceConfig,
      ...patch,
      mode: patch.mode && patch.mode !== 'time_trial' ? patch.mode : this.raceConfig.mode,
    };

    if (this.raceConfig.mode === 'grand_prix') {
      if (prevMode !== 'grand_prix' || (patch.cupId && patch.cupId !== this.raceConfig.cupId)) {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
      }
      if (patch.cupId) {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
      }
      const cupCourses = getCupSpec(this.raceConfig.cupId).courses;
      this.raceConfig.courseId = cupCourses[this.gpRaceIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (this.raceConfig.mode === 'knockout_tour') {
      if (prevMode !== 'knockout_tour' || (patch.knockoutCupId && patch.knockoutCupId !== prevKnockoutCup)) {
        this.knockoutStageIndex = 1;
        this.knockoutEliminatedStage.clear();
      }
      const koCourses = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses;
      this.raceConfig.courseId = koCourses[this.knockoutStageIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (patch.courseId && patch.courseId !== prevCourse && patch.laps === undefined) {
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (this.raceConfig.courseId !== 'bung_stadium' && this.raceConfig.laps > 1000) {
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    }

    this.lastActivity = Date.now();
    return { ok: true };
  }

  private getEffectiveTotalLaps(): number {
    const courseId = this.getEffectiveCourseId();
    if (this.raceConfig.mode === 'battle') return 1;
    if (this.raceConfig.mode === 'vs_race') return this.raceConfig.laps;
    return getCourseDefaultLaps(courseId);
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

  private buildCupStandings(players?: RoomPlayerInfo[]): CupStandingEntry[] {
    if (this.raceConfig.mode !== 'grand_prix') return [];
    const list: CupStandingEntry[] = [];
    if (this.racers.length === 14) {
      for (const r of this.racers) {
        const charSpec = getCharacterSpec(r.characterId);
        list.push({
          id: r.id,
          name: r.name,
          isPlayer: false,
          isHuman: r.isHuman,
          rank: 1,
          points: this.cupPoints[r.id] ?? 0,
          hexColor: r.isHuman ? charSpec.hexPrimary : RACER_PROFILES[r.id]?.hexColor ?? charSpec.hexPrimary,
        });
      }
    } else if (players && players.length === 14) {
      for (const p of players) {
        list.push({
          id: p.slotIndex,
          name: p.name,
          isPlayer: false,
          isHuman: !p.isCpu,
          rank: 1,
          points: this.cupPoints[p.slotIndex] ?? 0,
          hexColor: p.hexColor,
        });
      }
    }
    list.sort((a, b) => b.points - a.points || a.id - b.id);
    list.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    return list;
  }

  private getKnockoutState(): KnockoutHudState | null {
    if (this.raceConfig.mode !== 'knockout_tour') return null;
    const totalStages = KNOCKOUT_STAGE_KEEP_COUNTS.length;
    const cutoffRank = KNOCKOUT_STAGE_KEEP_COUNTS[this.knockoutStageIndex - 1] ?? 3;
    const remainingRacers =
      this.racers.length > 0
        ? this.racers.filter((r) => !r.eliminated).length
        : Math.max(0, 14 - this.knockoutEliminatedStage.size);
    return {
      stageIndex: this.knockoutStageIndex,
      totalStages,
      gatesPassed: Math.max(0, this.knockoutStageIndex - 1),
      totalGates: totalStages,
      remainingRacers,
      nextGateProgress: this.getEffectiveTotalLaps(),
      cutoffRank,
      isInDanger: false,
      eliminated: false,
      stageCleared: this.status === 'finished' && this.knockoutStageIndex < totalStages,
      tourComplete: this.status === 'finished' && this.knockoutStageIndex >= totalStages,
    };
  }

  public addOrReconnectPlayer(
    clientId: string,
    ws: WebSocket,
    name: string,
    characterId: CharacterId,
    carId: CarId,
  ): { seat: HumanSeat } | { error: string } {
    this.lastActivity = Date.now();

    const existing = this.findSeatByClientId(clientId);
    if (existing) {
      if (existing.connected && existing.ws !== ws) {
        return { error: 'Player session is already active.' };
      }
      existing.ws = ws;
      existing.connected = true;
      existing.name = name;
      existing.characterId = characterId;
      existing.carId = carId;
      return { seat: existing };
    }

    if (this.status !== 'lobby') {
      return { error: 'Race already in progress. Try another room or create a new one.' };
    }

    const freeSlot = this.seats.findIndex((s) => s === null);
    if (freeSlot === -1) {
      return { error: 'Room is full (14/14 human players).' };
    }

    const seat: HumanSeat = {
      slotIndex: freeSlot,
      clientId,
      ws,
      name,
      characterId,
      carId,
      connected: true,
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        drift: false,
        useItemPressed: false,
      },
    };
    this.seats[freeSlot] = seat;
    if (!this.seats.some((s) => s && s.clientId === this.hostId && s.connected)) {
      this.hostId = clientId;
    }
    return { seat };
  }

  public updatePlayerProfile(
    clientId: string,
    name: string,
    characterId: CharacterId,
    carId: CarId,
  ): void {
    const seat = this.findSeatByClientId(clientId);
    if (!seat) return;
    seat.name = name;
    seat.characterId = characterId;
    seat.carId = carId;
    this.lastActivity = Date.now();
  }

  public handleDisconnect(clientId: string, removeImmediately: boolean): void {
    const seat = this.findSeatByClientId(clientId);
    if (!seat) return;

    seat.ws = null;
    seat.connected = false;
    seat.input.up = false;
    seat.input.down = false;
    seat.input.left = false;
    seat.input.right = false;
    seat.input.drift = false;

    if (this.status === 'lobby' || removeImmediately) {
      this.seats[seat.slotIndex] = null;
    }

    if (this.hostId === clientId) {
      const nextHost = this.seats.find((s) => s !== null && s.connected);
      if (nextHost) {
        this.hostId = nextHost.clientId;
      }
    }

    if (this.getHumanCount() === 0) {
      this.stopLoop();
    }
  }

  public setPlayerInput(
    clientId: string,
    input: {
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      drift: boolean;
      useItem: boolean;
    },
  ): void {
    const seat = this.findSeatByClientId(clientId);
    if (!seat) return;
    seat.input.up = input.up;
    seat.input.down = input.down;
    seat.input.left = input.left;
    seat.input.right = input.right;
    seat.input.drift = input.drift;
    if (input.useItem) {
      seat.input.useItemPressed = true;
    }
    this.lastActivity = Date.now();
  }

  public getLobbyState(): LobbyState {
    const usedNames = new Set<string>();
    const players: RoomPlayerInfo[] = [];

    for (let i = 0; i < 14; i++) {
      const seat = this.seats[i];
      if (seat) {
        usedNames.add(seat.name.toLowerCase());
      }
    }

    const humanCpuPool = RACER_PROFILES.slice(1);
    const extraHumanNames = [
      'Chris', 'Sam', 'Liam', 'Tara', 'Noah', 'Ivy',
      'Milo', 'Zara', 'Jude', 'Vera', 'Cole', 'Jade', 'Hugo', 'Cleo',
    ];
    let cpuPoolIdx = 0;
    let extraNameIdx = 0;
    for (let i = 0; i < 14; i++) {
      const seat = this.seats[i];
      if (seat) {
        const charSpec = getCharacterSpec(seat.characterId);
        players.push({
          slotIndex: i,
          clientId: seat.clientId,
          name: seat.name,
          characterId: seat.characterId,
          carId: seat.carId,
          hexColor: charSpec.hexPrimary,
          isHost: seat.clientId === this.hostId,
          isCpu: false,
          connected: seat.connected,
        });
      } else {
        let prof = humanCpuPool[cpuPoolIdx % humanCpuPool.length];
        let attempts = 0;
        while (usedNames.has(prof.name.toLowerCase()) && attempts < humanCpuPool.length) {
          cpuPoolIdx++;
          attempts++;
          prof = humanCpuPool[cpuPoolIdx % humanCpuPool.length];
        }
        let cpuName = prof.name;
        if (usedNames.has(cpuName.toLowerCase())) {
          while (
            extraNameIdx < extraHumanNames.length &&
            usedNames.has(extraHumanNames[extraNameIdx].toLowerCase())
          ) {
            extraNameIdx++;
          }
          cpuName =
            extraNameIdx < extraHumanNames.length
              ? extraHumanNames[extraNameIdx++]
              : `Driver ${i + 1}`;
        }
        cpuPoolIdx++;
        usedNames.add(cpuName.toLowerCase());
        players.push({
          slotIndex: i,
          clientId: `cpu_${i}`,
          name: cpuName,
          characterId: prof.characterId,
          carId: prof.carId,
          hexColor: prof.hexColor,
          isHost: false,
          isCpu: true,
          connected: true,
        });
      }
    }

    return {
      roomCode: this.roomCode,
      status: this.status,
      hostId: this.hostId,
      players,
      humanCount: this.getHumanCount(),
      maxPlayers: 14,
      raceConfig: this.raceConfig,
      gpRaceIndex: this.gpRaceIndex,
      knockoutStageIndex: this.knockoutStageIndex,
      knockoutEliminatedIds: Array.from(this.knockoutEliminatedStage.keys()),
      cupStandings: this.buildCupStandings(players),
    };
  }

  public broadcast(payload: unknown): void {
    const msg = JSON.stringify(payload);
    for (const seat of this.seats) {
      if (seat && seat.connected && seat.ws && seat.ws.readyState === 1) {
        seat.ws.send(msg);
      }
    }
  }

  public startRace(requesterId: string): { ok: true } | { error: string } {
    if (requesterId !== this.hostId) {
      return { error: 'Only the room host can start the race.' };
    }
    if (this.status === 'countdown' || this.status === 'playing') {
      return { error: 'Race is already running.' };
    }

    const effectiveCourseId = this.getEffectiveCourseId();
    this.raceConfig.courseId = effectiveCourseId;
    if (this.raceConfig.mode === 'grand_prix' || this.raceConfig.mode === 'knockout_tour') {
      this.raceConfig.laps = getCourseDefaultLaps(effectiveCourseId);
    }
    this.activeTrack = getTrackMath(effectiveCourseId);
    const isBattle = this.raceConfig.mode === 'battle';

    this.lastActivity = Date.now();
    this.status = 'countdown';
    this.phase = 'countdown';
    this.countdownTimer = 3.2;
    this.lastCountdownInt = 4;
    this.raceTime = 0;
    this.tickCount = 0;
    this.firstHumanFinishAt = null;
    this.pendingEvents = [];
    this.battleTimeLeft = BATTLE_DURATION_SEC;

    this.spinyShells = [];
    this.greenShells = [];
    this.bananaHazards = [];
    const boxCount = isBattle ? BATTLE_ITEM_SPOTS.length : this.activeTrack.itemBoxSpecs.length;
    this.itemBoxTimers = new Array(boxCount).fill(0);

    for (const s of this.seats) {
      if (s) {
        s.input.up = false;
        s.input.down = false;
        s.input.left = false;
        s.input.right = false;
        s.input.drift = false;
        s.input.useItemPressed = false;
      }
    }

    const diffBoost =
      this.raceConfig.cpuDifficulty === 'master'
        ? 1.07
        : this.raceConfig.cpuDifficulty === 'hard'
          ? 1.035
          : 1.0;

    const lobby = this.getLobbyState();
    this.racers = lobby.players.map((p, idx) => {
      const prof = RACER_PROFILES[idx] ?? RACER_PROFILES[0];
      return {
        id: idx,
        name: p.name,
        isHuman: !p.isCpu,
        carId: p.carId,
        characterId: p.characterId,
        skill: p.isCpu ? prof.skill * diffBoost : 1.0,
        position: new THREE.Vector3(),
        heading: 0,
        speed: 0,
        steerAngle: 0,
        splineT: START_T,
        unwrappedProgress: 0,
        maxProgress: 0,
        lap: 1,
        rank: idx + 1,
        finished: false,
        finishTime: 0,
        eliminated: false,
        balloons: 3,
        battleScore: 0,
        battleShieldTimer: isBattle ? 1.5 : 0,
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
        aiItemCooldown: 1.8 + Math.random() * 2.5,
        aiLaneTimer: 1 + Math.random() * 2,
        aiBattleTargetId: (idx + 3) % 14,
        aiBattleTimer: 2 + Math.random() * 2,
      };
    });

    if (isBattle) {
      this.racers.forEach((r, idx) => {
        const angle = (idx / 14) * Math.PI * 2;
        const rad = 52;
        r.position.set(Math.sin(angle) * rad, 0.2, Math.cos(angle) * rad);
        r.heading = Math.atan2(-r.position.x, -r.position.z);
        r.rank = idx + 1;
      });
    } else {
      const isKnockout = this.raceConfig.mode === 'knockout_tour';
      const isVsSolo = this.raceConfig.mode === 'vs_race' && Boolean(this.raceConfig.vsSolo);
      const activeIds: number[] = [];
      for (const r of this.racers) {
        if ((isKnockout && this.knockoutEliminatedStage.has(r.id)) || (isVsSolo && !r.isHuman)) {
          r.eliminated = true;
          r.finished = true;
          r.finishTime = 0;
          r.position.set(0, -100, 0);
        } else {
          activeIds.push(r.id);
        }
      }
      const humanIds = activeIds.filter((id) => this.racers[id].isHuman);
      const cpuIds = activeIds.filter((id) => !this.racers[id].isHuman);
      const frontCpus = cpuIds.slice(0, Math.max(0, activeIds.length - humanIds.length - 2));
      const tailCpus = cpuIds.slice(frontCpus.length);
      const gridOrder = [...frontCpus, ...humanIds, ...tailCpus];

      gridOrder.forEach((racerId, slotIdx) => {
        const r = this.racers[racerId];
        const row = Math.floor(slotIdx / 2);
        const col = slotIdx % 2;
        const tOffset = -0.006 - row * 0.0055;
        const t = (START_T + tOffset + 1) % 1;
        const lat = activeIds.length === 1 ? 0 : (col === 0 ? -4.2 : 4.2) + (row % 2 === 0 ? -0.6 : 0.6);

        this.activeTrack.sampleAt(t, _v1, _v2, _v3);
        r.position.copy(_v1).addScaledVector(_v3, lat);
        r.heading = Math.atan2(_v2.x, _v2.z);
        r.splineT = t;
        r.unwrappedProgress = tOffset;
        r.maxProgress = tOffset;
        r.rank = slotIdx + 1;
        r.aiTargetLat = lat * 0.6;
      });
      this.computeRanks();
    }

    this.broadcast({ type: 'lobby_update', lobby });
    this.broadcastRaceState();

    this.stopLoop();
    this.tickHandle = setInterval(() => this.stepTick(TICK_MS / 1000), TICK_MS);
    return { ok: true };
  }

  public returnToLobby(requesterId: string): { ok: true } | { error: string } {
    if (requesterId !== this.hostId) {
      return { error: 'Only the host can return the room to lobby.' };
    }
    this.stopLoop();
    if (this.status === 'finished' && this.raceConfig.mode === 'grand_prix') {
      if (this.gpRaceIndex < 4) {
        this.gpRaceIndex++;
      } else {
        this.gpRaceIndex = 1;
        this.cupPoints.fill(0);
      }
      const cupCourses = getCupSpec(this.raceConfig.cupId).courses;
      this.raceConfig.courseId = cupCourses[this.gpRaceIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    } else if (this.status === 'finished' && this.raceConfig.mode === 'knockout_tour') {
      const anyHumanAlive = this.seats.some(
        (s) => s && s.connected && !this.knockoutEliminatedStage.has(s.slotIndex),
      );
      if (this.knockoutStageIndex < KNOCKOUT_STAGE_KEEP_COUNTS.length && anyHumanAlive) {
        this.knockoutStageIndex++;
      } else {
        this.knockoutStageIndex = 1;
        this.knockoutEliminatedStage.clear();
      }
      const koCourses = getKnockoutCupSpec(this.raceConfig.knockoutCupId).courses;
      this.raceConfig.courseId = koCourses[this.knockoutStageIndex - 1];
      this.raceConfig.laps = getCourseDefaultLaps(this.raceConfig.courseId);
    }
    this.status = 'lobby';
    this.phase = 'title';
    for (let i = 0; i < 14; i++) {
      const s = this.seats[i];
      if (s && !s.connected) {
        this.seats[i] = null;
      }
    }
    this.broadcast({ type: 'lobby_update', lobby: this.getLobbyState() });
    return { ok: true };
  }

  public stopLoop(): void {
    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
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

  private handleAttackHit(
    attackerId: number,
    victim: SimRacer,
    duration = 1.5,
    colorHex = 0xfef08a,
  ): void {
    if (victim.starTimer > 0 || victim.bulletTimer > 0 || victim.stunTimer > 0.4) return;
    if (this.raceConfig.mode === 'battle') {
      if (victim.battleShieldTimer > 0) return;
      victim.balloons = Math.max(0, victim.balloons - 1);
      victim.battleShieldTimer = 1.6;
      if (attackerId !== victim.id && this.racers[attackerId]) {
        this.racers[attackerId].battleScore += 1;
      }
      this.pendingEvents.push({
        type: 'balloon_pop',
        racerId: attackerId,
        targetId: victim.id,
        x: victim.position.x,
        y: victim.position.y + 1.8,
        z: victim.position.z,
        colorHex,
      });
      if (victim.balloons <= 0) {
        victim.battleScore = Math.max(0, victim.battleScore - 1);
        victim.balloons = 3;
        victim.battleShieldTimer = 2.6;
        const angle = Math.random() * Math.PI * 2;
        victim.position.set(Math.sin(angle) * 44, 0.2, Math.cos(angle) * 44);
        victim.speed = 0;
        if (victim.isHuman) {
          this.pendingEvents.push({
            type: 'banner',
            racerId: victim.id,
            text: 'ALL BALLOONS POPPED! RESPAWNED (-1 PT)',
          });
        }
      }
    }
    this.knockdownRacer(victim, duration, colorHex);
  }

  private knockdownRacer(victim: SimRacer, duration = 1.5, colorHex = 0xfef08a): void {
    if (victim.starTimer > 0 || victim.bulletTimer > 0 || victim.stunTimer > 0.4) return;
    victim.stunTimer = duration;
    victim.speed *= 0.25;
    victim.jumpVelY = 12.5;
    this.pendingEvents.push({
      type: 'knockdown',
      racerId: victim.id,
      x: victim.position.x,
      y: victim.position.y,
      z: victim.position.z,
      colorHex,
    });
  }

  private activateItem(racer: SimRacer): void {
    const item = racer.heldItem;
    if (!item) return;
    racer.heldItem = null;

    this.pendingEvents.push({
      type: 'item_use',
      racerId: racer.id,
      item,
      x: racer.position.x,
      y: racer.position.y,
      z: racer.position.z,
    });

    switch (item) {
      case 'bullet_bill': {
        racer.bulletTimer = 10.0;
        racer.stunTimer = 0;
        racer.lightningSlowTimer = 0;
        racer.jumpY = 0;
        break;
      }
      case 'nitro_mushroom': {
        racer.nitroTimer = 2.0;
        break;
      }
      case 'invincible_star': {
        racer.starTimer = 5.0;
        racer.stunTimer = 0;
        racer.lightningSlowTimer = 0;
        break;
      }
      case 'spiny_shell': {
        const firstPlace = this.racers.find((r) => !r.eliminated && r.rank === 1) ?? this.racers[0];
        const target =
          firstPlace.id === racer.id
            ? this.racers.find((r) => !r.eliminated && r.rank === 2) ?? null
            : firstPlace;
        if (!target || target.id === racer.id) {
          racer.nitroTimer = 2.0;
          break;
        }
        this.spinyShells.push({
          id: this.nextEntityId++,
          ownerId: racer.id,
          targetId: target.id,
          splineT: racer.splineT,
          lateral: 0,
          position: racer.position.clone().setY(racer.position.y + 1.0),
          phase: 'chase',
          hoverTimer: 0.55,
          life: 16,
        });
        this.pendingEvents.push({
          type: 'banner',
          racerId: racer.id,
          targetId: target.id,
          text: `SPINY SHELL LOCKED ON ${target.name.toUpperCase()}!`,
        });
        break;
      }
      case 'green_shell': {
        const fx = Math.sin(racer.heading);
        const fz = Math.cos(racer.heading);
        this.greenShells.push({
          id: this.nextEntityId++,
          ownerId: racer.id,
          position: new THREE.Vector3(
            racer.position.x + fx * 2.8,
            racer.position.y + 0.55,
            racer.position.z + fz * 2.8,
          ),
          heading: racer.heading,
          speed: 112,
          splineT: racer.splineT,
          bouncesLeft: this.raceConfig.mode === 'battle' ? 6 : 4,
          life: 8,
        });
        break;
      }
      case 'banana_peel': {
        const fx = Math.sin(racer.heading);
        const fz = Math.cos(racer.heading);
        this.bananaHazards.push({
          id: this.nextEntityId++,
          ownerId: racer.id,
          position: new THREE.Vector3(
            racer.position.x - fx * 3.0,
            racer.position.y + 0.06,
            racer.position.z - fz * 3.0,
          ),
          graceTimer: 0.55,
          life: 24,
        });
        break;
      }
      case 'lightning_bolt': {
        this.pendingEvents.push({
          type: 'banner',
          racerId: racer.id,
          text: `${racer.name.toUpperCase()} USED LIGHTNING!`,
        });
        for (const r of this.racers) {
          if (r.id === racer.id) continue;
          if (r.starTimer > 0 || r.bulletTimer > 0) continue;
          r.lightningSlowTimer = 4.0;
          this.handleAttackHit(racer.id, r, 0.9, 0xa855f7);
        }
        break;
      }
    }
  }

  private stepTick(dt: number): void {
    this.tickCount++;
    this.pendingEvents = [];

    for (let i = 0; i < this.itemBoxTimers.length; i++) {
      if (this.itemBoxTimers[i] > 0) {
        this.itemBoxTimers[i] = Math.max(0, this.itemBoxTimers[i] - dt);
      }
    }

    if (this.phase === 'countdown') {
      this.countdownTimer -= dt;
      const cInt = Math.max(0, Math.ceil(this.countdownTimer - 0.2));
      if (cInt !== this.lastCountdownInt) {
        this.lastCountdownInt = cInt;
        if (cInt >= 1 && cInt <= 3) {
          this.pendingEvents.push({ type: 'countdown', value: cInt });
        } else if (cInt === 0) {
          this.phase = 'playing';
          this.status = 'playing';
          this.pendingEvents.push({ type: 'go' });
          this.broadcast({ type: 'lobby_update', lobby: this.getLobbyState() });
        }
      }
      this.broadcastRaceState();
      return;
    }

    if (this.phase === 'playing') {
      this.raceTime += dt;
      const isBattle = this.raceConfig.mode === 'battle';
      if (isBattle) {
        this.battleTimeLeft = Math.max(0, this.battleTimeLeft - dt);
      }

      for (const r of this.racers) {
        this.updateRacer(r, dt);
      }
      this.handleCollisions();
      this.updateProjectiles(dt);
      this.computeRanks();

      if (isBattle) {
        if (this.battleTimeLeft <= 0) {
          this.finalizeRace();
        }
      } else {
        const connectedHumanIds = new Set(
          this.seats.filter((s) => s && s.connected).map((s) => s!.slotIndex),
        );
        const activeHumanIds = new Set(
          this.racers
            .filter((r) => connectedHumanIds.has(r.id) && !r.eliminated)
            .map((r) => r.id),
        );
        const anyHumanFinished = this.racers.some(
          (r) => activeHumanIds.has(r.id) && r.finished && !r.eliminated,
        );
        if (anyHumanFinished && this.firstHumanFinishAt === null) {
          this.firstHumanFinishAt = this.raceTime;
        }
        const allHumansDone =
          activeHumanIds.size > 0 &&
          this.racers.every((r) => !activeHumanIds.has(r.id) || r.finished || r.eliminated);
        const remainingAlive = this.racers.filter((r) => !r.eliminated).length;

        if (
          allHumansDone ||
          activeHumanIds.size === 0 ||
          (this.raceConfig.mode === 'knockout_tour' && remainingAlive <= 1) ||
          (this.firstHumanFinishAt !== null && this.raceTime - this.firstHumanFinishAt >= 10)
        ) {
          this.finalizeRace();
        }
      }
    }

    this.broadcastRaceState();
  }

  private finalizeRace(): void {
    const isBattle = this.raceConfig.mode === 'battle';
    const totalLaps = this.getEffectiveTotalLaps();
    if (!isBattle) {
      const finishedTimes = this.racers
        .filter((r) => r.finished && !r.eliminated)
        .map((r) => r.finishTime);
      const maxFinish = finishedTimes.length > 0 ? Math.max(...finishedTimes) : this.raceTime;

      for (const r of this.racers) {
        if (!r.finished && !r.eliminated) {
          const progressLeft = Math.max(0.02, totalLaps - r.unwrappedProgress);
          const estSec =
            (progressLeft * this.activeTrack.totalLength) / Math.max(35, r.speed || BASE_MAX_SPEED);
          r.finished = true;
          r.finishTime = maxFinish + estSec;
        }
      }
    } else {
      for (const r of this.racers) {
        r.finished = true;
        r.finishTime = this.raceTime;
      }
    }

    this.computeRanks();
    if (this.raceConfig.mode === 'grand_prix') {
      for (const r of this.racers) {
        const pts = GP_POINTS_TABLE[r.rank - 1] ?? 0;
        this.cupPoints[r.id] = (this.cupPoints[r.id] ?? 0) + pts;
      }
    } else if (this.raceConfig.mode === 'knockout_tour') {
      const cutoffRank = KNOCKOUT_STAGE_KEEP_COUNTS[this.knockoutStageIndex - 1] ?? 3;
      if (this.knockoutStageIndex < KNOCKOUT_STAGE_KEEP_COUNTS.length) {
        for (const r of this.racers) {
          if (!r.eliminated && r.rank > cutoffRank) {
            r.eliminated = true;
            this.knockoutEliminatedStage.set(r.id, this.knockoutStageIndex);
            this.pendingEvents.push({
              type: 'eliminated',
              racerId: r.id,
              x: r.position.x,
              y: r.position.y + 1.2,
              z: r.position.z,
              text: `${r.name.toUpperCase()} KNOCKED OUT!`,
            });
          }
        }
        this.computeRanks();
      }
    }

    this.phase = 'finished';
    this.status = 'finished';
    this.broadcastRaceState();
    this.stopLoop();
    this.broadcast({ type: 'lobby_update', lobby: this.getLobbyState() });
  }

  private updateRacer(racer: SimRacer, dt: number): void {
    const isBattle = this.raceConfig.mode === 'battle';
    const totalLaps = this.getEffectiveTotalLaps();
    const classMult = ENGINE_CLASS_MULT[this.raceConfig.engineClass] ?? 1.04;

    if (racer.nitroTimer > 0) racer.nitroTimer = Math.max(0, racer.nitroTimer - dt);
    if (racer.boostPadTimer > 0) racer.boostPadTimer = Math.max(0, racer.boostPadTimer - dt);
    if (racer.bulletTimer > 0) racer.bulletTimer = Math.max(0, racer.bulletTimer - dt);
    if (racer.lightningSlowTimer > 0) racer.lightningSlowTimer = Math.max(0, racer.lightningSlowTimer - dt);
    if (racer.starTimer > 0) racer.starTimer = Math.max(0, racer.starTimer - dt);
    if (racer.battleShieldTimer > 0) racer.battleShieldTimer = Math.max(0, racer.battleShieldTimer - dt);

    if (racer.eliminated) {
      racer.speed = THREE.MathUtils.damp(racer.speed, 0, 5, dt);
      return;
    }

    if (racer.stunTimer > 0) {
      racer.stunTimer = Math.max(0, racer.stunTimer - dt);
      racer.stunSpinAngle += dt * 15;
    } else {
      racer.stunSpinAngle = 0;
    }

    if (racer.rouletteTimer > 0) {
      const prevStep = Math.floor(racer.rouletteTimer * 12);
      racer.rouletteTimer = Math.max(0, racer.rouletteTimer - dt);
      const nextStep = Math.floor(racer.rouletteTimer * 12);
      if (nextStep !== prevStep) {
        const pool = isBattle ? BATTLE_ITEMS : ALL_ITEMS;
        racer.rouletteItem = pool[Math.floor(Math.random() * pool.length)];
        if (racer.isHuman) {
          this.pendingEvents.push({ type: 'item_roulette_tick', racerId: racer.id });
        }
      }
      if (racer.rouletteTimer === 0) {
        racer.heldItem = racer.pendingItem;
        racer.pendingItem = null;
        racer.rouletteItem = null;
        if (racer.isHuman && racer.heldItem) {
          this.pendingEvents.push({ type: 'item_acquire', racerId: racer.id, item: racer.heldItem });
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

    const seat = racer.isHuman ? this.seats[racer.id] : null;
    const isControlledHuman = Boolean(seat && seat.connected && !racer.finished);

    if (isBattle) {
      let throttle = 0;
      let steerInput = 0;
      let wantsDrift = false;

      if (racer.stunTimer > 0) {
        racer.speed = THREE.MathUtils.damp(racer.speed, 0, 3.5, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isControlledHuman && seat) {
        throttle = seat.input.up ? 1 : seat.input.down ? -0.6 : 0;
        steerInput = (seat.input.left ? 1 : 0) - (seat.input.right ? 1 : 0);
        wantsDrift = seat.input.drift;
        if (seat.input.useItemPressed) {
          seat.input.useItemPressed = false;
          if (racer.heldItem) {
            this.activateItem(racer);
          }
        }
      } else {
        racer.aiBattleTimer -= dt;
        if (racer.aiBattleTimer <= 0) {
          racer.aiBattleTimer = 1.6 + Math.random() * 2.0;
          const candidates = this.racers.filter((o) => o.id !== racer.id);
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          if (pick) racer.aiBattleTargetId = pick.id;
        }

        let aimX = 0;
        let aimZ = 0;
        if (!racer.heldItem) {
          let bestD2 = Infinity;
          for (let b = 0; b < BATTLE_ITEM_SPOTS.length; b++) {
            if (this.itemBoxTimers[b] > 0) continue;
            const sp = BATTLE_ITEM_SPOTS[b].position;
            const d2 = (sp.x - racer.position.x) ** 2 + (sp.z - racer.position.z) ** 2;
            if (d2 < bestD2) {
              bestD2 = d2;
              aimX = sp.x;
              aimZ = sp.z;
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

        if (!racer.isHuman && racer.heldItem) {
          racer.aiItemCooldown -= dt;
          if (racer.aiItemCooldown <= 0) {
            this.activateItem(racer);
            racer.aiItemCooldown = 1.8 + Math.random() * 2.4;
          }
        }
      }

      if (racer.stunTimer <= 0) {
        const carSpec = getCarSpec(racer.carId);
        const paceMult =
          racer.skill *
          classMult *
          (racer.isHuman ? carSpec.speedMult : 1 + (carSpec.speedMult - 1) * 0.35);

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
          const accel = baseAccel * ccAccelScale * (racer.isHuman ? carSpec.accelMult : 1);
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
            if (racer.isHuman) {
              this.pendingEvents.push({ type: 'drift_release', racerId: racer.id });
            }
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
          (racer.driftDir !== 0 ? 2.45 : 2.1) * ccSteerScale * (racer.isHuman ? carSpec.handlingMult : 1);
        const effectiveSteer =
          racer.driftDir !== 0
            ? racer.driftDir * 0.65 + steerInput * 0.65
            : steerInput;

        racer.heading += effectiveSteer * steerRate * speedFactor * turnDir * dt;
        racer.steerAngle = THREE.MathUtils.damp(racer.steerAngle, steerInput * 0.42, 12, dt);
      }

      const fwdX = Math.sin(racer.heading);
      const fwdZ = Math.cos(racer.heading);
      racer.position.x += fwdX * racer.speed * dt;
      racer.position.z += fwdZ * racer.speed * dt;

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
            if (racer.isHuman) {
              this.pendingEvents.push({ type: 'boost_pad', racerId: racer.id });
            }
          }
        }
      }

      if (this.raceConfig.itemFrequency !== 'none') {
        for (let bIdx = 0; bIdx < BATTLE_ITEM_SPOTS.length; bIdx++) {
          if (this.itemBoxTimers[bIdx] > 0) continue;
          const sp = BATTLE_ITEM_SPOTS[bIdx].position;
          if ((racer.position.x - sp.x) ** 2 + (racer.position.z - sp.z) ** 2 < 8.4) {
            this.itemBoxTimers[bIdx] = 3.2;
            this.pendingEvents.push({
              type: 'item_pickup',
              racerId: racer.id,
              x: sp.x,
              y: sp.y,
              z: sp.z,
            });
            if (!racer.heldItem && racer.rouletteTimer <= 0) {
              racer.pendingItem = this.pickItemForRank(racer.rank);
              racer.rouletteTimer = racer.isHuman ? 0.55 : 0.3;
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
      const isHumanInput = Boolean(isControlledHuman && seat);
      const isAiDriver = !isBullet && !isStunned && !isHumanInput;

      if (isBullet) {
        racer.speed = THREE.MathUtils.damp(racer.speed, BASE_MAX_SPEED * classMult * 1.85, 8, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isStunned) {
        racer.speed = THREE.MathUtils.damp(racer.speed, 0, 3.5, dt);
        racer.driftDir = 0;
        racer.driftCharge = 0;
      } else if (isHumanInput && seat) {
        throttle = seat.input.up ? 1 : seat.input.down ? -0.6 : 0;
        playerSteerInput = (seat.input.left ? 1 : 0) - (seat.input.right ? 1 : 0);
        wantsDrift = seat.input.drift;
        if (seat.input.useItemPressed) {
          seat.input.useItemPressed = false;
          if (racer.heldItem) {
            this.activateItem(racer);
          }
        }
      } else {
        racer.aiLaneTimer -= dt;
        if (racer.aiLaneTimer <= 0) {
          racer.aiLaneTimer = 1.4 + Math.random() * 2.2;
          racer.aiTargetLat = (Math.random() - 0.5) * (ROAD_HALF_WIDTH * 1.15);
        }
        throttle = 1;
        if (!racer.isHuman && racer.heldItem) {
          racer.aiItemCooldown -= dt;
          if (racer.aiItemCooldown <= 0) {
            this.activateItem(racer);
            racer.aiItemCooldown = 2.5 + Math.random() * 3.5;
          }
        }
      }

      const carSpec = getCarSpec(racer.carId);
      const ccSteerScale = racer.isHuman
        ? 1 + Math.min(3.5, Math.max(0, classMult - 1) * 0.32)
        : 1 + Math.max(0, classMult - 1) * 0.55;

      if (!isBullet && !isStunned) {
        const paceMult =
          racer.skill *
          classMult *
          (racer.isHuman ? carSpec.speedMult : 1 + (carSpec.speedMult - 1) * 0.35);

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
          const accel = baseAccel * ccAccelScale * (racer.isHuman ? carSpec.accelMult : 1);
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
            if (racer.isHuman) {
              this.pendingEvents.push({ type: 'drift_release', racerId: racer.id });
            }
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
          if (this.activeTrack.isStraight) {
            _v1.set(0, 0.2, racer.position.z + 18);
          } else {
            const lookAheadT = (racer.splineT + Math.min(0.05, 0.022 + Math.max(0, classMult - 1) * 0.002)) % 1;
            this.activeTrack.sampleAt(lookAheadT, _v1, _v2, _v3);
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
            if (this.activeTrack.isStraight) {
              _v1.set(-racer.aiTargetLat, 0.2, racer.position.z + 20);
            } else {
              const lookAheadT = (racer.splineT + Math.min(0.052, 0.026 + Math.max(0, classMult - 1) * 0.0025)) % 1;
              this.activeTrack.sampleAt(lookAheadT, _v1, _v2, _v3);
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
            (racer.driftDir !== 0 ? 2.45 : 2.1) * ccSteerScale * (racer.isHuman ? carSpec.handlingMult : 1);
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

        if (this.activeTrack.isStraight) {
          const halfLen = this.activeTrack.totalLength * 0.5;
          if (racer.position.z >= halfLen) racer.position.z -= this.activeTrack.totalLength;
          else if (racer.position.z < -halfLen) racer.position.z += this.activeTrack.totalLength;
        }

        const postClosest = this.activeTrack.closestPoint(racer.position.x, racer.position.z, racer.splineT);
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

        if (!racer.finished) {
          const nextLap = Math.min(totalLaps, Math.max(1, Math.floor(racer.maxProgress) + 1));
          if (nextLap > racer.lap) {
            racer.lap = nextLap;
            this.pendingEvents.push({ type: 'lap', racerId: racer.id, value: nextLap });
          }
          if (racer.maxProgress >= totalLaps) {
            racer.finished = true;
            racer.finishTime = this.raceTime;
            this.pendingEvents.push({ type: 'finish', racerId: racer.id });
          }
        }

        for (const pad of this.activeTrack.boostPads) {
          let dtPad = Math.abs(postClosest.t - pad.t);
          if (dtPad > 0.5) dtPad = 1 - dtPad;
          if (dtPad < pad.halfLengthT && Math.abs(postClosest.lateral - pad.lateral) < pad.halfWidth) {
            if (racer.boostPadTimer < 0.85) {
              racer.boostPadTimer = 1.1;
              if (racer.isHuman) {
                this.pendingEvents.push({ type: 'boost_pad', racerId: racer.id });
              }
            }
          }
        }

        if (this.raceConfig.itemFrequency !== 'none') {
          for (let bIdx = 0; bIdx < this.activeTrack.itemBoxSpecs.length; bIdx++) {
            if (this.itemBoxTimers[bIdx] > 0) continue;
            const spec = this.activeTrack.itemBoxSpecs[bIdx];
            if (racer.position.distanceToSquared(spec.position) < 7.8) {
              this.itemBoxTimers[bIdx] = this.raceConfig.itemFrequency === 'frantic' ? 2.6 : 4.2;
              this.pendingEvents.push({
                type: 'item_pickup',
                racerId: racer.id,
                x: spec.position.x,
                y: spec.position.y,
                z: spec.position.z,
              });
              if (!racer.heldItem && racer.rouletteTimer <= 0) {
                racer.pendingItem = this.pickItemForRank(racer.rank);
                racer.rouletteTimer = racer.isHuman ? 0.65 : 0.35;
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
  }

  private handleCollisions(): void {
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
            this.handleAttackHit(a.id, b, 1.6, 0xfacc15);
            this.pendingEvents.push({
              type: 'banner',
              racerId: a.id,
              text: `${a.name.toUpperCase()} KNOCKED DOWN ${b.name.toUpperCase()}!`,
            });
          } else if (bCanKnock && !aCanKnock && a.stunTimer <= 0.1) {
            this.handleAttackHit(b.id, a, 1.6, 0xfacc15);
            this.pendingEvents.push({
              type: 'banner',
              racerId: b.id,
              text: `${b.name.toUpperCase()} KNOCKED DOWN ${a.name.toUpperCase()}!`,
            });
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
        currentFirst && currentFirst.id !== shell.ownerId
          ? currentFirst
          : this.racers[shell.targetId];
      if (target) {
        shell.targetId = target.id;
      }

      if (shell.phase === 'chase') {
        const stepT = (148 * dt) / this.activeTrack.totalLength;
        shell.splineT = (shell.splineT + stepT) % 1;
        this.activeTrack.sampleAt(shell.splineT, _v1, _v2, _v3);
        const targetClosest = this.activeTrack.closestPoint(target.position.x, target.position.z, target.splineT);
        shell.lateral = THREE.MathUtils.damp(shell.lateral, targetClosest.lateral, 5, dt);
        shell.position.copy(_v1).addScaledVector(_v3, shell.lateral);
        shell.position.y += 1.05;

        if (shell.position.distanceTo(target.position) < 6.8 || shell.life <= 0.6) {
          shell.phase = 'hover';
          shell.hoverTimer = 0.55;
        }
      } else {
        shell.hoverTimer -= dt;
        shell.position.set(target.position.x, target.position.y + 3.4, target.position.z);
        if (shell.hoverTimer <= 0) {
          for (const r of this.racers) {
            if (!r.eliminated && r.position.distanceTo(target.position) < 6.2) {
              this.handleAttackHit(shell.ownerId, r, 1.85, 0x3b82f6);
            }
          }
          this.pendingEvents.push({
            type: 'spiny_explode',
            racerId: shell.ownerId,
            targetId: target.id,
            x: target.position.x,
            y: target.position.y,
            z: target.position.z,
            text: `1ST PLACE ${target.name.toUpperCase()} STRUCK!`,
          });
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
          }
        }
      } else {
        if (this.activeTrack.isStraight) {
          const halfLen = this.activeTrack.totalLength * 0.5;
          if (gs.position.z >= halfLen) gs.position.z -= this.activeTrack.totalLength;
          else if (gs.position.z < -halfLen) gs.position.z += this.activeTrack.totalLength;
        }
        const closest = this.activeTrack.closestPoint(gs.position.x, gs.position.z, gs.splineT);
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
        }
      }

      let hit = false;
      for (const r of this.racers) {
        if (r.eliminated) continue;
        if (r.id === gs.ownerId && gs.life > 7.5) continue;
        if (gs.position.distanceToSquared(r.position) < 11.5) {
          this.handleAttackHit(gs.ownerId, r, 1.45, 0x22c55e);
          hit = true;
          break;
        }
      }

      if (hit || gs.bouncesLeft < 0 || gs.life <= 0) {
        this.greenShells.splice(i, 1);
      }
    }

    // 5. Banana Peels
    for (let i = this.bananaHazards.length - 1; i >= 0; i--) {
      const bh = this.bananaHazards[i];
      bh.life -= dt;
      if (bh.graceTimer > 0) bh.graceTimer = Math.max(0, bh.graceTimer - dt);

      let tripped = false;
      for (const r of this.racers) {
        if (r.eliminated) continue;
        if (r.id === bh.ownerId && bh.graceTimer > 0) continue;
        if (bh.position.distanceToSquared(r.position) < 7.8) {
          if (r.starTimer <= 0 && r.bulletTimer <= 0) {
            this.handleAttackHit(bh.ownerId, r, 1.25, 0xfacc15);
          }
          tripped = true;
          break;
        }
      }

      if (tripped || bh.life <= 0) {
        this.bananaHazards.splice(i, 1);
      }
    }
  }

  private computeRanks(): void {
    if (this.raceConfig.mode === 'battle') {
      const sorted = [...this.racers].sort((a, b) => {
        if (b.battleScore !== a.battleScore) return b.battleScore - a.battleScore;
        if (b.balloons !== a.balloons) return b.balloons - a.balloons;
        return a.id - b.id;
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
          (this.knockoutEliminatedStage.get(b.id) ?? 0) -
          (this.knockoutEliminatedStage.get(a.id) ?? 0);
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

  private broadcastRaceState(): void {
    const isBattle = this.raceConfig.mode === 'battle';
    const racers: ServerRacerState[] = this.racers.map((r) => ({
      id: r.id,
      x: Number(r.position.x.toFixed(2)),
      y: Number(r.position.y.toFixed(2)),
      z: Number(r.position.z.toFixed(2)),
      heading: Number(r.heading.toFixed(3)),
      speed: Number(r.speed.toFixed(2)),
      steerAngle: Number(r.steerAngle.toFixed(2)),
      jumpY: Number(r.jumpY.toFixed(2)),
      stunSpinAngle: Number(r.stunSpinAngle.toFixed(2)),
      lap: r.lap,
      rank: r.rank,
      finished: r.finished,
      finishTime: Number(r.finishTime.toFixed(2)),
      heldItem: r.heldItem,
      rouletteItem: r.rouletteTimer > 0 ? r.rouletteItem : null,
      nitroTimer: Number(r.nitroTimer.toFixed(2)),
      starTimer: Number(r.starTimer.toFixed(2)),
      bulletTimer: Number(r.bulletTimer.toFixed(2)),
      lightningSlowTimer: Number(r.lightningSlowTimer.toFixed(2)),
      boostPadTimer: Number(r.boostPadTimer.toFixed(2)),
      stunTimer: Number(r.stunTimer.toFixed(2)),
      driftLevel: r.driftDir === 0 ? 0 : r.driftCharge >= 1.5 ? 2 : 1,
      eliminated: r.eliminated,
      balloons: isBattle ? r.balloons : undefined,
      battleScore: isBattle ? r.battleScore : undefined,
    }));

    const projectiles: ServerProjectileState = {
      spinyShells: this.spinyShells.map((s) => ({
        id: s.id,
        x: Number(s.position.x.toFixed(2)),
        y: Number(s.position.y.toFixed(2)),
        z: Number(s.position.z.toFixed(2)),
        targetId: s.targetId,
      })),
      greenShells: this.greenShells.map((g) => ({
        id: g.id,
        x: Number(g.position.x.toFixed(2)),
        y: Number(g.position.y.toFixed(2)),
        z: Number(g.position.z.toFixed(2)),
      })),
      bananaHazards: this.bananaHazards.map((b) => ({
        id: b.id,
        x: Number(b.position.x.toFixed(2)),
        y: Number(b.position.y.toFixed(2)),
        z: Number(b.position.z.toFixed(2)),
      })),
      itemBoxActive: this.itemBoxTimers.map((t) =>
        this.raceConfig.itemFrequency === 'none' ? false : t <= 0,
      ),
    };

    this.broadcast({
      type: 'race_state',
      tick: this.tickCount,
      phase: this.phase,
      mode: this.raceConfig.mode,
      courseId: this.getEffectiveCourseId(),
      engineClass: this.raceConfig.engineClass,
      totalLaps: this.getEffectiveTotalLaps(),
      gpRaceIndex: this.gpRaceIndex,
      cupStandings: this.buildCupStandings(),
      knockout: this.getKnockoutState(),
      battleTimeLeft: Number(this.battleTimeLeft.toFixed(1)),
      countdown: Math.max(0, Math.ceil(this.countdownTimer - 0.2)),
      raceTime: Number(this.raceTime.toFixed(2)),
      racers,
      projectiles,
      events: this.pendingEvents,
    });
  }
}
