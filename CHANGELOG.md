# Changelog

## [1.0.17](https://github.com/fabianbormann/meerkat/compare/v1.0.16...v1.0.17) (2024-11-27)


### Features

* use dynamic imports to prevent meerkat from throwing errors in a non browser environment ([63a2c04](https://github.com/fabianbormann/meerkat/commit/63a2c04f97010fe09c0235ebd8bf837fe7df09da))

## [1.0.16](https://github.com/fabianbormann/meerkat/compare/v1.0.15...v1.0.16) (2024-03-12)


### Bug Fixes

* bump dependencies to their next versions and resolve security issues ([a37fab0](https://github.com/fabianbormann/meerkat/commit/a37fab00e4214533c9a7dab9a03297fbe05c4bb5))

## [1.0.15](https://github.com/fabianbormann/meerkat/compare/v1.0.14...v1.0.15) (2023-08-07)


### Bug Fixes

* update tracker list ([00f3cce](https://github.com/fabianbormann/meerkat/commit/00f3cce7741bd61c835a629afe0b44f82143ffd6))

## [1.0.14](https://github.com/fabianbormann/meerkat/compare/v1.0.13...v1.0.14) (2023-08-06)


### Bug Fixes

* solve non-base58 character error onExtendedHandshake ([8653c83](https://github.com/fabianbormann/meerkat/commit/8653c839bcd7d3eac08a740da3c9363ef18fa17e))

## [1.0.13](https://github.com/fabianbormann/meerkat/compare/v1.0.12...v1.0.13) (2023-08-05)


### Features

* add bundle pipeline to release the browser bundle to gh pages ([571c851](https://github.com/fabianbormann/meerkat/commit/571c851a236f1169d5bc32a0966c45ffcf823776))
* add cypress tests ([6b0e3ae](https://github.com/fabianbormann/meerkat/commit/6b0e3ae26fc783a842b281f3da4921c0e264580e))


### Bug Fixes

* update dependencies and update webpack build to make it work with the latest version. Remove jest, as the test pipeline was not working properly ([fdd8323](https://github.com/fabianbormann/meerkat/commit/fdd8323a014f6f98ef2011c3adde1848aa426513))

## [1.0.12](https://github.com/fabianbormann/meerkat/compare/v1.0.11...v1.0.12) (2023-03-24)


### Bug Fixes

* remove local storage from logger to allow meerkat to run in an environment without local storage ([d10bccc](https://github.com/fabianbormann/meerkat/commit/d10bccccc4adc89323675e707b7617bf0d4ce0b1))

## [1.0.11](https://github.com/fabianbormann/meerkat/compare/v1.0.10...v1.0.11) (2022-12-15)


### ⚠ BREAKING CHANGES

* connections event just returns a list of wire identifiers not all the wire information

### Features

* connections event just returns a list of wire identifiers not all the wire information ([c408ac5](https://github.com/fabianbormann/meerkat/commit/c408ac5f858bd34bb493a8f4ba42eacf82ba0af6))

## [1.0.10](https://github.com/fabianbormann/meerkat/compare/v1.0.9...v1.0.10) (2022-12-15)


### ⚠ BREAKING CHANGES

* event connection now returns the wires itself not only the count

### Features

* event connection now returns the wires itself not only the count ([8bb689c](https://github.com/fabianbormann/meerkat/commit/8bb689c394808b92ce41819370685c43f9c65abe))

## [1.0.9](https://github.com/fabianbormann/meerkat/compare/v1.0.8...v1.0.9) (2022-12-12)


### Bug Fixes

* provide bundle for browser import, fix default import ([dc1bbf7](https://github.com/fabianbormann/meerkat/commit/dc1bbf7b0d7e0e9184f2f886dc097d44c7deb955))

## [1.0.8](https://github.com/fabianbormann/meerkat/compare/v1.0.7...v1.0.8) (2022-12-10)


### Features

* add configurable logger instead of using console.log ([6f14556](https://github.com/fabianbormann/meerkat/commit/6f1455619a4846fe606bbfd401a711156b93e8b5))

## [1.0.7](https://github.com/fabianbormann/meerkat/compare/v1.0.6...v1.0.7) (2022-12-10)


### Bug Fixes

* resolve packet decryption issue ([f51e355](https://github.com/fabianbormann/meerkat/commit/f51e355d7c67628af2e2eae51139256121f1f2c5))

## [1.0.6](https://github.com/fabianbormann/meerkat/compare/v1.0.5...v1.0.6) (2022-12-09)


### Bug Fixes

* repair broken package-lock file ([7245588](https://github.com/fabianbormann/meerkat/commit/72455884e84d5119515deb204609c0206c97f55d))

## [1.0.5](https://github.com/fabianbormann/meerkat/compare/v1.0.4...v1.0.5) (2022-12-09)


### Features

* implement missing bugout features ([7f623da](https://github.com/fabianbormann/meerkat/commit/7f623da2bb3c0f7094288e1741d1c27646e21096))


### Bug Fixes

* add all missing type definitions ([245336f](https://github.com/fabianbormann/meerkat/commit/245336feb5f8f5106844ce3ce8f0ce53195516e8))
* add more type declarations for bencode and bugout functions ([250a05f](https://github.com/fabianbormann/meerkat/commit/250a05f0a37fee74d15c57f68f0db872f5358238))
* include type definitions ([335543b](https://github.com/fabianbormann/meerkat/commit/335543ba7341e664cfd70778e93dc03450627231))

## [1.0.4](https://github.com/fabianbormann/meerkat/compare/v1.0.3...v1.0.4) (2022-12-07)


### Bug Fixes

* almost working rollup bundle ([b36ed5a](https://github.com/fabianbormann/meerkat/commit/b36ed5a393f4410d05147ba6f3984f8cc234d38d))
* lib path ([07a86ab](https://github.com/fabianbormann/meerkat/commit/07a86ab2d47bfc3507bc3c5040c6fdfbc0b59834))
* remove rollup and use webpack instead to bring the browser build alive ([8f920f2](https://github.com/fabianbormann/meerkat/commit/8f920f2ea4db956c5c461ecf45a859876a876c4e))

## [1.0.3](https://github.com/fabianbormann/meerkat/compare/v1.0.2...v1.0.3) (2022-12-07)


### Bug Fixes

* browser rollup build ([ce86eab](https://github.com/fabianbormann/meerkat/commit/ce86eabc72f0e67f6cd9c3836de0946ed62efb30))

## [1.0.2](https://github.com/fabianbormann/meerkat/compare/v1.0.1...v1.0.2) (2022-12-06)


### Bug Fixes

* polyfills for stream and other builtins ([8839e4c](https://github.com/fabianbormann/meerkat/commit/8839e4cc23046ba73c23b11cbdc1cee91f5a213e))

## [1.0.1](https://github.com/fabianbormann/meerkat/compare/v1.0.0...v1.0.1) (2022-12-06)


### Bug Fixes

* change name to make sure that meerkat can be published to npmjs ([98a93d4](https://github.com/fabianbormann/meerkat/commit/98a93d476c7f77d2c27d8f051d61b66b491fc4e1))

## 1.0.0 (2022-12-05)


### Features

* add deployment pipeline ([6152948](https://github.com/fabianbormann/meerkat/commit/615294856d2a72c9c8a7db785f68c0822e1b204f))
* add meerkat.js and rollup build pipeline ([badce6b](https://github.com/fabianbormann/meerkat/commit/badce6bf9c47ef74825bd14fb3b5bfb92f375ae8))


### Bug Fixes

* add workflows dir ([d7638fe](https://github.com/fabianbormann/meerkat/commit/d7638feda30da0d17fb3308c00960a85f8f2675f))
* rollup build issues ([29fa237](https://github.com/fabianbormann/meerkat/commit/29fa23749d3af241ac82eb1000f8651cf029cf17))
