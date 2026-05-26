export type WSStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface BaseWSMessage {
  type: string;
  timestamp?: string;
}

export interface WSEchoMessage extends BaseWSMessage {
  type: 'echo';
  content: string;
}

export interface WSBroadcastMessage extends BaseWSMessage {
  type: 'broadcast';
  content: string;
  sender?: string;
}

export interface WSPingMessage extends BaseWSMessage {
  type: 'ping';
}

export interface WSPongMessage extends BaseWSMessage {
  type: 'pong';
}

export interface WSErrorMessage extends BaseWSMessage {
  type: 'error';
  code: number;
  content: string;
}

export type WSMessage =
  | WSEchoMessage
  | WSBroadcastMessage
  | WSPingMessage
  | WSPongMessage
  | WSErrorMessage;
