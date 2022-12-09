import { Buffer } from 'buffer';
import type { BufferData, Packet } from '../types';

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

const INTEGER_START = 0x69; // 'i'
const STRING_DELIM = 0x3a; // ':'
const DICTIONARY_START = 0x64; // 'd'
const LIST_START = 0x6c; // 'l'
const END_OF_TYPE = 0x65; // 'e'

/**
 * replaces parseInt(buffer.toString('ascii', start, end)).
 * For strings with less then ~30 charachters, this is actually a lot faster.
 *
 * @param {Buffer} data
 * @param {Number} start
 * @param {Number} end
 * @return {Number} calculated number
 */
function getIntFromBuffer(buffer: Buffer, start: number, end: number) {
  let sum = 0;
  let sign = 1;

  for (let i = start; i < end; i++) {
    const num = buffer[i];

    if (num < 58 && num >= 48) {
      sum = sum * 10 + (num - 48);
      continue;
    }

    if (i === start && num === 43) {
      // +
      continue;
    }

    if (i === start && num === 45) {
      // -
      sign = -1;
      continue;
    }

    if (num === 46) {
      // .
      // its a float. break here.
      break;
    }

    throw new Error('not a number: buffer[' + i + '] = ' + num);
  }

  return sum * sign;
}

/**
 * Decodes bencoded data.
 *
 * @param  {Buffer} data
 * @param  {Number} start (optional)
 * @param  {Number} end (optional)
 * @param  {String} encoding (optional)
 * @return {Object|Array|Buffer|String|Number}
 */
export function decode(rawData: Buffer | Uint8Array): Packet {
  if (rawData == null || rawData.length === 0) {
    return {};
  }

  let position = 0;
  let data: Buffer;

  if (!Buffer.isBuffer(rawData)) {
    data = Buffer.from(rawData);
  } else {
    data = rawData;
  }

  const bytes = data.length;
  const next = (): { [key: string]: any } | Array<any> | number | string => {
    switch (data[position]) {
      case DICTIONARY_START:
        return decode_dictionary();
      case LIST_START:
        return decode_list();
      case INTEGER_START:
        return decode_integer();
      default:
        return decode_buffer();
    }
  };

  const find = function (chr: number) {
    let i = position;
    const c = data.length;
    const d = data;

    while (i < c) {
      if (d[i] === chr) return i;
      i++;
    }

    throw new Error(
      'Invalid data: Missing delimiter "' +
        String.fromCharCode(chr) +
        '" [0x' +
        chr.toString(16) +
        ']'
    );
  };

  const decode_buffer = (): string | Buffer | Uint8Array => {
    let sep = find(STRING_DELIM);
    const length = getIntFromBuffer(data, position, sep);
    const end = ++sep + length;

    position = end;

    return data.slice(sep, end);
  };

  const decode_dictionary = (): Object => {
    position++;
    const dict: { [key: string]: any } = {};

    while (data[position] !== END_OF_TYPE) {
      dict[decode_buffer().toString()] = next();
    }

    position++;
    return dict;
  };

  const decode_list = (): Array<any> => {
    position++;

    const lst = [];

    while (data[position] !== END_OF_TYPE) {
      lst.push(next());
    }

    position++;

    return lst;
  };

  const decode_integer = (): number => {
    const end = find(END_OF_TYPE);
    const number = getIntFromBuffer(data, position + 1, end);

    position += end + 1 - position;

    return number;
  };

  const raw = next();

  if (typeof raw !== 'object') {
    return {};
  } else {
    const packet: Packet = { ...raw };
    return packet;
  }
}
