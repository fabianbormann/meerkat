# Meerkat

<p align="left">
<img alt="Tests" src="https://img.shields.io/github/actions/workflow/status/fabianbormann/meerkat/test.yml?label=Release&style=for-the-badge" />
<img alt="Release" src="https://img.shields.io/github/actions/workflow/status/fabianbormann/meerkat/release.yml?label=Release&style=for-the-badge" />
<img alt="Bundle" src="https://img.shields.io/github/actions/workflow/status/fabianbormann/meerkat/bundle.yml?label=Release&style=for-the-badge" />
<a href="https://conventionalcommits.org"><img alt="conventionalcommits" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&style=for-the-badge" /></a>
</p>


Meerkat aims to be a typescript and webpack 5 friendly re-implementation of Bugout: A browser-to-browser networking built on WebTorrent

## 🚀 Getting Started

### NPM

```zsh
npm i @fabianbormann/meerkat
```

### Broswer

```html
<script src="https://fabianbormann.github.io/meerkat/latest/meerkat.min.js"></script>
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
