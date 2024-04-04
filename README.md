# tiny-base-integration

The setup should be exactly the same as for the Primodium repo (see [README.md](https://github.com/primodiumxyz/primodium/blob/main/README.md)).

Most packages non-related to the implementation are the same (`assets`, `contracts`, `engine`).

The modified packages are:

- `client`, which is stripped down to the bare minimum;
- `core` implements TinyBase and anything related to the network stack [as it should become](https://linear.app/primodium/issue/PRI-475/create-core-package);
- `indexer` is a copy of [the Primodium indexer](https://github.com/primodiumxyz/indexer/) for conveniently modifying the storage adapter.
