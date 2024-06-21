export {
  // Decoding/encoding keys from/into an entity
  decodeEntity,
  encodeEntity,
  // Convert an entity into a tuple of hex keys
  entityToHexKeyTuple,
  // Concat a tuple of hex keys into a single entity
  hexKeyTupleToEntity,
  // symbol <-> entity
  getEntityHex,
  getEntitySymbol,
  // MUD common
  hexToResource,
  resourceToLabel,
  resourceToHex,
  readHex,
  spliceHex,
  // Convert ABI types to TypeScript understandable types
  schemaAbiTypeToRecsType,
  // Other schema utilities
  schemaAbiTypes,
  staticAbiTypes,
  // uuid
  uuid,
  // Direct access to MUD functionnalities
  tableOperations,
  queries,
  systems,
} from "@/lib";

// Schema types
export type {
  MappedType,
  SchemaAbiType,
  SchemaToPrimitives,
  StaticAbiType,
  // MUD common
  ResourceLabel,
} from "@/lib";

export {
  // Schema utilities
  encodeField,
  // Storage adapter
  type StorageAdapterBlock,
  type StorageAdapterLog,
} from "@/adapter";
