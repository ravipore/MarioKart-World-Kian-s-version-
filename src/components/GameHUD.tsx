import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Flag,
  ShoppingBag,
  Users,
  Globe,
  LogOut,
  ChevronRight,
  Timer,
  Flame,
  ShieldAlert,
  Medal,
  Film,
  Rewind,
  Eye,
  EyeOff,
  ChevronLeft,
  Camera,
} from 'lucide-react';
import {
  ALL_ITEMS,
  BUNG_STADIUM_MAX_MILES,
  BUNG_STADIUM_MAX_MILES_LABEL,
  CharacterId,
  COURSE_CATALOG,
  CourseId,
  CpuDifficulty,
  CUP_CATALOG,
  CupId,
  ENGINE_CLASS_CATALOG,
  ENGINE_CLASS_MULT,
  EngineClass,
  GAME_MODE_CATALOG,
  GameMode,
  getCharacterSpec,
  getCourseSpec,
  getCupSpec,
  getGameModeSpec,
  getKnockoutCupSpec,
  HudSnapshot,
  ITEM_METADATA,
  VS_LAP_OPTIONS,
  ItemFrequency,
  KNOCKOUT_CUP_CATALOG,
  KnockoutCupId,
  RaceConfig,
  ReplayCameraAngle,
  ReplaySpeed,
} from '../game/types';
import { CharacterAvatar } from './CharacterAvatar';
import { ItemIcon } from './ItemIcon';

const REPLAY_CAMERAS: Array<{ id: ReplayCameraAngle; label: string }> = [
  { id: 'chase', label: 'Chase' },
  { id: 'tv_trackside', label: 'TV Cam' },
  { id: 'helicopter', label: 'Chopper' },
  { id: 'bumper', label: 'Bumper' },
  { id: 'orbit', label: 'Orbit' },
];

const REPLAY_SPEEDS: ReplaySpeed[] = [0.5, 1, 2, 4];

interface GameHUDProps {
  hud: HudSnapshot;
  raceConfig: RaceConfig;
  muted: boolean;
  equippedCarName: string;
  equippedCharacterId: CharacterId;
  mpRoomCode: string | null;
  isMultiplayerHost: boolean;
  onChangeRaceConfig: (patch: Partial<RaceConfig>) => void;
  onStartRace: () => void;
  onNextGpRace: () => void;
  onOpenShop: () => void;
  onOpenDrivers: () => void;
  onOpenMultiplayer: () => void;
  onMultiplayerPlayAgain: () => void;
  onLeaveMultiplayer: () => void;
  onTogglePause: () => void;
  onReturnToTitle: () => void;
  onToggleMute: () => void;
  onUseItem: () => void;
  onToggleGhost: () => void;
  onStartReplay: () => void;
  onStopReplay: () => void;
  onToggleReplayPause: () => void;
  onSeekReplay: (timeSec: number) => void;
  onRewindReplay: () => void;
  onSetReplaySpeed: (speed: ReplaySpeed) => void;
  onSetReplayCameraAngle: (angle: ReplayCameraAngle) => void;
  onSetReplayTargetRacer: (racerId: number) => void;
}

function formatOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatTime(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem.toFixed(2)}`;
}

function formatClock(sec: number): string {
  const whole = Math.max(0, Math.ceil(sec));
  const mins = Math.floor(whole / 60);
  const rem = whole % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

function parseBungMilesInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 1) return null;
  const clamped = Math.min(BUNG_STADIUM_MAX_MILES, num);
  return clamped < 1e15 ? Math.floor(clamped) : clamped;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  raceConfig,
  muted,
  equippedCarName,
  equippedCharacterId,
  mpRoomCode,
  isMultiplayerHost,
  onChangeRaceConfig,
  onStartRace,
  onNextGpRace,
  onOpenShop,
  onOpenDrivers,
  onOpenMultiplayer,
  onMultiplayerPlayAgain,
  onLeaveMultiplayer,
  onTogglePause,
  onReturnToTitle,
  onToggleMute,
  onUseItem,
  onToggleGhost,
  onStartReplay,
  onStopReplay,
  onToggleReplayPause,
  onSeekReplay,
  onRewindReplay,
  onSetReplaySpeed,
  onSetReplayCameraAngle,
  onSetReplayTargetRacer,
}) => {
  const [gpResultsTab, setGpResultsTab] = useState<'race' | 'cup'>('cup');
  const isTopThree = hud.rank <= 3;
  const equippedChar = getCharacterSpec(equippedCharacterId);
  const modeSpec = getGameModeSpec(hud.phase === 'title' ? raceConfig.mode : hud.mode);
  const activeCup = getCupSpec(raceConfig.cupId);
  const activeKnockoutCup = getKnockoutCupSpec(raceConfig.knockoutCupId);
  const courseSpec = getCourseSpec(hud.phase === 'title' ? raceConfig.courseId : hud.courseId);

  const rankColorClass =
    hud.rank === 1
      ? 'text-amber-300'
      : hud.rank === 2
        ? 'text-slate-200'
        : hud.rank === 3
          ? 'text-orange-300'
          : 'text-rose-300';

  const displayItem = hud.rouletteItem ?? hud.heldItem;
  const minimapPointsStr = hud.minimapPath.map((p) => `${p.x.toFixed(1)},${p.z.toFixed(1)}`).join(' ');

  const titleStartLabel =
    raceConfig.mode === 'grand_prix'
      ? 'Start Grand Prix'
      : raceConfig.mode === 'knockout_tour'
        ? 'Start Knockout Tour'
        : raceConfig.mode === 'time_trial'
          ? 'Start Time Trial'
          : raceConfig.mode === 'battle'
            ? 'Start Battle'
            : 'Start VS Race';

  const ttMedal = (() => {
    if (hud.mode !== 'time_trial') return null;
    const spec = getCourseSpec(hud.courseId);
    const classMult = ENGINE_CLASS_MULT[hud.engineClass] ?? 1.04;
    const scale = (hud.totalLaps / 3) * (1.04 / classMult);
    if (hud.raceTime <= spec.goldTimeSec * scale) return { label: 'Gold Trophy', color: 'text-amber-300' };
    if (hud.raceTime <= spec.silverTimeSec * scale) return { label: 'Silver Trophy', color: 'text-slate-200' };
    return { label: 'Bronze Trophy', color: 'text-orange-300' };
  })();

  const isGpCupFinal = hud.mode === 'grand_prix' && hud.gpRaceIndex >= hud.gpTotalRaces;

  const isReplayActive = Boolean(hud.replay?.active);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
      {/* REPLAY VIEWER BROADCAST OVERLAY */}
      {isReplayActive && hud.replay && (
        <div className="pointer-events-auto flex h-full w-full flex-col justify-between p-4 sm:p-6">
          {/* Replay Top Broadcast Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-rose-400 uppercase">
                <Film className="h-4 w-4" />
                Race Replay
              </div>
              <div className="h-4 w-px bg-white/15" />
              <div className="text-xs font-bold text-slate-200 uppercase">
                {getCourseSpec(hud.replay.courseId).name} · {getGameModeSpec(hud.replay.mode).shortLabel}
              </div>
              <div className="h-4 w-px bg-white/15" />
              {/* Racer Target Selector */}
              <div className="flex items-center gap-1.5">
                {hud.replay.racers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const list = hud.replay!.racers;
                      const idx = list.findIndex((r) => r.id === hud.replay!.targetRacerId);
                      const prev = list[(idx - 1 + list.length) % list.length];
                      if (prev) onSetReplayTargetRacer(prev.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    aria-label="Previous Racer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="px-1.5 text-xs font-black text-white">
                  <span className="tabular-nums text-amber-300">
                    {formatOrdinal(hud.replay.targetRacerRank)}
                  </span>{' '}
                  {hud.replay.targetRacerName}
                </div>
                {hud.replay.racers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const list = hud.replay!.racers;
                      const idx = list.findIndex((r) => r.id === hud.replay!.targetRacerId);
                      const next = list[(idx + 1) % list.length];
                      if (next) onSetReplayTargetRacer(next.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    aria-label="Next Racer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/90 text-slate-100 transition hover:bg-slate-800"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={onStopReplay}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 text-xs font-black text-rose-200 uppercase transition hover:bg-rose-500/35"
              >
                <LogOut className="h-4 w-4" />
                Exit Replay
              </button>
            </div>
          </div>

          {/* Replay Bottom Control Deck */}
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-slate-950/92 p-4 shadow-2xl">
            {/* Scrubber Bar */}
            <div className="flex items-center gap-3">
              <span className="tabular-nums w-14 text-xs font-black text-white">
                {formatTime(hud.replay.time)}
              </span>
              <input
                type="range"
                aria-label="Replay Timeline"
                min={0}
                max={Math.max(0.2, hud.replay.duration)}
                step={0.05}
                value={hud.replay.time}
                onChange={(e) => onSeekReplay(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer accent-sky-400"
              />
              <span className="tabular-nums w-14 text-right text-xs font-bold text-slate-400">
                {formatTime(hud.replay.duration)}
              </span>
            </div>

            {/* Playback + Speed + Camera Angles */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {/* Transport Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSeekReplay(0)}
                  className="flex h-9 items-center gap-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-slate-200 uppercase hover:bg-slate-800"
                  aria-label="Restart Replay"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restart
                </button>
                <button
                  type="button"
                  onClick={onRewindReplay}
                  className="flex h-9 items-center gap-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-xs font-bold text-slate-200 uppercase hover:bg-slate-800"
                  aria-label="Rewind 5 Seconds"
                >
                  <Rewind className="h-3.5 w-3.5" />
                  -5s
                </button>
                <button
                  type="button"
                  onClick={onToggleReplayPause}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-black text-slate-950 uppercase transition hover:bg-emerald-400"
                >
                  {hud.replay.paused ? (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Play
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </>
                  )}
                </button>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
                {REPLAY_SPEEDS.map((spd) => {
                  const active = hud.replay!.speed === spd;
                  return (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onSetReplaySpeed(spd)}
                      className={`tabular-nums rounded-lg px-2.5 py-1 text-xs font-black transition ${
                        active
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  );
                })}
              </div>

              {/* Camera Angle Selector */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
                <Camera className="mx-1.5 h-3.5 w-3.5 text-sky-300" />
                {REPLAY_CAMERAS.map((cam) => {
                  const active = hud.replay!.cameraAngle === cam.id;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => onSetReplayCameraAngle(cam.id)}
                      className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1 text-xs font-black uppercase transition ${
                        active
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cam.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TITLE SCREEN */}
      {!isReplayActive && hud.phase === 'title' && (
        <div className="pointer-events-auto flex h-full w-full flex-col justify-between overflow-y-auto p-4 sm:p-7">
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="max-w-[calc(100%-3.5rem)] break-all rounded-xl border border-white/15 bg-slate-950/85 px-4 py-2 text-xs font-semibold tracking-wider text-emerald-300 uppercase">
              {modeSpec.name} ·{' '}
              {raceConfig.mode === 'battle'
                ? 'Dino Battle Stadium · 90s'
                : raceConfig.mode === 'grand_prix'
                  ? `${activeCup.name} · 4-Race Cup`
                  : raceConfig.mode === 'knockout_tour'
                    ? `${activeKnockoutCup.name} · 6-Race Tour`
                    : raceConfig.mode === 'time_trial'
                      ? `${courseSpec.name} · Solo Ghost`
                      : `${courseSpec.name} · ${raceConfig.engineClass}`}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/85 text-slate-100 transition hover:bg-slate-800"
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Center Hero Title */}
          <div className="my-auto flex flex-col items-center py-2 text-center">
            <svg viewBox="0 0 600 118" className="w-full max-w-[540px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]" aria-label="Welcome to MarioKart World!">
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <text
                x="300"
                y="62"
                textAnchor="middle"
                fill="#0f172a"
                stroke="#0f172a"
                strokeWidth="12"
                strokeLinejoin="round"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize="48"
                letterSpacing="1.5"
              >
                MARIOKART WORLD!
              </text>
              <text
                x="300"
                y="62"
                textAnchor="middle"
                fill="url(#titleGrad)"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize="48"
                letterSpacing="1.5"
              >
                MARIOKART WORLD!
              </text>
              <rect x="138" y="76" width="324" height="28" rx="6" fill="#0f172a" fillOpacity="0.88" stroke="#4ade80" strokeWidth="1.5" />
              <text
                x="300"
                y="95"
                textAnchor="middle"
                fill="#f8fafc"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="800"
                fontSize="13"
                letterSpacing="2.2"
              >
                {equippedChar.name.toUpperCase()} · {modeSpec.name.toUpperCase()}
              </text>
            </svg>
          </div>

          {/* Bottom Dock: Mode Tabs + Track/Class Config + Loadout + CTAs */}
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-slate-950/92 p-4 shadow-2xl sm:p-5">
            {/* 5 Mario Kart Race Mode Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
              {GAME_MODE_CATALOG.map((m) => {
                const active = raceConfig.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChangeRaceConfig({ mode: m.id as GameMode })}
                    className={`whitespace-nowrap shrink-0 rounded-xl px-3.5 py-2 text-xs font-black tracking-wide uppercase transition ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {m.shortLabel}
                  </button>
                );
              })}
              <div className="ml-auto hidden items-center text-xs text-slate-400 lg:flex">
                {modeSpec.tagline}
              </div>
            </div>

            {/* Course, Engine Class & VS Rules Strip */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3.5">
              {/* Circuit or Cup Selector */}
              {raceConfig.mode === 'battle' ? (
                <div className="text-xs font-bold text-rose-300">
                  Arena: Dino Battle Stadium · 3 Balloons · 90s Showdown
                </div>
              ) : raceConfig.mode === 'grand_prix' ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CUP_CATALOG.map((cup) => {
                      const active = (raceConfig.cupId ?? 'mushroom_cup') === cup.id;
                      return (
                        <button
                          key={cup.id}
                          type="button"
                          onClick={() => onChangeRaceConfig({ cupId: cup.id as CupId })}
                          className={`whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase transition ${
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
                  <div className="text-[11px] text-slate-400">
                    {activeCup.courses.map((cid) => getCourseSpec(cid).name).join(' · ')}
                  </div>
                </div>
              ) : raceConfig.mode === 'knockout_tour' ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {KNOCKOUT_CUP_CATALOG.map((cup) => {
                      const active = (raceConfig.knockoutCupId ?? 'ko_golden_cup') === cup.id;
                      return (
                        <button
                          key={cup.id}
                          type="button"
                          onClick={() => onChangeRaceConfig({ knockoutCupId: cup.id as KnockoutCupId })}
                          className={`whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase transition ${
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
                  <div className="text-[11px] text-slate-400">
                    6 Stages:{' '}
                    {activeKnockoutCup.courses
                      .map((cid, idx) => `${idx + 1}. ${getCourseSpec(cid).name}`)
                      .join(' · ')}
                  </div>
                </div>
              ) : (
                <div className="flex max-h-24 flex-1 flex-wrap items-center gap-1 overflow-y-auto pr-1">
                  {COURSE_CATALOG.map((c) => {
                    const active = raceConfig.courseId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onChangeRaceConfig({ courseId: c.id as CourseId })}
                        className={`whitespace-nowrap shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          active
                            ? 'border border-sky-400 bg-sky-500/25 text-white'
                            : 'border border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Engine Class & VS Options */}
              <div className="flex max-w-full flex-wrap items-center gap-2">
                <div className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-slate-900 p-1">
                  {ENGINE_CLASS_CATALOG.map((cc: EngineClass) => (
                    <button
                      key={cc}
                      type="button"
                      onClick={() => onChangeRaceConfig({ engineClass: cc })}
                      className={`max-w-full rounded-md px-2 py-1 text-[11px] font-black tabular-nums transition ${
                        cc.length > 12 ? 'break-all text-left' : 'whitespace-nowrap'
                      } ${
                        raceConfig.engineClass === cc
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {cc}
                    </button>
                  ))}
                </div>

                {raceConfig.mode === 'vs_race' && (
                  <>
                    <select
                      aria-label="VS Race Laps"
                      value={
                        (VS_LAP_OPTIONS as readonly number[]).includes(raceConfig.laps) ||
                        (raceConfig.courseId === 'bung_stadium' && raceConfig.laps === BUNG_STADIUM_MAX_MILES)
                          ? String(raceConfig.laps)
                          : 'custom'
                      }
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          onChangeRaceConfig({ laps: Number(e.target.value) });
                        }
                      }}
                      className="max-w-[180px] truncate rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-slate-200 outline-none"
                    >
                      {VS_LAP_OPTIONS.map((l) => (
                        <option key={l} value={String(l)}>
                          {l} {raceConfig.courseId === 'bung_stadium' ? 'Miles' : 'Laps'}
                        </option>
                      ))}
                      {raceConfig.courseId === 'bung_stadium' && (
                        <option value={String(BUNG_STADIUM_MAX_MILES)}>
                          {BUNG_STADIUM_MAX_MILES_LABEL} Miles
                        </option>
                      )}
                      {!(VS_LAP_OPTIONS as readonly number[]).includes(raceConfig.laps) &&
                        !(raceConfig.courseId === 'bung_stadium' && raceConfig.laps === BUNG_STADIUM_MAX_MILES) && (
                          <option value="custom">
                            {raceConfig.laps} {raceConfig.courseId === 'bung_stadium' ? 'Miles' : 'Laps'}
                          </option>
                        )}
                    </select>
                    {raceConfig.courseId === 'bung_stadium' && (
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label="Bung Stadium Custom Miles"
                        placeholder="Custom Miles (up to 1e56)"
                        defaultValue={raceConfig.laps === BUNG_STADIUM_MAX_MILES ? BUNG_STADIUM_MAX_MILES_LABEL : String(raceConfig.laps)}
                        key={`bung_miles_${raceConfig.laps}`}
                        onBlur={(e) => {
                          const parsed = parseBungMilesInput(e.target.value);
                          if (parsed !== null && parsed !== raceConfig.laps) {
                            onChangeRaceConfig({ laps: parsed });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const parsed = parseBungMilesInput((e.target as HTMLInputElement).value);
                            if (parsed !== null) {
                              onChangeRaceConfig({ laps: parsed });
                            }
                          }
                        }}
                        className="w-36 rounded-lg border border-amber-400/35 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-amber-200 placeholder:text-slate-500 outline-none focus:border-amber-400"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onChangeRaceConfig({ vsSolo: !raceConfig.vsSolo })}
                      className={`whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase transition ${
                        raceConfig.vsSolo
                          ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                          : 'border-white/15 bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                    >
                      {raceConfig.vsSolo ? 'Solo (No CPUs)' : 'With CPUs'}
                    </button>
                    <select
                      aria-label="VS Item Frequency"
                      value={raceConfig.itemFrequency}
                      onChange={(e) =>
                        onChangeRaceConfig({ itemFrequency: e.target.value as ItemFrequency })
                      }
                      className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-slate-200 outline-none"
                    >
                      <option value="normal">Normal Items</option>
                      <option value="frantic">Frantic Items</option>
                      <option value="none">No Items</option>
                    </select>
                    {!raceConfig.vsSolo && (
                      <select
                        aria-label="VS CPU Difficulty"
                        value={raceConfig.cpuDifficulty}
                        onChange={(e) =>
                          onChangeRaceConfig({ cpuDifficulty: e.target.value as CpuDifficulty })
                        }
                        className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-slate-200 outline-none"
                      >
                        <option value="normal">CPU Normal</option>
                        <option value="hard">CPU Hard</option>
                        <option value="master">CPU Master</option>
                      </select>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Loadout + Action Buttons */}
            <div className="mt-3.5 flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-white"
                  style={{ borderColor: equippedChar.hexPrimary }}
                >
                  <CharacterAvatar characterId={equippedCharacterId} className="h-full w-full" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                    {equippedChar.species} · {equippedCarName}
                  </div>
                  <div className="text-lg font-extrabold text-white">{equippedChar.name}</div>
                  <div className="text-xs text-slate-400">{modeSpec.tagline}</div>
                </div>
              </div>

              <div className="flex w-full flex-wrap justify-end gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={onOpenDrivers}
                  className="flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-sky-400/50 bg-sky-400/15 px-3.5 py-2.5 text-xs font-black tracking-wide text-sky-300 uppercase transition hover:bg-sky-400/25 active:scale-[0.98]"
                >
                  <Users className="h-4 w-4" />
                  Drivers
                </button>
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-amber-400/50 bg-amber-400/15 px-3.5 py-2.5 text-xs font-black tracking-wide text-amber-300 uppercase transition hover:bg-amber-400/25 active:scale-[0.98]"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Garage
                </button>
                <button
                  type="button"
                  onClick={onOpenMultiplayer}
                  className="flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-indigo-400/55 bg-indigo-500/20 px-3.5 py-2.5 text-xs font-black tracking-wide text-indigo-200 uppercase transition hover:bg-indigo-500/35 active:scale-[0.98]"
                >
                  <Globe className="h-4 w-4" />
                  Multiplayer
                </button>
                {hud.hasReplay && (
                  <button
                    type="button"
                    onClick={onStartReplay}
                    className="flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-rose-400/55 bg-rose-500/20 px-3.5 py-2.5 text-xs font-black tracking-wide text-rose-200 uppercase transition hover:bg-rose-500/35 active:scale-[0.98]"
                  >
                    <Film className="h-4 w-4" />
                    Last Replay
                  </button>
                )}
                <button
                  type="button"
                  onClick={onStartRace}
                  className="flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black tracking-wide text-slate-950 uppercase shadow-lg transition hover:bg-emerald-400 active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {titleStartLabel}
                </button>
              </div>
            </div>

            {/* 7 Custom Items Compact Strip */}
            <div className="mt-3.5 flex flex-wrap justify-center gap-1.5 border-t border-white/10 pt-3">
              {ALL_ITEMS.map((itemKey) => {
                const meta = ITEM_METADATA[itemKey];
                return (
                  <div
                    key={itemKey}
                    className="flex w-[calc(50%-0.375rem)] items-center gap-2 rounded-lg bg-slate-900/85 px-2 py-1 sm:w-[calc(25%-0.375rem)]"
                  >
                    <ItemIcon type={itemKey} className="h-6 w-6 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-white">{meta.label}</div>
                      <div className="hidden truncate text-[10px] text-slate-400 sm:block">
                        {meta.shortDesc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2.5 text-center text-[11px] font-medium tracking-wide text-slate-400">
              W/A/S/D or Arrows Drive · Shift Drift · Space Use Item · Esc Pause
            </div>
          </div>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {!isReplayActive && hud.phase === 'countdown' && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="mx-4 max-w-xl rounded-2xl border border-white/20 bg-slate-950/88 px-8 py-6 text-center shadow-2xl sm:px-10">
            <div className="break-all text-xs font-bold tracking-widest text-emerald-400 uppercase">
              {hud.mode === 'grand_prix'
                ? `Grand Prix Race ${hud.gpRaceIndex}/${hud.gpTotalRaces} · ${courseSpec.name}`
                : hud.mode === 'battle'
                  ? 'Dino Battle Stadium · 3 Balloons · 90s'
                  : hud.mode === 'knockout_tour'
                    ? `Knockout Cup Stage ${hud.knockout?.stageIndex ?? 1}/${hud.knockout?.totalStages ?? 6} · ${courseSpec.name}`
                    : hud.mode === 'time_trial'
                      ? `Time Trial · ${courseSpec.name} · ${hud.engineClass}`
                      : `${courseSpec.name} · ${hud.engineClass}`}
            </div>
            <div className="tabular-nums mt-1 text-7xl font-black italic text-amber-300">
              {hud.countdown > 0 ? hud.countdown : 'GO!'}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE RACE HUD */}
      {!isReplayActive && (hud.phase === 'playing' || hud.phase === 'paused') && (
        <>
          {/* TOP ROW */}
          <div className="flex items-start justify-between p-3 sm:p-5">
            {/* Top-Left Mode Status Card */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/88 px-3.5 py-2.5 shadow-xl">
              <div
                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 bg-white"
                style={{ borderColor: equippedChar.hexPrimary }}
              >
                <CharacterAvatar characterId={equippedCharacterId} className="h-full w-full" />
              </div>

              {hud.mode === 'battle' ? (
                <div className="flex items-baseline gap-3.5">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Pos</div>
                    <div className={`tabular-nums text-2xl font-black italic leading-none ${rankColorClass}`}>
                      {formatOrdinal(hud.rank)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-rose-300 uppercase">Balloons</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {[0, 1, 2].map((idx) => (
                        <span
                          key={idx}
                          className={`h-3.5 w-3.5 rounded-full border ${
                            idx < hud.battleBalloons
                              ? idx === 0
                                ? 'border-rose-200 bg-rose-500'
                                : idx === 1
                                  ? 'border-sky-200 bg-sky-400'
                                  : 'border-amber-200 bg-amber-400'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">Hits</div>
                    <div className="tabular-nums text-xl font-black text-amber-300 leading-none">
                      {hud.battleScore}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Time</div>
                    <div className="tabular-nums text-xl font-black text-white leading-none">
                      {formatClock(hud.battleTimeLeft)}
                    </div>
                  </div>
                </div>
              ) : hud.mode === 'time_trial' ? (
                <div className="flex items-baseline gap-3.5">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-sky-300 uppercase">
                      <Timer className="h-3 w-3" /> Time
                    </div>
                    <div className="tabular-nums text-2xl font-black text-white leading-none">
                      {formatTime(hud.raceTime)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Lap</div>
                    <div className="tabular-nums text-xl font-black text-white leading-none">
                      {hud.lap}
                      <span className="text-xs font-semibold text-slate-400">/{hud.totalLaps}</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">Best</div>
                    <div className="tabular-nums text-sm font-black text-amber-300 leading-none">
                      {hud.personalBest ? formatTime(hud.personalBest) : '--:--'}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-orange-300 uppercase">Nitro</div>
                    <div className="tabular-nums text-xl font-black text-orange-300 leading-none">
                      x{hud.mushroomsLeft}
                    </div>
                  </div>
                  {hud.ghostActive && (
                    <>
                      <div className="h-8 w-px bg-white/15" />
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-sky-300 uppercase">Ghost</div>
                        <div
                          className={`tabular-nums text-sm font-black leading-none ${
                            hud.ghostDeltaSec === null
                              ? 'text-sky-300'
                              : hud.ghostDeltaSec <= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                          }`}
                        >
                          {!hud.ghostEnabled
                            ? 'OFF'
                            : hud.ghostDeltaSec === null
                              ? 'LIVE'
                              : `${hud.ghostDeltaSec <= 0 ? '' : '+'}${hud.ghostDeltaSec.toFixed(2)}s`}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {hud.mode === 'grand_prix'
                        ? `Race ${hud.gpRaceIndex}/${hud.gpTotalRaces}`
                        : hud.mode === 'knockout_tour' && hud.knockout
                          ? `Stage ${hud.knockout.stageIndex}/${hud.knockout.totalStages}`
                          : hud.totalRacers === 1
                            ? 'Pos · Solo'
                            : isTopThree
                              ? 'Pos · Winning'
                              : 'Pos · Need Top 3'}
                    </div>
                    <div className={`tabular-nums text-3xl font-black italic leading-none ${rankColorClass}`}>
                      {formatOrdinal(hud.rank)}
                      <span className="text-sm font-bold not-italic text-slate-400">/{hud.totalRacers}</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/15" />
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {hud.courseId === 'bung_stadium' ? 'Lap · Miles' : 'Lap'}
                    </div>
                    <div className="tabular-nums text-xl font-black text-white leading-none">
                      {hud.lap}
                      <span className="text-xs font-semibold text-slate-400">
                        /{hud.totalLaps}
                      </span>
                    </div>
                  </div>
                  {hud.knockout && (
                    <>
                      <div className="h-8 w-px bg-white/15" />
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {hud.knockout.stageIndex >= hud.knockout.totalStages
                            ? 'Final Stage'
                            : `Top ${hud.knockout.cutoffRank} Advance`}
                        </div>
                        <div
                          className={`tabular-nums text-xs font-black uppercase ${
                            hud.knockout.eliminated
                              ? 'text-rose-400'
                              : hud.knockout.isInDanger
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          {hud.knockout.eliminated
                            ? 'Knocked Out'
                            : hud.knockout.stageIndex >= hud.knockout.totalStages
                              ? isTopThree
                                ? 'On Podium'
                                : 'Chase Top 3'
                              : hud.knockout.isInDanger
                                ? `Danger · Need Top ${hud.knockout.cutoffRank}`
                                : `Safe · Top ${hud.knockout.cutoffRank}`}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Top-Center: Held Item Slot & Active Effect Timer */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onUseItem}
                disabled={!hud.heldItem}
                className="pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-white/20 bg-slate-950/90 px-4 py-2 shadow-xl transition hover:border-amber-300 disabled:cursor-default disabled:hover:border-white/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
                  {displayItem ? (
                    <ItemIcon type={displayItem} className="h-10 w-10" />
                  ) : (
                    <span className="text-lg font-black text-slate-600">?</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {hud.rouletteItem
                      ? 'Rolling...'
                      : hud.heldItem
                        ? hud.mode === 'time_trial'
                          ? `Space · ${hud.mushroomsLeft} Left`
                          : 'Press Space'
                        : 'Item Box'}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {displayItem ? ITEM_METADATA[displayItem].label : 'Empty'}
                  </div>
                </div>
              </button>

              {hud.knockout?.isInDanger && (
                <div className="flex items-center gap-1.5 rounded-xl border border-rose-400 bg-rose-950/95 px-4 py-1 text-xs font-black tracking-wider text-rose-200 uppercase shadow-lg">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Danger Zone — Reach Top {hud.knockout.cutoffRank}!
                </div>
              )}

              {hud.activeEffect && (
                <div className="w-48 rounded-xl border border-amber-300/40 bg-slate-950/90 px-3 py-1.5 shadow-lg">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-300 uppercase">
                    <span>{ITEM_METADATA[hud.activeEffect.type].label}</span>
                    <span className="tabular-nums">{hud.activeEffect.remaining.toFixed(1)}s</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-amber-400"
                      style={{
                        width: `${Math.min(100, (hud.activeEffect.remaining / hud.activeEffect.duration) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {hud.spinyIncoming && (
                <div className="rounded-xl border border-blue-400 bg-blue-950/95 px-4 py-1.5 text-xs font-black tracking-wider text-blue-200 uppercase shadow-lg">
                  Spiny Shell Incoming!
                </div>
              )}

              {hud.eventBanner && (
                <div className="rounded-xl border border-emerald-400/50 bg-slate-950/90 px-4 py-1 text-xs font-black tracking-wider text-emerald-300 uppercase shadow-lg">
                  {hud.eventBanner}
                </div>
              )}
            </div>

            {/* Top-Right: Course/Class Label + Ghost Toggle + Mute + Pause/Leave */}
            <div className="pointer-events-auto flex items-center gap-2">
              {hud.mode === 'time_trial' && hud.ghostActive && (
                <button
                  type="button"
                  onClick={onToggleGhost}
                  className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-black uppercase transition ${
                    hud.ghostEnabled
                      ? 'border-sky-400/50 bg-sky-500/20 text-sky-200 hover:bg-sky-500/35'
                      : 'border-white/15 bg-slate-950/88 text-slate-400 hover:text-white'
                  }`}
                >
                  {hud.ghostEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {hud.ghostEnabled ? 'Ghost On' : 'Ghost Off'}
                </button>
              )}
              {hud.isMultiplayer && mpRoomCode ? (
                <div className="rounded-xl border border-indigo-400/40 bg-slate-950/90 px-3 py-2 text-xs font-black tracking-wider text-indigo-200 uppercase">
                  Room {mpRoomCode}
                </div>
              ) : (
                <div className="hidden max-w-xs truncate rounded-xl border border-white/15 bg-slate-950/88 px-3 py-2 text-xs font-bold text-slate-300 uppercase sm:block">
                  {hud.mode === 'battle' ? 'Battle Arena' : courseSpec.name} · {hud.engineClass}
                </div>
              )}
              <button
                type="button"
                onClick={onToggleMute}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/88 text-slate-100 transition hover:bg-slate-800"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              {hud.isMultiplayer ? (
                <button
                  type="button"
                  onClick={onLeaveMultiplayer}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/88 px-3 text-xs font-bold text-slate-200 uppercase transition hover:bg-slate-800"
                  aria-label="Leave Room"
                >
                  <LogOut className="h-4 w-4" />
                  Leave
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/88 text-slate-100 transition hover:bg-slate-800"
                  aria-label="Pause"
                >
                  <Pause className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex items-end justify-between p-3 sm:p-5">
            <div className="flex items-end gap-3 rounded-2xl border border-white/15 bg-slate-950/88 px-4 py-2.5 shadow-xl">
              <div>
                <div className="tabular-nums text-3xl font-black italic text-white leading-none">
                  {hud.speedKmh}
                </div>
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">KM/H</div>
              </div>
              {hud.driftLevel > 0 && (
                <div
                  className={`rounded-lg px-2 py-1 text-[11px] font-black uppercase ${
                    hud.driftLevel === 2 ? 'bg-orange-500 text-slate-950' : 'bg-sky-400 text-slate-950'
                  }`}
                >
                  {hud.driftLevel === 2 ? 'Super Drift' : 'Drift'}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-950/88 p-2.5 shadow-xl">
              <svg viewBox="-6 -6 112 112" className="h-28 w-28 sm:h-32 sm:w-32" aria-label="Track Minimap">
                {hud.courseId === 'bung_stadium' ? (
                  <>
                    <polyline
                      points={minimapPointsStr}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={minimapPointsStr}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  <>
                    <polygon
                      points={minimapPointsStr}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="7"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={minimapPointsStr}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </>
                )}
                {hud.minimapDots.map(
                  (dot) =>
                    !dot.isPlayer && (
                      <circle
                        key={dot.id}
                        cx={dot.x}
                        cy={dot.z}
                        r={dot.rank <= 3 ? 3.2 : 2.4}
                        fill={dot.color}
                        stroke="#0f172a"
                        strokeWidth="1"
                      />
                    ),
                )}
                {hud.minimapDots
                  .filter((d) => d.isPlayer)
                  .map((playerDot) => (
                    <circle
                      key={playerDot.id}
                      cx={playerDot.x}
                      cy={playerDot.z}
                      r={4.8}
                      fill={playerDot.color}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                    />
                  ))}
              </svg>
            </div>
          </div>
        </>
      )}

      {/* PAUSE MODAL */}
      {!isReplayActive && hud.phase === 'paused' && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black tracking-wide text-white uppercase">Paused</h2>
            <p className="mt-1 text-sm text-slate-400">
              {modeSpec.name} · {hud.mode === 'battle' ? `${hud.battleScore} Hits` : `${formatOrdinal(hud.rank)} of ${hud.totalRacers}`}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <Play className="h-4 w-4 fill-current" />
                Resume
              </button>
              <button
                type="button"
                onClick={onStartRace}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 font-bold text-white transition hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Back to Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINISHED / PODIUM MODAL */}
      {!isReplayActive && hud.phase === 'finished' && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white"
                style={{ borderColor: equippedChar.hexPrimary }}
              >
                <CharacterAvatar characterId={equippedCharacterId} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {hud.mode === 'time_trial' ? (
                    <Medal className="h-6 w-6 text-sky-400" />
                  ) : hud.mode === 'knockout_tour' && hud.knockout?.eliminated ? (
                    <Flame className="h-6 w-6 text-rose-400" />
                  ) : isTopThree ? (
                    <Trophy className="h-6 w-6 text-amber-400" />
                  ) : (
                    <Flag className="h-6 w-6 text-rose-400" />
                  )}
                  <h2 className="text-xl font-black italic tracking-wide text-white uppercase sm:text-2xl">
                    {hud.mode === 'time_trial'
                      ? hud.newRecord
                        ? 'New Personal Best!'
                        : 'Time Trial Complete!'
                      : hud.mode === 'battle'
                        ? isTopThree
                          ? 'Battle Victory! Top 3!'
                          : 'Battle Over!'
                        : hud.mode === 'knockout_tour' && hud.knockout?.eliminated
                          ? `Knocked Out in Stage ${hud.knockout.stageIndex}/${hud.knockout.totalStages}!`
                          : hud.mode === 'knockout_tour' && hud.knockout?.stageCleared
                            ? `Stage ${hud.knockout.stageIndex}/${hud.knockout.totalStages} Cleared!`
                            : hud.mode === 'knockout_tour' && hud.knockout?.tourComplete
                              ? hud.rank === 1
                                ? 'Knockout Tour Champion!'
                                : 'Knockout Tour Complete!'
                              : isGpCupFinal
                                ? 'Grand Prix Cup Complete!'
                                : hud.mode === 'grand_prix'
                                  ? `Grand Prix Race ${hud.gpRaceIndex}/4 Complete`
                                  : hud.mode === 'vs_race' && hud.totalRacers === 1
                                    ? 'Solo Race Complete!'
                                    : isTopThree
                                      ? 'Victory! Top 3 Finish!'
                                      : 'Race Over — Not Top 3'}
                  </h2>
                </div>
                <p className="mt-0.5 break-all text-sm text-slate-300">
                  {hud.mode === 'time_trial' ? (
                    <>
                      {courseSpec.name} ({hud.engineClass}) ·{' '}
                      <span className="tabular-nums font-black text-sky-300">{formatTime(hud.raceTime)}</span>
                      {ttMedal ? <> · <span className={`font-black ${ttMedal.color}`}>{ttMedal.label}</span></> : null}
                    </>
                  ) : hud.mode === 'battle' ? (
                    <>
                      {equippedChar.name} finished{' '}
                      <span className={`font-black ${rankColorClass}`}>{formatOrdinal(hud.rank)}</span> ·{' '}
                      <span className="tabular-nums font-bold text-amber-300">{hud.battleScore} Hits</span>
                    </>
                  ) : (
                    <>
                      {equippedChar.name} finished{' '}
                      <span className={`font-black ${rankColorClass}`}>{formatOrdinal(hud.rank)}</span> of{' '}
                      {hud.totalRacers} · <span className="tabular-nums">{formatTime(hud.raceTime)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Grand Prix View Toggle (Cup Standings vs Race Results) */}
            {hud.mode === 'grand_prix' && hud.cupStandings.length > 0 && (
              <div className="mt-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setGpResultsTab('cup')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase transition ${
                    gpResultsTab === 'cup'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cup Standings ({hud.gpRaceIndex}/4)
                </button>
                <button
                  type="button"
                  onClick={() => setGpResultsTab('race')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black uppercase transition ${
                    gpResultsTab === 'race'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {courseSpec.name} Results
                </button>
              </div>
            )}

            {/* Mode-Specific Results Body */}
            {hud.mode === 'time_trial' ? (
              <div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-bold uppercase text-slate-400">
                  <span>Lap Splits</span>
                  <span>
                    Personal Best:{' '}
                    <span className="tabular-nums text-amber-300">
                      {hud.personalBest ? formatTime(hud.personalBest) : '--:--'}
                    </span>
                  </span>
                </div>
                {hud.lapSplits.map((split, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm"
                  >
                    <span className="font-bold text-slate-300">Lap {i + 1}</span>
                    <span className="tabular-nums font-black text-white">{formatTime(split)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-sm">
                  <span className="font-black text-sky-300 uppercase">Total Time</span>
                  <span className="tabular-nums font-black text-white">{formatTime(hud.raceTime)}</span>
                </div>
              </div>
            ) : hud.mode === 'grand_prix' && gpResultsTab === 'cup' && hud.cupStandings.length > 0 ? (
              <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-2">
                <div className="grid grid-cols-[44px_1fr_76px] px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <span>Rank</span>
                  <span>Racer</span>
                  <span className="text-right">Cup Pts</span>
                </div>
                <div className="space-y-1">
                  {hud.cupStandings.map((entry) => (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-[44px_1fr_76px] items-center rounded-lg px-2.5 py-1.5 text-sm ${
                        entry.isPlayer
                          ? 'border border-emerald-400/60 bg-emerald-500/20 font-bold text-white'
                          : entry.rank <= 3
                            ? 'bg-slate-900 text-slate-100'
                            : 'text-slate-400'
                      }`}
                    >
                      <span className="tabular-nums font-black text-amber-300">
                        {formatOrdinal(entry.rank)}
                      </span>
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.hexColor }}
                        />
                        <span className="truncate">
                          {entry.name}
                          {entry.isPlayer ? ' (You)' : ''}
                        </span>
                      </span>
                      <span className="tabular-nums text-right font-black text-amber-300">
                        {entry.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-2">
                <div
                  className={`grid ${
                    hud.mode === 'battle' || hud.mode === 'grand_prix'
                      ? 'grid-cols-[44px_1fr_74px_78px]'
                      : 'grid-cols-[44px_1fr_78px]'
                  } px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase`}
                >
                  <span>Pos</span>
                  <span>Racer</span>
                  {(hud.mode === 'battle' || hud.mode === 'grand_prix') && (
                    <span className="text-right">
                      {hud.mode === 'battle' ? 'Balloons' : 'Pts'}
                    </span>
                  )}
                  <span className="text-right">
                    {hud.mode === 'battle' ? 'Hits' : 'Time'}
                  </span>
                </div>
                <div className="space-y-1">
                  {hud.standings.map((entry) => {
                    const winner = entry.rank <= 3 && !entry.eliminated;
                    return (
                      <div
                        key={entry.id}
                        className={`grid ${
                          hud.mode === 'battle' || hud.mode === 'grand_prix'
                            ? 'grid-cols-[44px_1fr_74px_78px]'
                            : 'grid-cols-[44px_1fr_78px]'
                        } items-center rounded-lg px-2.5 py-1.5 text-sm ${
                          entry.isPlayer
                            ? 'border border-emerald-400/60 bg-emerald-500/20 font-bold text-white'
                            : winner
                              ? 'bg-slate-900 text-slate-100'
                              : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`tabular-nums font-black ${
                            entry.eliminated
                              ? 'text-rose-400'
                              : entry.rank === 1
                                ? 'text-amber-300'
                                : entry.rank === 2
                                  ? 'text-slate-200'
                                  : entry.rank === 3
                                    ? 'text-orange-300'
                                    : 'text-slate-500'
                          }`}
                        >
                          {formatOrdinal(entry.rank)}
                        </span>
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.hexColor }}
                          />
                          <span className="truncate">
                            {entry.name}
                            {entry.isPlayer ? ' (You)' : ''}
                          </span>
                          {entry.eliminated && (
                            <span className="rounded bg-rose-500/25 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-300 uppercase">
                              KO
                            </span>
                          )}
                          {hud.isMultiplayer && entry.isHuman && !entry.isPlayer && (
                            <span className="rounded bg-indigo-500/25 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-200 uppercase">
                              Player
                            </span>
                          )}
                          {winner && (
                            <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase">
                              Win
                            </span>
                          )}
                        </span>
                        {(hud.mode === 'battle' || hud.mode === 'grand_prix') && (
                          <span className="tabular-nums text-right text-amber-300">
                            {hud.mode === 'battle'
                              ? `${entry.balloons ?? 0}`
                              : `+${entry.points ?? 0}`}
                          </span>
                        )}
                        <span className="tabular-nums text-right text-xs">
                          {hud.mode === 'battle' ? `${entry.score ?? 0} hits` : formatTime(entry.finishTime)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Finished Footer Actions */}
            {hud.isMultiplayer ? (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {hud.hasReplay && (
                  <button
                    type="button"
                    onClick={onStartReplay}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/55 bg-rose-500/20 px-4 py-3 font-bold text-rose-200 transition hover:bg-rose-500/35"
                  >
                    <Film className="h-4 w-4" />
                    Watch Replay
                  </button>
                )}
                {isMultiplayerHost ? (
                  <button
                    type="button"
                    onClick={onMultiplayerPlayAgain}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-black text-slate-950 transition hover:bg-emerald-400"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {hud.mode === 'grand_prix' && hud.gpRaceIndex < 4
                      ? `Back to Lobby · Next Race (${hud.gpRaceIndex + 1}/4)`
                      : hud.mode === 'knockout_tour' &&
                          hud.knockout &&
                          hud.knockout.stageIndex < hud.knockout.totalStages
                        ? `Back to Lobby · Stage ${hud.knockout.stageIndex + 1}/${hud.knockout.totalStages}`
                        : 'Back to Lobby / Race Again'}
                  </button>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-slate-950 py-3 text-xs font-bold text-slate-300 uppercase">
                    Waiting for host to continue...
                  </div>
                )}
                <button
                  type="button"
                  onClick={onLeaveMultiplayer}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800 px-5 py-3 font-bold text-white transition hover:bg-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Room
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {(hud.mode === 'grand_prix' && hud.gpRaceIndex < hud.gpTotalRaces) ||
                (hud.mode === 'knockout_tour' &&
                  hud.knockout &&
                  !hud.knockout.eliminated &&
                  hud.knockout.stageIndex < hud.knockout.totalStages) ? (
                  <button
                    type="button"
                    onClick={onNextGpRace}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-black text-slate-950 transition hover:bg-amber-300"
                  >
                    {hud.mode === 'knockout_tour' && hud.knockout
                      ? `Next Stage (${hud.knockout.stageIndex + 1}/${hud.knockout.totalStages})`
                      : `Next Race (${hud.gpRaceIndex + 1}/4)`}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartRace}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-black text-slate-950 transition hover:bg-emerald-400"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {hud.mode === 'grand_prix'
                      ? 'New Grand Prix'
                      : hud.mode === 'knockout_tour'
                        ? 'New Knockout Tour'
                        : 'Race Again'}
                  </button>
                )}
                {hud.hasReplay && (
                  <button
                    type="button"
                    onClick={onStartReplay}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/55 bg-rose-500/20 px-4 py-3 font-bold text-rose-200 transition hover:bg-rose-500/35"
                  >
                    <Film className="h-4 w-4" />
                    Watch Replay
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenDrivers}
                  className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/50 bg-sky-400/15 px-4 py-3 font-bold text-sky-300 transition hover:bg-sky-400/25"
                >
                  <Users className="h-4 w-4" />
                  Drivers
                </button>
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-400/25"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Garage
                </button>
                <button
                  type="button"
                  onClick={onReturnToTitle}
                  className="rounded-xl border border-white/15 bg-slate-800 px-4 py-3 font-bold text-white transition hover:bg-slate-700"
                >
                  Title
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
