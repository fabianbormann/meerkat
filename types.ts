export interface Peer {
  publicKey: string;
  encryptedPublicKey: string;
  timestamp: number;
}

export type MeerkatParameters = {
  identifier?: string;
  announce?: Array<string>;
  seed?: string;
};

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
