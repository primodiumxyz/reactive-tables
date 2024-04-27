export { TinyBaseAdapter } from "@/adapter";

export {
  // Decoding/encoding keys from/into a record
  decode$Record,
  encode$Record,
  // Get the properties schema from a contract table stored inside the TinyBase store at creation
  getPropertiesSchema,
  // Concat a tuple of hex keys into a single record
  hexKeyTupleTo$Record,
  // Convert a record into a tuple of hex keys
  $recordToHexKeyTuple,
  // Convert ABI types to TypeScript understandable types
  schemaAbiTypeToRecsType,
} from "@/lib";
