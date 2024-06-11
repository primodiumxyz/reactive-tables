import { queries as _queries, systems as _systems, tableOperations as _tableOperations } from "@/lib";
const tableOperations = _tableOperations();
const queries = _queries();
const systems = _systems();

export {
  // Decoding/encoding keys from/into an entity
  decodeEntity,
  encodeEntity,
  // Concat a tuple of hex keys into a single entity
  hexKeyTupleToEntity,
  // Convert an entity into a tuple of hex keys
  entityToHexKeyTuple,
  // Convert ABI types to TypeScript understandable types
  schemaAbiTypeToRecsType,
  // uuid
  uuid,
} from "@/lib";

// Storage adapter
export { StorageAdapterBlock, StorageAdapterLog } from "@/adapter";

export {
  // Direct access to MUD functionnalities
  tableOperations,
  queries,
  systems,
};
