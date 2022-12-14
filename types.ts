export interface Peer {
  publicKey: string;
  encryptedPublicKey: string;
  last: number;
}

export type Packet = {
  ek?: string;
  pk?: string;
  e?: Uint8Array;
  n?: Uint8Array;
  p?: Uint8Array;
  s?: Uint8Array;
  rn?: Uint8Array;
  rr?: Uint8Array;
  y?: string;
  t?: number;
  [key: string]: any;
};

export type MeerkatParameters = {
  identifier?: string;
  announce?: Array<string>;
  seed?: string;
  loggingEnabled?: boolean;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type BufferData =
  | Number
  | SetConstructor
  | MapConstructor
  | String
  | ArrayBuffer
  | Boolean
  | ArrayBufferView
  | Buffer
  | Uint8Array;
