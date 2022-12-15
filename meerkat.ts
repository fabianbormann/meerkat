import nacl from 'tweetnacl';
import type { SignKeyPair, BoxKeyPair } from 'tweetnacl';
import bs58check from 'bs58check';
import { Buffer } from 'buffer';
import WebTorrent from 'webtorrent';
import type { Wire, ExtensionConstructor } from 'bittorrent-protocol';
import bs58 from 'bs58';
import ripemd160 from 'ripemd160';
import type { LogLevel, MeerkatParameters, Packet, Peer } from './types';
import EventEmitter from 'events';
import {
  encode as bencode_encode,
  decode as bencode_decode,
} from './lib/bencode';
const PEER_TIMEOUT = 5 * 60 * 1000;
const EXT = 'bo_channel';
import Logger from './logger';

export default class Meerkat extends EventEmitter {
  announce: Array<String>;
  webTorrent: any;
  seed: string;
  torrent: any = null;
  torrentCreated: boolean = false;
  keyPair: SignKeyPair;
  keyPairEncrypt: BoxKeyPair;
  publicKey: string;
  encryptedPublicKey: string;
  identifier: string;
  peers: { [key: string]: Peer } = {};
  seen: { [key: string]: number } = {};
  lastwirecount: any;
  api: { [key: string]: Function } = {};
  callbacks: { [key: string]: Function } = {};
  serveraddress: any = null;
  heartbeattimer: any = null;
  logLevel: number = 10;
  logger: Logger;

