import * as nacl from 'tweetnacl';
import * as bs58check from 'bs58check';
import { Buffer } from 'buffer';
import WebTorrent from 'webtorrent';
import * as bs58 from 'bs58';
import * as ripemd160 from 'ripemd160';
import { Peer } from './types';
import { EventEmitter } from 'events';
import * as bencode from './lib/bencode';

const PEER_TIMEOUT = 5 * 60 * 1000;
const EXT = 'bo_channel';

export default class Meerkat extends EventEmitter {
  announce: Array<String>;
  webTorrent: any;
  seed: string;
  torrent: any;
  torrentCreated: boolean;
  keyPair: nacl.SignKeyPair;
  keyPairEncrypt: nacl.BoxKeyPair;
  publicKey: string;
  encryptedPublicKey: string;
  identifier: string;
  peers: Array<Peer> = [];
  seen = {};
  lastwirecount: any;
  api = {};
  callbacks = {};
  serveraddress: any = null;
  heartbeattimer: any = null;

  constructor(identifier?: string, announce?: Array<string>, seed?: string) {
    super();

    this.announce = announce || [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.tracker.cl:1337/announce',
      'udp://opentracker.i2p.rocks:6969/announce',
      'https://opentracker.i2p.rocks:443/announce',
      'wss://tracker.files.fm:7073/announce',
      'wss://spacetradersapi-chatbox.herokuapp.com:443/announce',
      'ws://tracker.files.fm:7072/announce',
    ];
    this.seed = seed || this.encodeseed(nacl.randomBytes(32));

    this.keyPair = nacl.sign.keyPair.fromSeed(
      Uint8Array.from(bs58check.decode(this.seed)).slice(2)
    );
    this.keyPairEncrypt = nacl.box.keyPair();

    this.publicKey = bs58.encode(Buffer.from(this.keyPair.publicKey));
    this.encryptedPublicKey = bs58.encode(
      Buffer.from(this.keyPairEncrypt.publicKey)
    );

    this.identifier = identifier || this.address();
    this.lastwirecount = null;

    this.webTorrent = new WebTorrent();
    this.torrent = this.webTorrent.seed(
      Buffer.from(this.identifier),
      { name: this.identifier, announce: this.announce },
      () => {
        console.log('onTorrent !!!');
        this.emit('torrent', this.identifier, this.torrent);

        if (this.torrent.discovery.tracker) {
          this.torrent.discovery.tracker.on('update', (update: any) => {
            this.emit('tracker', this.identifier, update);
          });
        }

        this.torrent.discovery.on('trackerAnnounce', () => {
          console.log('trackerAnnounce!!!');
          this.emit('announce', this.identifier);
          this.connections();
        });
      }
    );

    this.torrentCreated = true;
    //this.torrent.on("wire", this.attach(this, this.identifier));
  }

  connections() {
    if (this.torrent.wires.length != this.lastwirecount) {
      this.lastwirecount = this.torrent.wires.length;
      this.emit('connections', this.torrent.wires.length);
    }
    return this.lastwirecount;
  }

  close() {
    const packet = this.makePacket({ y: 'x' });
    this.sendRaw(packet);

    if (this.webTorrent && this.torrentCreated) {
      this.webTorrent.remove(this.torrent);
    }
  }

  private sendRaw(message: Buffer) {
    const wires = this.torrent.wires;
    for (const wire of wires) {
      const extendedhandshake = wire['peerExtendedHandshake'];
      if (
        extendedhandshake &&
        extendedhandshake.m &&
        extendedhandshake.m[EXT]
      ) {
        wire.extended(EXT, message);
      }
    }
  }

  private static toHex(uint8Array: Uint8Array) {
    Buffer.from(uint8Array).toString('hex');
  }

  private makePacket(params: object) {
    const packet = {
      ...params,
      t: new Date().getTime(),
      i: this.identifier,
      pk: this.publicKey,
      ek: this.encryptedPublicKey,
      n: nacl.randomBytes(8),
    };

    const encodedPacket = bencode.encode(packet);
    return bencode.encode({
      s: nacl.sign.detached(encodedPacket, this.keyPair.secretKey),
      p: packet,
    });
  }

  encodeAddress(address: Uint8Array) {
    const ADDRESSPREFIX = '55';

    return bs58check.encode(
      Buffer.concat([
        Buffer.from(ADDRESSPREFIX, 'hex'),
        new ripemd160.default()
          .update(Buffer.from(nacl.hash(address)))
          .digest(),
      ])
    );
  }

  address(publicKey?: string) {
    let decodedPublicKey: Uint8Array;
    if (typeof publicKey == 'string') {
      decodedPublicKey = bs58.decode(publicKey);
    } else {
      decodedPublicKey = this.keyPair.publicKey;
    }
    return this.encodeAddress(decodedPublicKey);
  }

  heartbeat(heartbeat: any) {
    throw new Error('Method not implemented.');
  }

  encodeseed(randomBytes: Uint8Array): string {
    const SEEDPREFIX = '490a';

    return bs58check.encode(
      Buffer.concat([Buffer.from(SEEDPREFIX, 'hex'), Buffer.from(randomBytes)])
    );
  }
}
