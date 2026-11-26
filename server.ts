import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import {
  BUNG_STADIUM_MAX_MILES,
  CAR_CATALOG,
  CHARACTER_CATALOG,
  COURSE_CATALOG,
  CUP_CATALOG,
  ENGINE_CLASS_CATALOG,
  KNOCKOUT_CUP_CATALOG,
  VS_LAP_OPTIONS,
} from './src/game/types.ts';
import type {
  CarId,
  CharacterId,
  CourseId,
  CpuDifficulty,
  CupId,
  EngineClass,
  GameMode,
  ItemFrequency,
  KnockoutCupId,
  RaceConfig,
} from './src/game/types.ts';
import type { ClientMessage, RoomSummary } from './src/game/multiplayerTypes.ts';
import { RaceRoom } from './src/server/raceRoom.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_CARS = new Set<string>(CAR_CATALOG.map((c) => c.id));
const VALID_CHARS = new Set<string>(CHARACTER_CATALOG.map((c) => c.id));
const VALID_MP_MODES = new Set<string>(['grand_prix', 'knockout_tour', 'vs_race', 'battle']);
const VALID_COURSES = new Set<string>(COURSE_CATALOG.map((c) => c.id));
const VALID_CUPS = new Set<string>(CUP_CATALOG.map((c) => c.id));
const VALID_KNOCKOUT_CUPS = new Set<string>(KNOCKOUT_CUP_CATALOG.map((c) => c.id));
const VALID_CLASSES = new Set<string>(ENGINE_CLASS_CATALOG);
const VALID_FREQS = new Set<string>(['normal', 'frantic', 'none']);
const VALID_DIFFS = new Set<string>(['normal', 'hard', 'master']);

const VALID_VS_LAPS = new Set<number>(VS_LAP_OPTIONS);

function sanitizeRaceConfigPatch(raw: unknown, currentCourseId?: CourseId): Partial<RaceConfig> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const patch: Partial<RaceConfig> = {};
  if (typeof obj.mode === 'string' && VALID_MP_MODES.has(obj.mode)) {
    patch.mode = obj.mode as GameMode;
  }
  if (typeof obj.courseId === 'string' && VALID_COURSES.has(obj.courseId)) {
    patch.courseId = obj.courseId as CourseId;
  }
  if (typeof obj.cupId === 'string' && VALID_CUPS.has(obj.cupId)) {
    patch.cupId = obj.cupId as CupId;
  }
  if (typeof obj.knockoutCupId === 'string' && VALID_KNOCKOUT_CUPS.has(obj.knockoutCupId)) {
    patch.knockoutCupId = obj.knockoutCupId as KnockoutCupId;
  }
  if (typeof obj.engineClass === 'string' && VALID_CLASSES.has(obj.engineClass)) {
    patch.engineClass = obj.engineClass as EngineClass;
  }
  const effectiveCourse = patch.courseId ?? currentCourseId;
  if (typeof obj.laps === 'number' && Number.isFinite(obj.laps)) {
    if (effectiveCourse === 'bung_stadium' && obj.laps >= 1 && obj.laps <= BUNG_STADIUM_MAX_MILES) {
      patch.laps = obj.laps < 1e15 ? Math.floor(obj.laps) : obj.laps;
    } else if (VALID_VS_LAPS.has(obj.laps)) {
      patch.laps = obj.laps;
    }
  }
  if (typeof obj.itemFrequency === 'string' && VALID_FREQS.has(obj.itemFrequency)) {
    patch.itemFrequency = obj.itemFrequency as ItemFrequency;
  }
  if (typeof obj.cpuDifficulty === 'string' && VALID_DIFFS.has(obj.cpuDifficulty)) {
    patch.cpuDifficulty = obj.cpuDifficulty as CpuDifficulty;
  }
  if (typeof obj.vsSolo === 'boolean') {
    patch.vsSolo = obj.vsSolo;
  }
  return patch;
}

function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Dino Racer';
  const cleaned = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 16);
  return cleaned.length > 0 ? cleaned : 'Dino Racer';
}

function sanitizeChar(raw: unknown): CharacterId {
  return typeof raw === 'string' && VALID_CHARS.has(raw) ? (raw as CharacterId) : 'bingbong';
}

function sanitizeCar(raw: unknown): CarId {
  return typeof raw === 'string' && VALID_CARS.has(raw) ? (raw as CarId) : 'standard_kart';
}

function sanitizeRoomCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{4,8}$/.test(code) ? code : null;
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode(existing: Map<string, RaceRoom>): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += ROOM_ALPHABET[crypto.randomInt(ROOM_ALPHABET.length)];
    }
    if (!existing.has(code)) return code;
  }
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function bootstrap(): Promise<void> {
  const app = express();
  app.use(express.json());

  const rooms = new Map<string, RaceRoom>();

  function getOpenRoomSummaries(): RoomSummary[] {
    const list: RoomSummary[] = [];
    for (const room of rooms.values()) {
      const humanCount = room.getHumanCount();
      if (humanCount > 0 && room.status === 'lobby') {
        list.push({
          roomCode: room.roomCode,
          hostName: room.getHostName(),
          humanCount,
          maxPlayers: 14,
          status: room.status,
          raceConfig: room.raceConfig,
        });
      }
    }
    return list;
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/rooms', (_req, res) => {
    res.json({ rooms: getOpenRoomSummaries() });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });

  interface SocketMeta {
    clientId: string;
    roomCode: string | null;
    msgWindowStart: number;
    msgCount: number;
  }
  const metaMap = new WeakMap<WebSocket, SocketMeta>();

  function sendJson(ws: WebSocket, payload: unknown): void {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  }

  function detachFromCurrentRoom(ws: WebSocket, meta: SocketMeta, removeImmediately: boolean): void {
    if (!meta.roomCode) return;
    const room = rooms.get(meta.roomCode);
    meta.roomCode = null;
    if (!room) return;
    room.handleDisconnect(meta.clientId, removeImmediately);
    if (room.getHumanCount() === 0 && (room.status === 'lobby' || removeImmediately)) {
      room.stopLoop();
      rooms.delete(room.roomCode);
    } else {
      room.broadcast({ type: 'lobby_update', lobby: room.getLobbyState() });
    }
  }

  wss.on('connection', (ws) => {
    const clientId = crypto.randomUUID();
    const meta: SocketMeta = {
      clientId,
      roomCode: null,
      msgWindowStart: Date.now(),
      msgCount: 0,
    };
    metaMap.set(ws, meta);
    sendJson(ws, { type: 'welcome', clientId });

    ws.on('message', (rawBuf) => {
      const now = Date.now();
      if (now - meta.msgWindowStart > 1000) {
        meta.msgWindowStart = now;
        meta.msgCount = 0;
      }
      meta.msgCount++;
      if (meta.msgCount > 90) {
        return; // basic flood guard
      }

      let msg: ClientMessage;
      try {
        msg = JSON.parse(rawBuf.toString('utf8')) as ClientMessage;
      } catch {
        sendJson(ws, { type: 'error', message: 'Invalid message format.' });
        return;
      }
      if (!msg || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'ping': {
          sendJson(ws, { type: 'pong', t: typeof msg.t === 'number' ? msg.t : Date.now() });
          break;
        }
        case 'list_rooms': {
          sendJson(ws, { type: 'room_list', rooms: getOpenRoomSummaries() });
          break;
        }
        case 'create_room': {
          if (typeof msg.clientId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(msg.clientId)) {
            meta.clientId = msg.clientId;
          }
          detachFromCurrentRoom(ws, meta, true);
          const code = generateRoomCode(rooms);
          const room = new RaceRoom(code, meta.clientId);
          rooms.set(code, room);
          const res = room.addOrReconnectPlayer(
            meta.clientId,
            ws,
            sanitizeName(msg.name),
            sanitizeChar(msg.characterId),
            sanitizeCar(msg.carId),
          );
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
            break;
          }
          meta.roomCode = code;
          sendJson(ws, {
            type: 'room_joined',
            roomCode: code,
            mySlot: res.seat.slotIndex,
            lobby: room.getLobbyState(),
          });
          break;
        }
        case 'join_room': {
          if (typeof msg.clientId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(msg.clientId)) {
            meta.clientId = msg.clientId;
          }
          const code = sanitizeRoomCode(msg.roomCode);
          if (!code) {
            sendJson(ws, { type: 'error', message: 'Enter a valid 4-8 character room code.' });
            break;
          }
          const room = rooms.get(code);
          if (!room) {
            sendJson(ws, { type: 'error', message: `Room ${code} was not found.` });
            break;
          }
          if (meta.roomCode && meta.roomCode !== code) {
            detachFromCurrentRoom(ws, meta, true);
          }
          const res = room.addOrReconnectPlayer(
            meta.clientId,
            ws,
            sanitizeName(msg.name),
            sanitizeChar(msg.characterId),
            sanitizeCar(msg.carId),
          );
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
            break;
          }
          meta.roomCode = code;
          const lobby = room.getLobbyState();
          sendJson(ws, {
            type: 'room_joined',
            roomCode: code,
            mySlot: res.seat.slotIndex,
            lobby,
          });
          room.broadcast({ type: 'lobby_update', lobby });
          break;
        }
        case 'quick_join': {
          if (typeof msg.clientId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(msg.clientId)) {
            meta.clientId = msg.clientId;
          }
          detachFromCurrentRoom(ws, meta, true);
          let targetRoom: RaceRoom | null = null;
          for (const candidate of rooms.values()) {
            if (candidate.status === 'lobby' && candidate.getHumanCount() > 0 && candidate.getTotalSeatedCount() < 14) {
              targetRoom = candidate;
              break;
            }
          }
          if (!targetRoom) {
            const code = generateRoomCode(rooms);
            targetRoom = new RaceRoom(code, meta.clientId);
            rooms.set(code, targetRoom);
          }
          const res = targetRoom.addOrReconnectPlayer(
            meta.clientId,
            ws,
            sanitizeName(msg.name),
            sanitizeChar(msg.characterId),
            sanitizeCar(msg.carId),
          );
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
            break;
          }
          meta.roomCode = targetRoom.roomCode;
          const lobby = targetRoom.getLobbyState();
          sendJson(ws, {
            type: 'room_joined',
            roomCode: targetRoom.roomCode,
            mySlot: res.seat.slotIndex,
            lobby,
          });
          targetRoom.broadcast({ type: 'lobby_update', lobby });
          break;
        }
        case 'update_profile': {
          if (!meta.roomCode) break;
          const room = rooms.get(meta.roomCode);
          if (!room) break;
          room.updatePlayerProfile(
            meta.clientId,
            sanitizeName(msg.name),
            sanitizeChar(msg.characterId),
            sanitizeCar(msg.carId),
          );
          room.broadcast({ type: 'lobby_update', lobby: room.getLobbyState() });
          break;
        }
        case 'set_race_config': {
          if (!meta.roomCode) break;
          const room = rooms.get(meta.roomCode);
          if (!room) break;
          const res = room.setRaceConfig(
            meta.clientId,
            sanitizeRaceConfigPatch(msg.config, room.raceConfig.courseId),
          );
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
          } else {
            room.broadcast({ type: 'lobby_update', lobby: room.getLobbyState() });
          }
          break;
        }
        case 'start_race': {
          if (!meta.roomCode) break;
          const room = rooms.get(meta.roomCode);
          if (!room) break;
          const res = room.startRace(meta.clientId);
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
          }
          break;
        }
        case 'return_lobby': {
          if (!meta.roomCode) break;
          const room = rooms.get(meta.roomCode);
          if (!room) break;
          const res = room.returnToLobby(meta.clientId);
          if ('error' in res) {
            sendJson(ws, { type: 'error', message: res.error });
          }
          break;
        }
        case 'leave_room': {
          detachFromCurrentRoom(ws, meta, true);
          break;
        }
        case 'input': {
          if (!meta.roomCode) break;
          const room = rooms.get(meta.roomCode);
          if (!room) break;
          room.setPlayerInput(meta.clientId, {
            up: Boolean(msg.up),
            down: Boolean(msg.down),
            left: Boolean(msg.left),
            right: Boolean(msg.right),
            drift: Boolean(msg.drift),
            useItem: Boolean(msg.useItem),
          });
          break;
        }
      }
    });

    ws.on('close', () => {
      detachFromCurrentRoom(ws, meta, false);
    });
  });

  // Periodically prune idle empty rooms
  setInterval(() => {
    const cutoff = Date.now() - 120_000;
    for (const [code, room] of rooms.entries()) {
      if (room.getHumanCount() === 0 && room.lastActivity < cutoff) {
        room.stopLoop();
        rooms.delete(code);
      }
    }
  }, 30_000);

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Dino Turbo GP server listening on http://0.0.0.0:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