  constructor(parameters: MeerkatParameters = {}) {
    super();
    const { identifier, announce, seed, loggingEnabled } = parameters;
    this.logger = new Logger({ scope: 'Meerkat', enabled: loggingEnabled });

    this.announce = announce || [
      'wss://tracker.files.fm:7073/announce',
      'wss://tracker.btorrent.xyz',
      'ws://tracker.files.fm:7072/announce',
      'wss://tracker.openwebtorrent.com:443/announce',
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

    this.logger.debug(`Meerkat address: ${this.identifier}`);
    this.lastwirecount = null;

    this.webTorrent = new WebTorrent({});

    this.torrent = this.webTorrent.seed(
      Buffer.from(this.identifier),
      {
        name: this.identifier,
        announce: this.announce,
      },
      () => {
        this.emit('torrent', this.identifier, this.torrent);
        if (this.torrent.discovery.tracker) {
          this.torrent.discovery.tracker.on('update', (update: any) => {
            this.emit('tracker', this.identifier, update);
          });
        }
        this.torrent.discovery.on('trackerAnnounce', () => {
          this.emit('announce', this.identifier);
          this.connections();
        });
      }
    );
    this.torrentCreated = true;
    this.torrent.on('wire', (wire: Wire) => this.attach(wire));
  }

  disableLogging() {
    this.logger.disable();
  }

  enableLogging() {
    this.logger.enable();
  }

  setLogLevel(logLevel: LogLevel) {
    this.logger.logLevel = logLevel;
  }

  attach(wire: Wire) {
    wire.use(this.extension(wire));
    wire.on('close', () => this.detach(wire));
  }

  detach(wire: Wire) {
    this.emit('wireleft', this.torrent.wires.length, wire);
    this.connections();
  }

  extension(wire: Wire): ExtensionConstructor {
    const WireExtension: any = ((
      identifier: string,
      publicKey: string,
      encryptedPublicKey: string
    ): any => {
      return function (this: any, wire: Wire) {
        wire.extendedHandshake.identifier = identifier;
        wire.extendedHandshake.publicKey = publicKey;
        wire.extendedHandshake.encryptedPublicKey = encryptedPublicKey;
        this.wire = wire;
      };
    })(this.identifier, this.publicKey, this.encryptedPublicKey);

    WireExtension.prototype.name = EXT;
    WireExtension.prototype.onExtendedHandshake = (handshake: {
      [key: string]: any;
    }) => this.onExtendedHandshake(wire, handshake);
    WireExtension.prototype.onMessage = (buffer: Buffer) =>
      this.onMessage(buffer);

    return WireExtension;
  }

  onMessage(message: Buffer) {
    const hash = Meerkat.toHex(nacl.hash(message).slice(16));
    const now = new Date().getTime();

    if (!this.seen[hash]) {
      let unpacked: Packet | null = bencode_decode(message);

      if (unpacked.e && unpacked.n && unpacked.ek) {
        const ek = unpacked.ek.toString();
        const decrypted = nacl.box.open(
          unpacked.e,
          unpacked.n,
          bs58.decode(ek),
          this.keyPairEncrypt.secretKey
        );

        if (decrypted) {
          unpacked = bencode_decode(decrypted);
        } else {
          unpacked = null;
        }
      }

      if (unpacked && unpacked.p && unpacked.s) {
        const wrappedPacket = bencode_encode(unpacked.p);
        const packet = bencode_decode(wrappedPacket);

        if (
          typeof packet.pk !== 'undefined' &&
          typeof packet.ek !== 'undefined' &&
          typeof packet.t !== 'undefined' &&
          typeof packet.i !== 'undefined'
        ) {
          const pk = packet.pk.toString();
          const id = packet.i.toString();
          const packetType = packet.y ? packet.y.toString() : '';

          const checksig = nacl.sign.detached.verify(
            wrappedPacket,
            unpacked.s,
            bs58.decode(pk)
          );
          const checkid = id === this.identifier;
          const checktime = packet.t + PEER_TIMEOUT > now;

          if (checksig && checkid && checktime) {
            const ek = packet.ek.toString();
            this.sawPeer(pk, ek);

            if (packetType == 'm') {
              const messagestring = packet.v.toString();
              let messagejson = null;
              try {
                messagejson = JSON.parse(messagestring);
              } catch (e) {
                this.logger.warn(e);
              }
              if (messagejson) {
                this.emit('message', this.address(pk), messagejson, packet);
              }
            } else if (packetType == 'r') {
              // rpc call
              const call = packet.c.toString();
              const argsstring = packet.a.toString();
              let args: { [key: string]: any } | null;
              try {
                args = JSON.parse(argsstring);
              } catch (e) {
                args = null;
                this.logger.error(`Malformed args JSON: ${argsstring}`);
              }
              const nonce = packet.rn || new Uint8Array();
              this.emit(
                'rpc',
                this.address(pk),
                call,
                args,
                Meerkat.toHex(nonce)
              );
              // make the API call and send back response
              this.rpcCall(pk, call, args, nonce);
            } else if (packetType === 'rr') {
              // rpc response
              const nonce = Meerkat.toHex(packet.rn);
              if (this.callbacks[nonce]) {
                let responsestring: string = '';
                let responsestringstruct:
                  | { [key: string]: any }
                  | undefined
                  | null;

                if (typeof packet['rr'] !== 'undefined') {
                  responsestring = packet.rr.toString();
                } else {
                  this.logger.debug('Empty rr in rpc response.');
                }

                try {
                  responsestringstruct = JSON.parse(responsestring);
                } catch (e) {
                  this.logger.error(
                    'Malformed response JSON: ' + responsestring
                  );
                  responsestringstruct = null;
                }

                if (this.callbacks[nonce] && responsestringstruct) {
                  this.logger.debug(
                    'rpc-response',
                    this.address(pk),
                    nonce,
                    responsestringstruct
                  );
                  this.emit(
                    'rpc-response',
                    this.address(pk),
                    nonce,
                    responsestringstruct
                  );
                  this.callbacks[nonce](responsestringstruct);
                  delete this.callbacks[nonce];
                } else {
                  this.logger.debug('RPC response nonce not known:', nonce);
                }
              } else {
                this.logger.debug('dropped response with no callback.', nonce);
              }
            } else if (packetType === 'p') {
              const address = this.address(pk);
              this.logger.debug('ping from', address);
              this.emit('ping', address);
            } else if (packetType === 'x') {
              const address = this.address(pk);
              this.logger.debug('got left from', address);
              delete this.peers[address];
              this.emit('left', address);
            } else {
              // TODO: handle ping/keep-alive message
              this.logger.warn('unknown packet type');
            }
          } else {
            this.logger.warn(
              'dropping bad packet',
              hash,
              checksig,
              checkid,
              checktime
            );
          }
        } else {
          this.logger.debug('skipping packet with no payload', hash, unpacked);
        }
      } else {
        this.logger.debug('packet has no payload', hash, unpacked);
      }
      // forward first-seen message to all connected wires
      // TODO: block flooders
      this.sendRaw(message);
    } else {
      this.logger.debug('already seen', hash);
    }
    // refresh last-seen timestamp on this message
    this.seen[hash] = now;
  }

  onExtendedHandshake(wire: Wire, handshake: { [key: string]: any }) {
    this.emit('wireseen', this.torrent.wires.length, wire);
    this.connections();
    // TODO: check sig and drop on failure - wire.peerExtendedHandshake
    this.sawPeer(
      handshake.publicKey.toString(),
      handshake.encryptedPublicKey.toString()
    );
  }

  register(name: string, callback: Function) {
    this.api[name] = callback;
  }

  rpc(
    address: string,
    call: string,
    args: { [key: string]: any } = {},
    callback: Function = () => {}
  ) {
    if (this.peers[address]) {
      const publicKey = this.peers[address].publicKey;
      var callnonce = nacl.randomBytes(8);
      this.callbacks[Meerkat.toHex(callnonce)] = callback;
      this.makeEncryptSendPacket(publicKey, {
        y: 'r',
        c: call,
        a: JSON.stringify(args),
        rn: callnonce,
      });
    } else {
      throw address + ' not seen - no public key.';
    }
  }

  rpcCall(
    publicKey: string,
    call: string,
    args: { [key: string]: any } | null,
    nonce: Uint8Array
  ) {
    const packet = { y: 'rr', rn: nonce, rr: '' };
    if (this.api[call]) {
      this.api[call](this.address(publicKey), args, (result: Object) => {
        packet['rr'] = JSON.stringify(result);
        this.makeEncryptSendPacket(publicKey, packet);
      });
    } else {
      packet['rr'] = JSON.stringify({ error: 'No such API call.' });
      this.makeEncryptSendPacket(publicKey, packet);
    }
  }

  makeEncryptSendPacket(publicKey: string, packetObject: Object) {
    const packet = this.makePacket(packetObject);
    const encryptedPacket = this.encryptPacket(publicKey, packet);
    this.sendRaw(encryptedPacket);
  }

  encryptPacket(publicKey: string, packet: Buffer) {
    if (this.peers[this.address(publicKey)]) {
      var nonce = nacl.randomBytes(nacl.box.nonceLength);
      packet = bencode_encode({
        n: nonce,
        ek: bs58.encode(Buffer.from(this.keyPairEncrypt.publicKey)),
        e: nacl.box(
          packet,
          nonce,
          bs58.decode(this.peers[this.address(publicKey)].encryptedPublicKey),
          this.keyPairEncrypt.secretKey
        ),
      });
    } else {
      throw this.address(publicKey) + ' not seen - no encryption key.';
    }
    return packet;
  }

  sawPeer(publicKey: string, encryptedPublicKey: string) {
    var now = new Date().getTime();
    var address = this.address(publicKey);
    // ignore ourself
    if (address != this.address()) {
      // if we haven't seen this peer for a while
      if (
        !this.peers[address] ||
        this.peers[address].last + PEER_TIMEOUT < now
      ) {
        this.peers[address] = {
          encryptedPublicKey: encryptedPublicKey,
          publicKey: publicKey,
          last: now,
        };

        this.emit('seen', this.address(publicKey));
        if (this.address(publicKey) == this.identifier) {
          this.serveraddress = address;
          this.emit('server', this.address(publicKey));
        }
        // send a ping out so they know about us too
        var packet = this.makePacket({ y: 'p' });
        this.sendRaw(packet);
      } else {
        this.peers[address].encryptedPublicKey = encryptedPublicKey;
        this.peers[address].last = new Date().getTime();
      }
    }
  }

  connections() {
    if (this.torrent.wires.length != this.lastwirecount) {
      this.lastwirecount = this.torrent.wires.length;
      this.emit('connections', this.torrent.wires);
    }
    return this.lastwirecount;
  }

  close() {
    const packet = this.makePacket({ y: 'x' });
    this.sendRaw(packet);

    if (typeof this.webTorrent !== 'undefined' && this.torrentCreated) {
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

  private static toHex(uint8Array?: Uint8Array) {
    if (typeof uint8Array === 'undefined') {
      return '';
    }
    return Buffer.from(uint8Array).toString('hex');
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

    const encodedPacket = bencode_encode(packet);
    return bencode_encode({
      s: nacl.sign.detached(encodedPacket, this.keyPair.secretKey),
      p: packet,
    });
  }

  encodeAddress(address: Uint8Array) {
    const ADDRESSPREFIX = '55';

    return bs58check.encode(
      Buffer.concat([
        Buffer.from(ADDRESSPREFIX, 'hex'),
        new ripemd160().update(Buffer.from(nacl.hash(address))).digest(),
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
