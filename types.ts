export interface Peer {
  publicKey: string;
  encryptedPublicKey: string;
  timestamp: number;
}

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
