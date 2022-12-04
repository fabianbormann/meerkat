import { Buffer } from 'buffer';
import { BufferData } from '../types';

/**
 * source:
 * https://github.com/webtorrent/node-bencode/tree/3b1e2afeadbe63ab8892be5baecc6616d1f2dc15 (MIT)
 *
 * Added typescript & browser support
 */

function digitCount(value: number) {
  // Add a digit for negative numbers, as the sign will be prefixed
  const sign = value < 0 ? 1 : 0;
  // Guard against negative numbers & zero going into log10(),
  // as that would return -Infinity
  value = Math.abs(Number(value || 1));
  return Math.floor(Math.log10(value)) + 1 + sign;
}

function getType(value: BufferData) {
  if (Buffer.isBuffer(value)) return 'buffer';
  if (ArrayBuffer.isView(value)) return 'arraybufferview';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Number) return 'number';
  if (value instanceof Boolean) return 'boolean';
  if (value instanceof Set) return 'set';
  if (value instanceof Map) return 'map';
  if (value instanceof String) return 'string';
  if (value instanceof ArrayBuffer) return 'arraybuffer';
  return typeof value;
}

export function encode(
  data: Buffer | Array<any> | String | Object | Number | Boolean,
  buffer?: Buffer,
  offset?: number
) {
  const buffers: Array<Buffer> = [];
  encode._encode(buffers, data);
  const result = Buffer.concat(buffers);
  encode.bytes = result.length;

  if (Buffer.isBuffer(buffer)) {
    result.copy(buffer, offset);
    return buffer;
  }

  return result;
}

encode.bytes = -1;
encode._floatConversionDetected = false;

encode._encode = function (buffers: Array<Buffer>, data: any) {
  if (data == null) {
    return;
  }

  switch (getType(data)) {
    case 'buffer':
      encode.buffer(buffers, data);
      break;
    case 'object':
      encode.dict(buffers, data);
      break;
    case 'map':
      encode.dictMap(buffers, data);
      break;
    case 'array':
      encode.list(buffers, data);
      break;
    case 'set':
      encode.listSet(buffers, data);
      break;
    case 'string':
      encode.string(buffers, data);
      break;
    case 'number':
      encode.number(buffers, data);
      break;
    case 'boolean':
      encode.number(buffers, data);
      break;
    case 'arraybufferview':
      encode.buffer(
        buffers,
        Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      );
      break;
    case 'arraybuffer':
      encode.buffer(buffers, Buffer.from(data));
      break;
  }
};

const buffE = Buffer.from('e');
const buffD = Buffer.from('d');
const buffL = Buffer.from('l');

encode.buffer = function (buffers: Buffer[], data: Buffer) {
  buffers.push(Buffer.from(data.length + ':'), data);
};

encode.string = function (buffers: Buffer[], data: string) {
  buffers.push(Buffer.from(Buffer.byteLength(data) + ':' + data));
};

encode.number = function (buffers: Buffer[], data: number) {
  const maxLo = 0x80000000;
  const hi = (data / maxLo) << 0;
  const lo = data % maxLo << 0;
  const val = hi * maxLo + lo;

  buffers.push(Buffer.from('i' + val + 'e'));

  if (val !== data && !encode._floatConversionDetected) {
    encode._floatConversionDetected = true;
    console.warn(
      'WARNING: Possible data corruption detected with value "' + data + '":',
      'Bencoding only defines support for integers, value was converted to "' +
        val +
        '"'
    );
    console.trace();
  }
};

encode.dict = function (buffers: Buffer[], data: any) {
  buffers.push(buffD);

  let j = 0;
  let k;
  // fix for issue #13 - sorted dicts
  const keys = Object.keys(data).sort();
  const kl = keys.length;

  for (; j < kl; j++) {
    k = keys[j];
    if (data[k] == null) continue;
    encode.string(buffers, k);
    encode._encode(buffers, data[k]);
  }

  buffers.push(buffE);
};

encode.dictMap = function (buffers: Buffer[], data: Map<any, any>) {
  buffers.push(buffD);

  const keys = Array.from(data.keys()).sort();

  for (const key of keys) {
    if (data.get(key) == null) continue;
    Buffer.isBuffer(key)
      ? encode._encode(buffers, key)
      : encode.string(buffers, String(key));
    encode._encode(buffers, data.get(key));
  }

  buffers.push(buffE);
};

encode.list = function (buffers: Buffer[], data: Array<any>) {
  let i = 0;
  const c = data.length;
  buffers.push(buffL);

  for (; i < c; i++) {
    if (data[i] == null) continue;
    encode._encode(buffers, data[i]);
  }

  buffers.push(buffE);
};

encode.listSet = function (buffers: Buffer[], data: any) {
  buffers.push(buffL);

  for (const item of data) {
    if (item == null) continue;
    encode._encode(buffers, item);
  }

  buffers.push(buffE);
};
