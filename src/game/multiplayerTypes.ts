import type {
  CarId,
  CharacterId,
  CourseId,
  CupStandingEntry,
  EngineClass,
  GameMode,
  GamePhase,
  ItemType,
  KnockoutHudState,
  RaceConfig,
} from './types.ts';

export interface RoomPlayerInfo {
  slotIndex: number;
  clientId: string;
  name: string;
  characterId: CharacterId;
  carId: CarId;
  hexColor: string;
  isHost: boolean;
  isCpu: boolean;
  connected: boolean;
}

export interface LobbyState {
  roomCode: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  hostId: string;
  players: RoomPlayerInfo[];
  humanCount: number;
  maxPlayers: number;
  raceConfig: RaceConfig;
  gpRaceIndex: number;
  knockoutStageIndex: number;
  knockoutEliminatedIds: number[];
  cupStandings: CupStandingEntry[];
}

export interface RoomSummary {
  roomCode: string;
  hostName: string;
  humanCount: number;
  maxPlayers: number;
  status: LobbyState['status'];
  raceConfig: RaceConfig;
}

export interface ServerRacerState {
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
  finished: boolean;
  finishTime: number;
  heldItem: ItemType | null;
  rouletteItem: ItemType | null;
  nitroTimer: number;
  starTimer: number;
  bulletTimer: number;
  lightningSlowTimer: number;
  boostPadTimer: number;
  stunTimer: number;
  driftLevel: 0 | 1 | 2;
  eliminated?: boolean;
  balloons?: number;
  battleScore?: number;
}

export interface ServerProjectilePos {
  id: number;
  x: number;
  y: number;
  z: number;
  targetId?: number;
}

export interface ServerProjectileState {
  spinyShells: ServerProjectilePos[];
  greenShells: ServerProjectilePos[];
  bananaHazards: ServerProjectilePos[];
  itemBoxActive: boolean[];
}

export interface ServerRaceEvent {
  type:
    | 'countdown'
    | 'go'
    | 'item_pickup'
    | 'item_roulette_tick'
    | 'item_acquire'
    | 'item_use'
    | 'knockdown'
    | 'spiny_explode'
    | 'boost_pad'
    | 'drift_release'
    | 'lap'
    | 'finish'
    | 'banner'
    | 'balloon_pop'
    | 'eliminated';
  racerId?: number;
  targetId?: number;
  item?: ItemType;
  x?: number;
  y?: number;
  z?: number;
  text?: string;
  value?: number;
  colorHex?: number;
}

export type ClientMessage =
  | {
      type: 'create_room';
      name: string;
      characterId: CharacterId;
      carId: CarId;
      clientId?: string;
    }
  | {
      type: 'join_room';
      roomCode: string;
      name: string;
      characterId: CharacterId;
      carId: CarId;
      clientId?: string;
    }
  | {
      type: 'quick_join';
      name: string;
      characterId: CharacterId;
      carId: CarId;
      clientId?: string;
    }
  | {
      type: 'list_rooms';
    }
  | {
      type: 'update_profile';
      name: string;
      characterId: CharacterId;
      carId: CarId;
    }
  | {
      type: 'set_race_config';
      config: Partial<RaceConfig>;
    }
  | {
      type: 'start_race';
    }
  | {
      type: 'return_lobby';
    }
  | {
      type: 'leave_room';
    }
  | {
      type: 'input';
      seq: number;
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      drift: boolean;
      useItem: boolean;
    }
  | {
      type: 'ping';
      t: number;
    };

export type ServerMessage =
  | {
      type: 'welcome';
      clientId: string;
    }
  | {
      type: 'room_joined';
      roomCode: string;
      mySlot: number;
      lobby: LobbyState;
    }
  | {
      type: 'lobby_update';
      lobby: LobbyState;
    }
  | {
      type: 'room_list';
      rooms: RoomSummary[];
    }
  | {
      type: 'race_state';
      tick: number;
      phase: GamePhase;
      mode: GameMode;
      courseId: CourseId;
      engineClass: EngineClass;
      totalLaps: number;
      gpRaceIndex: number;
      cupStandings: CupStandingEntry[];
      knockout: KnockoutHudState | null;
      battleTimeLeft: number;
      countdown: number;
      raceTime: number;
      racers: ServerRacerState[];
      projectiles: ServerProjectileState;
      events: ServerRaceEvent[];
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'pong';
      t: number;
    };
