import type {
  ClientMessage,
  LobbyState,
  RoomSummary,
  ServerMessage,
} from './multiplayerTypes';
import type { CarId, CharacterId, RaceConfig } from './types';

export type MpConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface MultiplayerClientCallbacks {
  onStatusChange: (status: MpConnectionStatus, rttMs: number | null) => void;
  onWelcome?: (clientId: string) => void;
  onRoomJoined: (roomCode: string, mySlot: number, lobby: LobbyState) => void;
  onLobbyUpdate: (lobby: LobbyState) => void;
  onRoomList: (rooms: RoomSummary[]) => void;
  onRaceState: (msg: Extract<ServerMessage, { type: 'race_state' }>) => void;
  onError: (message: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerClientCallbacks;
  private clientId: string | null = null;
  private currentRoomCode: string | null = null;
  private currentProfile: { name: string; characterId: CharacterId; carId: CarId } | null = null;
  private status: MpConnectionStatus = 'disconnected';
  private rttMs: number | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private reconnectAttempts = 0;
  private disposed = false;
  private pendingQueue: ClientMessage[] = [];
  private inputSeq = 0;

  constructor(callbacks: MultiplayerClientCallbacks) {
    this.callbacks = callbacks;
  }

  public getClientId(): string | null {
    return this.clientId;
  }

  public connect(): void {
    if (this.disposed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');

      // Re-attach to active room automatically on reconnect
      if (this.currentRoomCode && this.currentProfile) {
        this.sendImmediate({
          type: 'join_room',
          roomCode: this.currentRoomCode,
          name: this.currentProfile.name,
          characterId: this.currentProfile.characterId,
          carId: this.currentProfile.carId,
          clientId: this.clientId ?? undefined,
        });
      }

      while (this.pendingQueue.length > 0) {
        const queued = this.pendingQueue.shift();
        if (queued) this.sendImmediate(queued);
      }

      if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendImmediate({ type: 'ping', t: performance.now() });
        }
      }, 4000);
    };

    ws.onmessage = (evt) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(evt.data)) as ServerMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case 'welcome': {
          if (!this.clientId) {
            this.clientId = msg.clientId;
          }
          this.callbacks.onWelcome?.(this.clientId);
          break;
        }
        case 'pong': {
          this.rttMs = Math.max(1, Math.round(performance.now() - msg.t));
          this.callbacks.onStatusChange(this.status, this.rttMs);
          break;
        }
        case 'room_joined': {
          this.currentRoomCode = msg.roomCode;
          this.callbacks.onRoomJoined(msg.roomCode, msg.mySlot, msg.lobby);
          break;
        }
        case 'lobby_update': {
          this.callbacks.onLobbyUpdate(msg.lobby);
          break;
        }
        case 'room_list': {
          this.callbacks.onRoomList(msg.rooms);
          break;
        }
        case 'race_state': {
          this.callbacks.onRaceState(msg);
          break;
        }
        case 'error': {
          this.callbacks.onError(msg.message);
          break;
        }
      }
    };

    ws.onclose = () => {
      if (this.pingTimer !== null) {
        window.clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      this.ws = null;
      this.setStatus('disconnected');

      if (!this.disposed && (this.currentRoomCode || this.pendingQueue.length > 0)) {
        const delay = Math.min(5000, 600 * Math.pow(1.6, this.reconnectAttempts));
        this.reconnectAttempts++;
        this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
      }
    };

    ws.onerror = () => {
      // handled in onclose
    };
  }

  private setStatus(next: MpConnectionStatus): void {
    this.status = next;
    this.callbacks.onStatusChange(next, this.rttMs);
  }

  private sendImmediate(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private sendOrQueue(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.pendingQueue.push(msg);
      this.connect();
    }
  }

  public listRooms(): void {
    this.sendOrQueue({ type: 'list_rooms' });
  }

  public createRoom(name: string, characterId: CharacterId, carId: CarId): void {
    this.currentProfile = { name, characterId, carId };
    this.sendOrQueue({
      type: 'create_room',
      name,
      characterId,
      carId,
      clientId: this.clientId ?? undefined,
    });
  }

  public joinRoom(roomCode: string, name: string, characterId: CharacterId, carId: CarId): void {
    this.currentProfile = { name, characterId, carId };
    this.sendOrQueue({
      type: 'join_room',
      roomCode: roomCode.trim().toUpperCase(),
      name,
      characterId,
      carId,
      clientId: this.clientId ?? undefined,
    });
  }

  public quickJoin(name: string, characterId: CharacterId, carId: CarId): void {
    this.currentProfile = { name, characterId, carId };
    this.sendOrQueue({
      type: 'quick_join',
      name,
      characterId,
      carId,
      clientId: this.clientId ?? undefined,
    });
  }

  public updateProfile(name: string, characterId: CharacterId, carId: CarId): void {
    this.currentProfile = { name, characterId, carId };
    if (!this.currentRoomCode) return;
    this.sendOrQueue({
      type: 'update_profile',
      name,
      characterId,
      carId,
    });
  }

  public setRaceConfig(config: Partial<RaceConfig>): void {
    if (!this.currentRoomCode) return;
    this.sendOrQueue({
      type: 'set_race_config',
      config,
    });
  }

  public startRace(): void {
    this.sendOrQueue({ type: 'start_race' });
  }

  public returnToLobby(): void {
    this.sendOrQueue({ type: 'return_lobby' });
  }

  public leaveRoom(): void {
    this.currentRoomCode = null;
    this.pendingQueue = [];
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendImmediate({ type: 'leave_room' });
    }
  }

  public sendInput(input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    useItem: boolean;
  }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.inputSeq++;
      this.sendImmediate({
        type: 'input',
        seq: this.inputSeq,
        ...input,
      });
    }
  }

  public dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.pingTimer !== null) window.clearInterval(this.pingTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
