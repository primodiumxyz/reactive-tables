import { KeySchema, SchemaToPrimitives, ValueSchema } from "@latticexyz/protocol-parser";
import { Schema } from "@latticexyz/recs";
import { hexKeyTupleToEntity } from "@latticexyz/store-sync/recs";
import { SchemaAbiTypeToRecsType } from "@latticexyz/store-sync/src/recs/schemaAbiTypeToRecsType";
import { ContractComponent } from "src/network/types";
import { encodeAbiParameters } from "viem";

export function encodeEntity<S extends Schema, TKeySchema extends KeySchema>(
  component: ContractComponent<S, TKeySchema>,
  key: SchemaToPrimitives<TKeySchema>
) {
  const keySchema = component.metadata.keySchema;
  if (Object.keys(keySchema).length !== Object.keys(key).length) {
    throw new Error(
      `key length ${Object.keys(key).length} does not match key schema length ${Object.keys(keySchema).length}`
    );
  }
  return hexKeyTupleToEntity(
    Object.entries(keySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [key[keyName]]))
  );
}

export type ValueSchemaToRecsTypes<TValueSchema extends ValueSchema> = {
  [x in keyof TValueSchema]: SchemaAbiTypeToRecsType<TValueSchema[x]>;
};
