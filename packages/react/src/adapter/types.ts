import { StoreEventsAbiItem, StoreEventsAbi } from "@latticexyz/store";
import { DynamicPrimitiveType, StaticPrimitiveType } from "@latticexyz/schema-type/internal";
import { UnionPick } from "@latticexyz/common/type-utils";
import { Hex, Log } from "viem";

import { createCustomWriter } from "@/adapter/createCustomWriter";

/* ------------------------------ CUSTOM WRITER ----------------------------- */
type StoreEventsLog = Log<bigint, number, false, StoreEventsAbiItem, true, StoreEventsAbi>;
export type StorageAdapterLog = Partial<StoreEventsLog> & UnionPick<StoreEventsLog, "address" | "eventName" | "args">;

export type StorageAdapter = ReturnType<typeof createCustomWriter>;

/* --------------------------------- DECODER -------------------------------- */
export type DecodedTinyBaseType =
  | {
      [key: string]: DynamicPrimitiveType | StaticPrimitiveType | Hex | undefined;
    }
  | undefined;

/* -------------------------------- FORMATTER ------------------------------- */
export type TinyBaseFormattedType = {
  [key: string]: //
  // actual storage properties
  | string
    | number
    | boolean
    // associated types
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "bigint[]"
    | "undefined"
    | "undefined[]";
};
export type PropertiesArray = readonly (StaticPrimitiveType | DynamicPrimitiveType | undefined)[];
