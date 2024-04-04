import { StaticAbiType } from "@latticexyz/schema-type/deprecated";
import { ConfigFieldTypeToPrimitiveType, StoreConfig } from "@latticexyz/store";
type Tables<C extends StoreConfig> = {
  [Table in keyof C["tables"]]?: {
    [Field in keyof C["tables"][Table]["schema"]]: ConfigFieldTypeToPrimitiveType<C["tables"][Table]["schema"][Field]>;
  };
};

export type PrototypeConfig<C extends StoreConfig> = {
  keys?: Record<string, StaticAbiType>;
  tables?: Tables<C>;
  levels?: Record<number, Tables<C>>;
};

export type PrototypesConfig<C extends StoreConfig> = Record<string, PrototypeConfig<C>>;

export type StoreConfigWithPrototypes = StoreConfig & {
  prototypes: PrototypesConfig<StoreConfig>;
};
