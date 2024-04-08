# tiny-base-integration

Roughly we want to do that:
sync to zustand: https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/store-sync/src/zustand/syncToZustand.ts

And no need for the storage adapter, it's actually our custom writer (since sync is created with store-sync)
zustand storage adapter: https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/store-sync/src/zustand/createStorageAdapter.ts
