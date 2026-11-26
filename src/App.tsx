/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CarShopModal } from './components/CarShopModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GameHUD } from './components/GameHUD';
import { MultiplayerModal } from './components/MultiplayerModal';
import { RaceEngine } from './game/engine';
import { MpConnectionStatus, MultiplayerClient } from './game/multiplayerClient';
import type { LobbyState, RoomSummary } from './game/multiplayerTypes';
import {
  CAR_CATALOG,
  CarId,
  CHARACTER_CATALOG,
  CharacterId,
  DEFAULT_RACE_CONFIG,
  getCarSpec,
  getCharacterSpec,
  getCourseDefaultLaps,
  getCupSpec,
  getKnockoutCupSpec,
  HudSnapshot,
  RaceConfig,
  ReplayCameraAngle,
  ReplaySpeed,
} from './game/types';

const STORAGE_KEY = 'dino_turbo_gp_garage_v1';

interface GarageSave {
  equippedCar: CarId;
  equippedCharacter: CharacterId;
  playerName?: string;
}

const VALID_CHAR_IDS = new Set<CharacterId>(CHARACTER_CATALOG.map((c) => c.id));
const VALID_CAR_IDS = new Set<CarId>(CAR_CATALOG.map((c) => c.id));

function loadGarage(): GarageSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GarageSave>;
      const equipped: CarId =
        parsed.equippedCar && VALID_CAR_IDS.has(parsed.equippedCar)
          ? parsed.equippedCar
          : 'standard_kart';
      const hasValidSavedChar = Boolean(
        parsed.equippedCharacter && VALID_CHAR_IDS.has(parsed.equippedCharacter),
      );
      const equippedCharacter = hasValidSavedChar
        ? (parsed.equippedCharacter as CharacterId)
        : 'bingbong';
      return {
        equippedCar: equipped,
        equippedCharacter,
        playerName:
          hasValidSavedChar && typeof parsed.playerName === 'string' && parsed.playerName.trim()
            ? parsed.playerName.trim().slice(0, 16)
            : getCharacterSpec(equippedCharacter).name,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    equippedCar: 'standard_kart',
    equippedCharacter: 'bingbong',
    playerName: 'BingBong',
  };
}

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  mode: DEFAULT_RACE_CONFIG.mode,
  courseId: DEFAULT_RACE_CONFIG.courseId,
  engineClass: DEFAULT_RACE_CONFIG.engineClass,
  countdown: 3,
  rank: 11,
  totalRacers: 14,
  lap: 1,
  totalLaps: 50,
  speedKmh: 0,
  heldItem: null,
  rouletteItem: null,
  activeEffect: null,
  spinyIncoming: false,
  driftLevel: 0,
  eventBanner: null,
  raceTime: 0,
  minimapDots: [],
  minimapPath: [],
  standings: [],
  gpRaceIndex: 1,
  gpTotalRaces: 4,
  cupStandings: [],
  knockout: null,
  mushroomsLeft: 3,
  lapSplits: [],
  personalBest: null,
  newRecord: false,
  ghostActive: false,
  ghostEnabled: true,
  ghostDeltaSec: null,
  battleBalloons: 3,
  battleScore: 0,
  battleTimeLeft: 90,
  hasReplay: false,
  replay: null,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const mpClientRef = useRef<MultiplayerClient | null>(null);
  const mySlotRef = useRef<number>(0);
  const mpRaceActiveRef = useRef<boolean>(false);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [raceConfig, setRaceConfig] = useState<RaceConfig>({ ...DEFAULT_RACE_CONFIG });
  const [muted, setMuted] = useState(false);
  const [garage, setGarage] = useState<GarageSave>(() => loadGarage());
  const [shopOpen, setShopOpen] = useState(false);
  const [driversOpen, setDriversOpen] = useState(false);
  const [mpOpen, setMpOpen] = useState(false);

  const [mpStatus, setMpStatus] = useState<MpConnectionStatus>('disconnected');
  const [mpClientId, setMpClientId] = useState<string | null>(null);
  const [mpRtt, setMpRtt] = useState<number | null>(null);
  const [mpLobby, setMpLobby] = useState<LobbyState | null>(null);
  const [mpOpenRooms, setMpOpenRooms] = useState<RoomSummary[]>([]);
  const [mpError, setMpError] = useState<string | null>(null);

  const effectiveName = garage.playerName?.trim() || getCharacterSpec(garage.equippedCharacter).name;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(garage));
    } catch {
      // ignore storage errors
    }
  }, [garage]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new RaceEngine(container, (snapshot) => {
      setHud(snapshot);
    });
    engine.setPlayerCar(garage.equippedCar);
    engine.setPlayerCharacter(garage.equippedCharacter);
    engineRef.current = engine;

    const mpClient = new MultiplayerClient({
      onStatusChange: (status, rtt) => {
        setMpStatus(status);
        setMpRtt(rtt);
      },
      onWelcome: (clientId) => {
        setMpClientId(clientId);
      },
      onRoomJoined: (_roomCode, mySlot, lobby) => {
        mySlotRef.current = mySlot;
        setMpError(null);
        setMpLobby(lobby);
      },
      onLobbyUpdate: (lobby) => {
        setMpLobby(lobby);
        if (lobby.status === 'countdown') {
          mpRaceActiveRef.current = true;
          setMpOpen(false);
          setShopOpen(false);
          setDriversOpen(false);
          engineRef.current?.configureMultiplayerRoster(
            mySlotRef.current,
            lobby.players,
            lobby.raceConfig,
            lobby.gpRaceIndex,
            lobby.cupStandings,
            lobby.knockoutStageIndex,
            lobby.knockoutEliminatedIds,
          );
        } else if (lobby.status === 'lobby' && mpRaceActiveRef.current) {
          mpRaceActiveRef.current = false;
          engineRef.current?.exitMultiplayerMode();
          setMpOpen(true);
        }
      },
      onRoomList: (rooms) => {
        setMpOpenRooms(rooms);
      },
      onRaceState: (msg) => {
        engineRef.current?.applyMultiplayerState(msg);
      },
      onError: (message) => {
        setMpError(message);
      },
    });
    mpClientRef.current = mpClient;

    engine.setMultiplayerInputCallback((input) => {
      mpClient.sendInput(input);
    });

    const inviteRoom = new URLSearchParams(window.location.search).get('room');
    if (inviteRoom && /^[A-Z0-9]{4,8}$/i.test(inviteRoom.trim())) {
      setMpOpen(true);
      mpClient.connect();
      mpClient.joinRoom(
        inviteRoom.trim().toUpperCase(),
        effectiveName,
        garage.equippedCharacter,
        garage.equippedCar,
      );
    }

    return () => {
      mpClient.dispose();
      mpClientRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPlayerCar(garage.equippedCar);
  }, [garage.equippedCar]);

  useEffect(() => {
    engineRef.current?.setPlayerCharacter(garage.equippedCharacter);
  }, [garage.equippedCharacter]);

  useEffect(() => {
    mpClientRef.current?.updateProfile(effectiveName, garage.equippedCharacter, garage.equippedCar);
  }, [effectiveName, garage.equippedCharacter, garage.equippedCar]);

  useEffect(() => {
    engineRef.current?.setUiModalOpen(shopOpen || driversOpen || mpOpen);
  }, [shopOpen, driversOpen, mpOpen]);

  const handleChangeRaceConfig = useCallback((patch: Partial<RaceConfig>) => {
    setRaceConfig((prev) => {
      const next = { ...prev, ...patch };
      if (next.mode === 'grand_prix' && (prev.mode !== 'grand_prix' || patch.cupId)) {
        next.courseId = getCupSpec(next.cupId).courses[0];
        next.laps = getCourseDefaultLaps(next.courseId);
      } else if (
        next.mode === 'knockout_tour' &&
        (prev.mode !== 'knockout_tour' || patch.knockoutCupId)
      ) {
        next.courseId = getKnockoutCupSpec(next.knockoutCupId).courses[0];
        next.laps = getCourseDefaultLaps(next.courseId);
      } else if (patch.courseId && patch.courseId !== prev.courseId && patch.laps === undefined) {
        next.laps = getCourseDefaultLaps(next.courseId);
      } else if (next.mode === 'time_trial' && prev.mode !== 'time_trial' && patch.laps === undefined) {
        next.laps = getCourseDefaultLaps(next.courseId);
      } else if (next.courseId !== 'bung_stadium' && next.laps > 1000) {
        next.laps = getCourseDefaultLaps(next.courseId);
      }
      engineRef.current?.setRaceConfig(next);
      return next;
    });
  }, []);

  const handleStartRace = useCallback(() => {
    setShopOpen(false);
    setDriversOpen(false);
    setMpOpen(false);
    engineRef.current?.startRace();
  }, []);

  const handleNextGpRace = useCallback(() => {
    engineRef.current?.startNextGpRace();
  }, []);

  const handleOpenShop = useCallback(() => {
    setDriversOpen(false);
    setShopOpen(true);
  }, []);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
  }, []);

  const handleOpenDrivers = useCallback(() => {
    setShopOpen(false);
    setDriversOpen(true);
  }, []);

  const handleCloseDrivers = useCallback(() => {
    setDriversOpen(false);
  }, []);

  const handleOpenMultiplayer = useCallback(() => {
    setShopOpen(false);
    setDriversOpen(false);
    setMpError(null);
    setMpOpen(true);
    mpClientRef.current?.connect();
    mpClientRef.current?.listRooms();
  }, []);

  const handleCloseMultiplayer = useCallback(() => {
    setMpOpen(false);
  }, []);

  const handleEquipCar = useCallback((carId: CarId) => {
    setGarage((prev) => {
      if (!VALID_CAR_IDS.has(carId)) return prev;
      return { ...prev, equippedCar: carId };
    });
    engineRef.current?.playPurchaseSound();
  }, []);

  const handleSelectCharacter = useCallback((charId: CharacterId) => {
    setGarage((prev) => {
      const prevDefault = getCharacterSpec(prev.equippedCharacter).name;
      const nextDefault = getCharacterSpec(charId).name;
      const shouldUpdateName = !prev.playerName || prev.playerName === prevDefault;
      return {
        ...prev,
        equippedCharacter: charId,
        playerName: shouldUpdateName ? nextDefault : prev.playerName,
      };
    });
    engineRef.current?.playPurchaseSound();
  }, []);

  const handleChangePlayerName = useCallback((name: string) => {
    setGarage((prev) => ({ ...prev, playerName: name.slice(0, 16) }));
  }, []);

  const handleCreateRoom = useCallback(() => {
    setMpError(null);
    mpClientRef.current?.createRoom(effectiveName, garage.equippedCharacter, garage.equippedCar);
  }, [effectiveName, garage.equippedCharacter, garage.equippedCar]);

  const handleJoinRoom = useCallback(
    (code: string) => {
      setMpError(null);
      mpClientRef.current?.joinRoom(code, effectiveName, garage.equippedCharacter, garage.equippedCar);
    },
    [effectiveName, garage.equippedCharacter, garage.equippedCar],
  );

  const handleQuickJoin = useCallback(() => {
    setMpError(null);
    mpClientRef.current?.quickJoin(effectiveName, garage.equippedCharacter, garage.equippedCar);
  }, [effectiveName, garage.equippedCharacter, garage.equippedCar]);

  const handleRefreshRooms = useCallback(() => {
    mpClientRef.current?.listRooms();
  }, []);

  const handleChangeMpRaceConfig = useCallback((patch: Partial<RaceConfig>) => {
    mpClientRef.current?.setRaceConfig(patch);
  }, []);

  const handleStartMpRace = useCallback(() => {
    mpClientRef.current?.startRace();
  }, []);

  const handleMultiplayerPlayAgain = useCallback(() => {
    mpClientRef.current?.returnToLobby();
  }, []);

  const handleLeaveMultiplayer = useCallback(() => {
    mpRaceActiveRef.current = false;
    mpClientRef.current?.leaveRoom();
    setMpLobby(null);
    setMpOpen(false);
    engineRef.current?.exitMultiplayerMode();
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!engineRef.current) return;
    const nextMuted = engineRef.current.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleUseItem = useCallback(() => {
    engineRef.current?.triggerUseItem();
  }, []);

  const handleToggleGhost = useCallback(() => {
    engineRef.current?.toggleGhost();
  }, []);

  const handleStartReplay = useCallback(() => {
    setShopOpen(false);
    setDriversOpen(false);
    setMpOpen(false);
    engineRef.current?.startReplay();
  }, []);

  const handleStopReplay = useCallback(() => {
    engineRef.current?.stopReplay();
  }, []);

  const handleToggleReplayPause = useCallback(() => {
    engineRef.current?.toggleReplayPaused();
  }, []);

  const handleSeekReplay = useCallback((timeSec: number) => {
    engineRef.current?.seekReplay(timeSec);
  }, []);

  const handleRewindReplay = useCallback(() => {
    engineRef.current?.rewindReplay(5);
  }, []);

  const handleSetReplaySpeed = useCallback((speed: ReplaySpeed) => {
    engineRef.current?.setReplaySpeed(speed);
  }, []);

  const handleSetReplayCameraAngle = useCallback((angle: ReplayCameraAngle) => {
    engineRef.current?.setReplayCameraAngle(angle);
  }, []);

  const handleSetReplayTargetRacer = useCallback((racerId: number) => {
    engineRef.current?.setReplayTargetRacer(racerId);
  }, []);

  const equippedCarSpec = getCarSpec(garage.equippedCar);
  const isMultiplayerHost = Boolean(mpLobby && mpClientId && mpLobby.hostId === mpClientId);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={mountRef} className="h-full w-full" />
      <GameHUD
        hud={hud}
        raceConfig={raceConfig}
        muted={muted}
        equippedCarName={equippedCarSpec.name}
        equippedCharacterId={garage.equippedCharacter}
        mpRoomCode={mpLobby?.roomCode ?? null}
        isMultiplayerHost={isMultiplayerHost}
        onChangeRaceConfig={handleChangeRaceConfig}
        onStartRace={handleStartRace}
        onNextGpRace={handleNextGpRace}
        onOpenShop={handleOpenShop}
        onOpenDrivers={handleOpenDrivers}
        onOpenMultiplayer={handleOpenMultiplayer}
        onMultiplayerPlayAgain={handleMultiplayerPlayAgain}
        onLeaveMultiplayer={handleLeaveMultiplayer}
        onTogglePause={handleTogglePause}
        onReturnToTitle={handleReturnToTitle}
        onToggleMute={handleToggleMute}
        onUseItem={handleUseItem}
        onToggleGhost={handleToggleGhost}
        onStartReplay={handleStartReplay}
        onStopReplay={handleStopReplay}
        onToggleReplayPause={handleToggleReplayPause}
        onSeekReplay={handleSeekReplay}
        onRewindReplay={handleRewindReplay}
        onSetReplaySpeed={handleSetReplaySpeed}
        onSetReplayCameraAngle={handleSetReplayCameraAngle}
        onSetReplayTargetRacer={handleSetReplayTargetRacer}
      />
      {mpOpen && (
        <MultiplayerModal
          status={mpStatus}
          rttMs={mpRtt}
          playerName={garage.playerName ?? effectiveName}
          equippedCharacter={garage.equippedCharacter}
          equippedCar={garage.equippedCar}
          myClientId={mpClientId}
          lobby={mpLobby}
          openRooms={mpOpenRooms}
          errorMsg={mpError}
          onChangePlayerName={handleChangePlayerName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onQuickJoin={handleQuickJoin}
          onRefreshRooms={handleRefreshRooms}
          onChangeMpRaceConfig={handleChangeMpRaceConfig}
          onStartMpRace={handleStartMpRace}
          onLeaveRoom={handleLeaveMultiplayer}
          onOpenDrivers={handleOpenDrivers}
          onOpenShop={handleOpenShop}
          onClose={handleCloseMultiplayer}
        />
      )}
      {shopOpen && (
        <CarShopModal
          equippedCar={garage.equippedCar}
          onEquipCar={handleEquipCar}
          onClose={handleCloseShop}
        />
      )}
      {driversOpen && (
        <CharacterSelectModal
          equippedCharacter={garage.equippedCharacter}
          onSelectCharacter={handleSelectCharacter}
          onClose={handleCloseDrivers}
        />
      )}
    </main>
  );
}
