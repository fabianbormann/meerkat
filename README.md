# Meerkat

Meerkat aims to be a typescript bowser-based reimplementation of bugout: A browser-to-browser networking built on WebTorrent

<p align="center">

<img alt="Release" src="https://github.com/fabianbormann/meerkat/actions/workflows/release.yml/badge.svg?branch=main" />
<img alt="semantic-release: angular" src="https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release" />

</p>

## 🚀 Getting Started

### NPM

```zsh
npm i @fabianbormann/meerkat
```

### Broswer

```html
<script src="https://fabianbormann.github.io/meerkat/meerkat.min.js"></script>
<script>
  const meerkat = new Meerkat({  ... });
</script>
```

## 🤖 Use Meerkat as a Server

```js
import Meerkat from '@fabianbormann/meerkat';

const meerkat = new Meerkat({ seed: localStorage['bugout-demo-server-seed'] });
localStorage['meerkat-server-seed'] = meerkat.seed;

let connected = false;
meerkat.on('connections', (clients) => {
  if (clients === 0 && connected === false) {
    connected = true;
    console.log('[info]: server ready');
  }
  console.log(`[info]: ${clients} clients connected`);
});

meerkat.register('hello', (address, args, callback) => {
  console.log(
    `[info]: rpc call invoked by address ${address} into window.cardano`
  );
  callback('hello world');
});

console.log(`Share this address ${meerkat.address} with your clients`);
```

## 🥸 Use Meerkat as a Client

```js
import Meerkat from '@fabianbormann/meerkat';

const meerkat = new Meerkat({ identifier: 'YOUR_SERVER_ADDRESS' });

meerkat.on('server', () => {
  console.log('[info]: connected to server');
  meerkat.rpc('YOUR_SERVER_ADDRESS', 'hello', {}, (response) =>
    console.log(response)
  );
});
```
