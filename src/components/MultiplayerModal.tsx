import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  Globe,
  LogOut,
  Play,
  RefreshCw,
  ShoppingBag,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { MpConnectionStatus } from '../game/multiplayerClient';
import type { LobbyState, RoomSummary } from '../game/multiplayerTypes';
import {
  BUNG_STADIUM_MAX_MILES,
  BUNG_STADIUM_MAX_MILES_LABEL,
  CarId,
  CharacterId,
  COURSE_CATALOG,
  CourseId,
  CUP_CATALOG,
  CupId,
  ENGINE_CLASS_CATALOG,
  EngineClass,
  GAME_MODE_CATALOG,
  GameMode,
  getCarSpec,
  getCharacterSpec,
  getCourseSpec,
  getCupSpec,
  getGameModeSpec,
  getKnockoutCupSpec,
  ItemFrequency,
  KNOCKOUT_CUP_CATALOG,
  KnockoutCupId,
  RaceConfig,
  VS_LAP_OPTIONS,
} from '../game/types';
import { CharacterAvatar } from './CharacterAvatar';

interface MultiplayerModalProps {
  status: MpConnectionStatus;
  rttMs: number | null;
  playerName: string;
  equippedCharacter: CharacterId;
  equippedCar: CarId;
  myClientId: string | null;
  lobby: LobbyState | null;
  openRooms: RoomSummary[];
  errorMsg: string | null;
  onChangePlayerName: (name: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onQuickJoin: () => void;
  onRefreshRooms: () => void;
  onChangeMpRaceConfig: (patch: Partial<RaceConfig>) => void;
  onStartMpRace: () => void;
  onLeaveRoom: () => void;
  onOpenDrivers: () => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  status,
  rttMs,
  playerName,
  equippedCharacter,
  equippedCar,
  myClientId,
  lobby,
  openRooms,
  errorMsg,
  onChangePlayerName,
  onCreateRoom,
  onJoinRoom,
  onQuickJoin,
  onRefreshRooms,
  onChangeMpRaceConfig,
  onStartMpRace,
  onLeaveRoom,
  onOpenDrivers,
  onOpenShop,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const charSpec = getCharacterSpec(equippedCharacter);
  const carSpec = getCarSpec(equippedCar);
  const isHost = Boolean(lobby && myClientId && lobby.hostId === myClientId);
  const humanPlayers = lobby ? lobby.players.filter((p) => !p.isCpu) : [];
  const cpuCount = lobby ? 14 - humanPlayers.length : 13;
  const mpModes = GAME_MODE_CATALOG.filter((m) => m.supportsMultiplayer);

  const lobbyMode = lobby ? getGameModeSpec(lobby.raceConfig.mode) : null;
  const lobbyCup = lobby ? getCupSpec(lobby.raceConfig.cupId) : null;
  const lobbyKnockoutCup = lobby ? getKnockoutCupSpec(lobby.raceConfig.knockoutCupId) : null;
  const lobbyCourse = lobby ? getCourseSpec(lobby.raceConfig.courseId) : null;
  const lobbyCourseSummary = lobby
    ? lobby.raceConfig.mode === 'battle'
      ? 'Dino Battle Stadium · 90s'
      : lobby.raceConfig.mode === 'grand_prix'
        ? `${lobbyCup?.name} (${lobby.gpRaceIndex}/4) · ${lobbyCourse?.name}`
        : lobby.raceConfig.mode === 'knockout_tour'
          ? `${lobbyKnockoutCup?.name} (Stage ${lobby.knockoutStageIndex}/6) · ${lobbyCourse?.name}`
          : lobbyCourse?.name ?? 'Mario Bros. Circuit'
    : '';

  const startBtnLabel =
    lobby?.raceConfig.mode === 'grand_prix' && lobby.gpRaceIndex > 1
      ? `Start GP Race ${lobby.gpRaceIndex}/4`
      : lobby?.raceConfig.mode === 'knockout_tour'
        ? `Start Knockout Stage ${lobby.knockoutStageIndex}/6`
        : lobby?.raceConfig.mode === 'battle'
          ? 'Start Battle Arena'
          : 'Start Multiplayer Race';

  const handleCopyInvite = () => {
    if (!lobby) return;
    const url = `${window.location.origin}/?room=${lobby.roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      // ignore clipboard errors
    });
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white uppercase sm:text-2xl">
                Online Multiplayer GP
              </h2>
              <p className="text-xs text-slate-400">
                Race up to 14 human players live — empty grid slots are filled by CPUs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase whitespace-nowrap shrink-0 tabular-nums ${
                status === 'connected'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                  : status === 'connecting'
                    ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                    : 'border-rose-400/40 bg-rose-500/15 text-rose-300'
              }`}
            >
              {status === 'connected'
                ? `Online${rttMs !== null ? ` · ${rttMs}ms` : ''}`
                : status === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-800 text-slate-200 transition hover:bg-slate-700"
              aria-label="Close Multiplayer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-rose-400/50 bg-rose-950/60 px-4 py-2.5 text-xs font-bold text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Driver & Car Loadout Strip */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/75 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 bg-white"
              style={{ borderColor: charSpec.hexPrimary }}
            >
              <CharacterAvatar characterId={equippedCharacter} className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Your Loadout · {charSpec.name} · {carSpec.name}
              </div>
              <input
                type="text"
                value={playerName}
                maxLength={16}
                onChange={(e) => onChangePlayerName(e.target.value)}
                placeholder="Enter Racer Name"
                className="mt-1 w-48 rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1 text-sm font-bold text-white outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenDrivers}
              className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/15 px-3.5 py-2 text-xs font-black text-sky-300 uppercase whitespace-nowrap shrink-0 transition hover:bg-sky-400/25"
            >
              <Users className="h-3.5 w-3.5" />
              Driver
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3.5 py-2 text-xs font-black text-amber-300 uppercase whitespace-nowrap shrink-0 transition hover:bg-amber-400/25"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Car
            </button>
          </div>
        </div>

        {/* LOBBY VIEW VS BROWSER VIEW */}
        {!lobby ? (
          <div className="mt-4 grid flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2">
            {/* Create / Join Controls */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onQuickJoin}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-black tracking-wide text-slate-950 uppercase shadow-lg transition hover:bg-emerald-400"
              >
                <Zap className="h-4 w-4 fill-current" />
                Quick Join Open Race
              </button>

              <button
                type="button"
                onClick={onCreateRoom}
                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-400/50 bg-indigo-500/20 py-3 text-sm font-black tracking-wide text-indigo-200 uppercase transition hover:bg-indigo-500/30"
              >
                <Crown className="h-4 w-4" />
                Create Private Room
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinCode.trim().length >= 4) {
                    onJoinRoom(joinCode);
                  }
                }}
                className="rounded-xl border border-white/10 bg-slate-950/65 p-3.5"
              >
                <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Join with Room Code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    maxLength={8}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DINO7"
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-black tracking-widest text-white uppercase outline-none focus:border-sky-400"
                  />
                  <button
                    type="submit"
                    disabled={joinCode.trim().length < 4}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-950 uppercase transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>

            {/* Open Rooms Browser */}
            <div className="flex flex-col rounded-xl border border-white/10 bg-slate-950/65 p-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                  Open Lobbies ({openRooms.length})
                </span>
                <button
                  type="button"
                  onClick={onRefreshRooms}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-slate-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>

              <div className="mt-2.5 flex-1 space-y-2 overflow-y-auto">
                {openRooms.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    No open lobbies yet. Create a room or click Quick Join!
                  </div>
                ) : (
                  openRooms.map((rm) => {
                    const rmMode = getGameModeSpec(rm.raceConfig.mode);
                    const rmCourse =
                      rm.raceConfig.mode === 'battle'
                        ? 'Battle Arena'
                        : getCourseSpec(rm.raceConfig.courseId).name;
                    return (
                      <div
                        key={rm.roomCode}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black tracking-wider text-amber-300 tabular-nums">
                              {rm.roomCode}
                            </span>
                            <span className="truncate text-xs font-bold text-white">· {rm.hostName}</span>
                          </div>
                          <div className="break-all text-[11px] text-slate-400 tabular-nums">
                            {rmMode.shortLabel} · {rmCourse} · {rm.raceConfig.engineClass} · {rm.humanCount}/{rm.maxPlayers} Humans
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onJoinRoom(rm.roomCode)}
                          className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 uppercase whitespace-nowrap shrink-0 transition hover:bg-emerald-400"
                        >
                          Join
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* INSIDE ACTIVE ROOM LOBBY */
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-400/35 bg-indigo-950/35 px-4 py-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
                    Room Code
                  </div>
                  <div className="font-mono text-2xl font-black tracking-widest text-white tabular-nums">
                    {lobby.roomCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 whitespace-nowrap shrink-0 transition hover:bg-slate-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Link Copied!' : 'Copy Invite Link'}
                </button>
              </div>

              <div className="min-w-0 max-w-full text-right">
                <div className="text-sm font-black text-emerald-300 tabular-nums">
                  {humanPlayers.length} / 14 Human Racers
                </div>
                <div className="break-all text-xs text-slate-400 tabular-nums">
                  {lobbyMode?.name} · {lobbyCourseSummary} · {lobby.raceConfig.engineClass} ·{' '}
                  {lobby.raceConfig.mode === 'vs_race' && lobby.raceConfig.vsSolo
                    ? 'No CPUs'
                    : `+${cpuCount} CPUs`}
                </div>
              </div>
            </div>

            {/* Host Race Mode & Settings Bar */}
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/75 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                  {isHost ? 'Host Mode & Course Settings' : 'Room Event Settings'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {lobbyMode?.tagline}
                </span>
              </div>

              {isHost ? (
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {/* 4 Multiplayer Mode Tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {mpModes.map((m) => {
                      const active = lobby.raceConfig.mode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onChangeMpRaceConfig({ mode: m.id as GameMode })}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-black uppercase whitespace-nowrap shrink-0 transition ${
                            active
                              ? 'border-white/40 bg-slate-800 text-white shadow'
                              : 'border-white/10 bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                          style={active ? { borderColor: m.hexColor, color: m.hexColor } : undefined}
                        >
                          {m.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  {/* Course / Engine / VS Options */}
                  <div className="flex flex-wrap items-center gap-2">
                    {lobby.raceConfig.mode === 'vs_race' && (
                      <div className="flex max-h-24 flex-1 flex-wrap items-center gap-1 overflow-y-auto pr-1">
                        {COURSE_CATALOG.map((c) => {
                          const active = lobby.raceConfig.courseId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => onChangeMpRaceConfig({ courseId: c.id as CourseId })}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 transition ${
                                active
                                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                                  : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {lobby.raceConfig.mode === 'knockout_tour' && (
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {KNOCKOUT_CUP_CATALOG.map((cup) => {
                            const active = (lobby.raceConfig.knockoutCupId ?? 'ko_golden_cup') === cup.id;
                            return (
                              <button
                                key={cup.id}
                                type="button"
                                onClick={() => onChangeMpRaceConfig({ knockoutCupId: cup.id as KnockoutCupId })}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase whitespace-nowrap shrink-0 transition ${
                                  active
                                    ? 'bg-slate-800 text-white'
                                    : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                                style={active ? { borderColor: cup.accentHex, color: cup.accentHex } : undefined}
                              >
                                {cup.name}
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                          Stage {lobby.knockoutStageIndex}/6: {lobbyCourse?.name} ·{' '}
                          {lobbyKnockoutCup?.courses.map((cid) => getCourseSpec(cid).name).join(' · ')}
                        </span>
                      </div>
                    )}

                    {lobby.raceConfig.mode === 'grand_prix' && (
                      <div className="flex flex-1 flex-wrap items-center gap-1.5">
                        {CUP_CATALOG.map((cup) => {
                          const active = (lobby.raceConfig.cupId ?? 'mushroom_cup') === cup.id;
                          return (
                            <button
                              key={cup.id}
                              type="button"
                              onClick={() => onChangeMpRaceConfig({ cupId: cup.id as CupId })}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase whitespace-nowrap shrink-0 transition ${
                                active
                                  ? 'bg-slate-800 text-white'
                                  : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                              style={active ? { borderColor: cup.accentHex, color: cup.accentHex } : undefined}
                            >
                              {cup.name}
                            </button>
                          );
                        })}
                        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                          Race {lobby.gpRaceIndex}/4: {lobbyCourse?.name}
                        </span>
                      </div>
                    )}

                    {lobby.raceConfig.mode === 'battle' && (
                      <span className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-200">
                        Dino Battle Stadium · 90s · 3 Balloons
                      </span>
                    )}

                    <div className="ml-auto flex max-w-full flex-wrap items-center gap-1.5">
                      {ENGINE_CLASS_CATALOG.map((cc: EngineClass) => {
                        const active = lobby.raceConfig.engineClass === cc;
                        return (
                          <button
                            key={cc}
                            type="button"
                            onClick={() => onChangeMpRaceConfig({ engineClass: cc })}
                            className={`max-w-full rounded-lg border px-2 py-1 text-[11px] font-black tabular-nums transition ${
                              cc.length > 12 ? 'break-all text-left' : 'whitespace-nowrap shrink-0'
                            } ${
                              active
                                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {cc}
                          </button>
                        );
                      })}

                      {lobby.raceConfig.mode === 'vs_race' && (
                        <>
                          {VS_LAP_OPTIONS.map((laps) => {
                            const active = lobby.raceConfig.laps === laps;
                            return (
                              <button
                                key={laps}
                                type="button"
                                onClick={() => onChangeMpRaceConfig({ laps })}
                                className={`rounded-lg border px-2 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 tabular-nums transition ${
                                  active
                                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                    : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                              >
                                {laps}{lobby.raceConfig.courseId === 'bung_stadium' ? 'mi' : 'L'}
                              </button>
                            );
                          })}

                          {lobby.raceConfig.courseId === 'bung_stadium' && (
                            <button
                              type="button"
                              onClick={() => onChangeMpRaceConfig({ laps: BUNG_STADIUM_MAX_MILES })}
                              className={`max-w-full break-all rounded-lg border px-2 py-1 text-left text-[11px] font-bold tabular-nums transition ${
                                lobby.raceConfig.laps === BUNG_STADIUM_MAX_MILES
                                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                  : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {BUNG_STADIUM_MAX_MILES_LABEL} Miles
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onChangeMpRaceConfig({ vsSolo: !lobby.raceConfig.vsSolo })}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 transition ${
                              lobby.raceConfig.vsSolo
                                ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                                : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {lobby.raceConfig.vsSolo ? 'Solo (No CPUs)' : 'With CPUs'}
                          </button>

                          {(['normal', 'frantic', 'none'] as ItemFrequency[]).map((freq) => {
                            const active = lobby.raceConfig.itemFrequency === freq;
                            return (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => onChangeMpRaceConfig({ itemFrequency: freq })}
                                className={`rounded-lg border px-2 py-1 text-[11px] font-bold capitalize whitespace-nowrap shrink-0 transition ${
                                  active
                                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                                    : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                              >
                                Items: {freq}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-200 tabular-nums">
                  <span style={{ color: lobbyMode?.hexColor }}>{lobbyMode?.name}</span>
                  <span className="text-slate-500">·</span>
                  <span>{lobbyCourseSummary}</span>
                  <span className="text-slate-500">·</span>
                  <span className="break-all">{lobby.raceConfig.engineClass}</span>
                  {lobby.raceConfig.mode === 'vs_race' && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="break-all">
                        {lobby.raceConfig.laps === BUNG_STADIUM_MAX_MILES
                          ? BUNG_STADIUM_MAX_MILES_LABEL
                          : lobby.raceConfig.laps}{' '}
                        {lobby.raceConfig.courseId === 'bung_stadium' ? 'Miles' : 'Laps'}
                      </span>
                      {lobby.raceConfig.vsSolo && (
                        <>
                          <span className="text-slate-500">·</span>
                          <span className="text-sky-300">Solo (No CPUs)</span>
                        </>
                      )}
                      <span className="text-slate-500">·</span>
                      <span className="capitalize">Items: {lobby.raceConfig.itemFrequency}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Human Players List */}
            <div className="mt-3 grid flex-1 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {humanPlayers.map((p) => {
                const pChar = getCharacterSpec(p.characterId);
                const pCar = getCarSpec(p.carId);
                const isMe = p.clientId === myClientId;
                return (
                  <div
                    key={p.slotIndex}
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      isMe
                        ? 'border-emerald-400/60 bg-emerald-950/30'
                        : 'border-white/10 bg-slate-950/75'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 bg-white"
                        style={{ borderColor: pChar.hexPrimary }}
                      >
                        <CharacterAvatar characterId={p.characterId} className="h-full w-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white">
                            {p.name}
                            {isMe ? ' (You)' : ''}
                          </span>
                          {p.isHost && (
                            <span className="flex items-center gap-0.5 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase">
                              <Crown className="h-2.5 w-2.5" />
                              Host
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {pChar.name} · {pCar.name}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">P{p.slotIndex + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Lobby Footer Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 uppercase whitespace-nowrap shrink-0 transition hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Leave Room
              </button>

              {isHost ? (
                <button
                  type="button"
                  onClick={onStartMpRace}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-black tracking-wide text-slate-950 uppercase shadow-lg whitespace-nowrap shrink-0 transition hover:bg-emerald-400"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {startBtnLabel}
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-slate-950 px-5 py-3 text-xs font-bold text-slate-300 uppercase">
                  Waiting for host to start race...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
