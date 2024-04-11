# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.6.1](https://github.com/primodiumxyz/indexer/compare/v0.6.0...v0.6.1) (2024-03-05)


### Bug Fixes

* rpc filterLogs did not pipe address into fetch filter ([d34fd3c](https://github.com/primodiumxyz/indexer/commit/d34fd3c0db18879f1d397b02deb9ddfcffd2d809))





# [0.6.0](https://github.com/primodiumxyz/indexer/compare/v0.5.1...v0.6.0) (2024-03-02)


### Features

* use events emitter 3 for browser ([4e5b04d](https://github.com/primodiumxyz/indexer/commit/4e5b04d0b74ef7eac82ca3b20f0196ef8dd2a733))





## [0.5.1](https://github.com/primodiumxyz/mud-state-tools/compare/v0.5.0...v0.5.1) (2024-01-26)


### Bug Fixes

* return 200 on empty records ([6ce624a](https://github.com/primodiumxyz/mud-state-tools/commit/6ce624a0c7931b76567d85abbabaabb2c239d078))





# [0.5.0](https://github.com/primodiumxyz/mud-state-tools/compare/v0.4.3...v0.5.0) (2024-01-25)


### Bug Fixes

* tables type in `WriterRecsParams` ([2610f97](https://github.com/primodiumxyz/mud-state-tools/commit/2610f97032a5fa3745c86a5f28996aca7c5912f0))


### Features

* query decoded indexer with table id instead ([8a8719d](https://github.com/primodiumxyz/mud-state-tools/commit/8a8719d18dd17d2a9064829827e1cde010a024ac))





## [0.4.3](https://github.com/primodiumxyz/mud-state-tools/compare/v0.4.2...v0.4.3) (2024-01-23)


### Bug Fixes

* include now works with mult queries ([bee93a4](https://github.com/primodiumxyz/mud-state-tools/commit/bee93a4eeb198eac71b56c9be822b0f0dc929ca2))





## [0.4.2](https://github.com/primodiumxyz/mud-state-tools/compare/v0.4.1...v0.4.2) (2024-01-23)


### Bug Fixes

* remove old store-sync package import ([84b4b2b](https://github.com/primodiumxyz/mud-state-tools/commit/84b4b2bb2e149de20ff7c68bb3def4723f20e4f1))





## [0.4.1](https://github.com/primodiumxyz/mud-state-tools/compare/v0.4.0...v0.4.1) (2024-01-23)


### Bug Fixes

* check result for empty records before handling ([7dba793](https://github.com/primodiumxyz/mud-state-tools/commit/7dba7939f01715e99c127e310900bfd4720c425a))





# [0.4.0](https://github.com/primodiumxyz/mud-state-tools/compare/v0.3.2...v0.4.0) (2024-01-23)


### Features

* add on condition in include clause ([fd4015e](https://github.com/primodiumxyz/mud-state-tools/commit/fd4015e2b5add9b62d9aba65f4eb3f76f82156a1))





## [0.3.2](https://github.com/primodiumxyz/mud-state-tools/compare/v0.3.1...v0.3.2) (2024-01-19)


### Bug Fixes

* bundle d.ts file instead of including src ([fb1f925](https://github.com/primodiumxyz/mud-state-tools/commit/fb1f92505f331fea687450f8309752fcbfe6a5e2))





## [0.3.1](https://github.com/primodiumxyz/mud-state-tools/compare/v0.3.0...v0.3.1) (2024-01-19)


### Bug Fixes

* add preserve symlinks in tsconfig ([786dc21](https://github.com/primodiumxyz/mud-state-tools/commit/786dc219fa8c796326700578c3c1ed70680066db))





# [0.3.0](https://github.com/primodiumxyz/mud-state-tools/compare/v0.2.2...v0.3.0) (2024-01-18)


### Features

* add error callback to readers and expose in sync ([7ad0098](https://github.com/primodiumxyz/mud-state-tools/commit/7ad0098e7c65a21e6b5e286bad248a7fd86fc711))





## [0.2.2](https://github.com/primodiumxyz/mud-state-tools/compare/v0.2.1...v0.2.2) (2024-01-18)


### Bug Fixes

* NaN progress on matching to and from block, let errors bubble to client ([48747fa](https://github.com/primodiumxyz/mud-state-tools/commit/48747fac41e7c670873d8ec0d30ed64cc7eb0f08))





## [0.2.1](https://github.com/primodiumxyz/mud-state-tools/compare/v0.2.0...v0.2.1) (2024-01-17)


### Bug Fixes

* send on progress update after write ([e67c735](https://github.com/primodiumxyz/mud-state-tools/commit/e67c7358a1956bab63320e0753c727666584e4fa))





# [0.2.0](https://github.com/primodiumxyz/mud-state-tools/compare/v0.1.0...v0.2.0) (2024-01-17)


### Features

* add progress callback on start returning progress % ([f179140](https://github.com/primodiumxyz/mud-state-tools/commit/f179140474a04f67577ed5a459abe6316a3c8096))





# [0.1.0](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.8...v0.1.0) (2024-01-17)


### Bug Fixes

* include pr tag ([97b9f6b](https://github.com/primodiumxyz/mud-state-tools/commit/97b9f6bd3794c328d01a5acfb5a6b1a9c25ec4b3))


### Features

* add support to include records that match on key_bytes ([07aa6e7](https://github.com/primodiumxyz/mud-state-tools/commit/07aa6e7ee1ac2f4e97065dd8f9ee3139cde886ca))





## [0.0.8](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.7...v0.0.8) (2024-01-16)


### Bug Fixes

* bin should run from package dir ([6e34103](https://github.com/primodiumxyz/mud-state-tools/commit/6e34103b3e5aa9fe5c5870625f87b331f5815369))
* remove --amend to lerna publish ([fc7fbd7](https://github.com/primodiumxyz/mud-state-tools/commit/fc7fbd7b3c84c14cf0ae168c3d889fbf257b8724))





## [0.0.7](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.6...v0.0.7) (2024-01-16)


### Bug Fixes

* update build command to include all bind ([cd64efe](https://github.com/primodiumxyz/mud-state-tools/commit/cd64efe59010865e6954a8487415ecc99eb4b696))





## [0.0.6](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.5...v0.0.6) (2024-01-15)


### Bug Fixes

* update bin commands. Was script commands (oops) ([02c440e](https://github.com/primodiumxyz/mud-state-tools/commit/02c440e2f8e3c6dc8a5e8705b61b9765c1c74517))





## [0.0.5](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.4...v0.0.5) (2024-01-15)

**Note:** Version bump only for package @primodiumxyz/mud-state-tools





## [0.0.4](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.3...v0.0.4) (2024-01-15)


### Bug Fixes

* include tags in checkout for lerna ([0f086f4](https://github.com/primodiumxyz/mud-state-tools/commit/0f086f4d840d61505920bb7f455cae4644af18fc))





## 0.0.3 (2024-01-15)

**Note:** Version bump only for package @primodiumxyz/mud-state-tools





## [0.0.2](https://github.com/primodiumxyz/mud-state-tools/compare/v0.0.1...v0.0.2) (2024-01-15)


### Bug Fixes

* checkout first ([576c7d8](https://github.com/primodiumxyz/mud-state-tools/commit/576c7d8908a3ccce8a4ce38d91372de69b490a19))
* file path for docker build, pnpm publish command name ([fabf06d](https://github.com/primodiumxyz/mud-state-tools/commit/fabf06d7fd951fa6da2d18e52f0b2772296bc773))
* remove forge up in prepare script ([2954cd4](https://github.com/primodiumxyz/mud-state-tools/commit/2954cd451c5a74dc8adfca8d20d3067206144f11))
* target in Dockerfile ([21dca9b](https://github.com/primodiumxyz/mud-state-tools/commit/21dca9b38171400c812e0c1e173f2a4bc2a84b0f))
* update action path ([3052ee6](https://github.com/primodiumxyz/mud-state-tools/commit/3052ee6a7ca7f552fe347bcfc1eb14590fe5eefd))
* update yaml to checkout first ([778d5d1](https://github.com/primodiumxyz/mud-state-tools/commit/778d5d17b6c287ff84eb298e1cdef0737e602556))





## 0.0.1 (2024-01-15)

**Note:** Version bump only for package @primodiumxyz/mud-state-tools
