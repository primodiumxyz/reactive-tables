import { BaseTableMetadata, OriginalTableMethods, Properties } from "@/tables";
import { CreateQueryResult, CreateQueryWrapperOptions } from "@/queries";
import { Metadata, $Record, Schema } from "@/lib";

export type LocalTable<
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  metadata extends LocalTableMetadata<S, M> = LocalTableMetadata<S, M>,
  T = unknown,
> = LocalTableMethods<S, T> & {
  readonly id: metadata["tableId"];
  readonly schema: metadata["schema"];
  readonly metadata: M & {
    readonly name: metadata["name"];
    readonly globalName: `internal__${metadata["name"]}`;
  };
};

export type LocalTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
  BaseTableMetadata<S> & {
    readonly namespace: "internal";
  };

// We pass the table to be able to infer if it's a contract or internal table (e.g. the latter won't contain metadata properties)
export type LocalTableMethods<S extends Schema, T = unknown> = OriginalTableMethods & {
  get(): Properties<S, T> | undefined;
  get($record: $Record | undefined): Properties<S, T> | undefined;
  get($record?: $Record | undefined, defaultProps?: Properties<S, T>): Properties<S, T>;

  set: (properties: Properties<S, T>, $record?: $Record) => void;
  getAll: () => $Record[];
  getAllWith: (properties: Partial<Properties<S, T>>) => $Record[];
  getAllWithout: (properties: Partial<Properties<S, T>>) => $Record[];
  useAll: () => $Record[];
  useAllWith: (properties: Partial<Properties<S, T>>) => $Record[];
  useAllWithout: (properties: Partial<Properties<S, T>>) => $Record[];
  remove: ($record?: $Record) => void;
  clear: () => void;
  update: (properties: Partial<Properties<S, T>>, $record?: $Record) => void;
  has: ($record?: $Record) => boolean;

  use($record?: $Record | undefined): Properties<S, T> | undefined;
  use($record: $Record | undefined, defaultProps?: Properties<S, T>): Properties<S, T>;

  pauseUpdates: ($record?: $Record, properties?: Properties<S, T>) => void;
  resumeUpdates: ($record?: $Record) => void;

  createQuery: (options: Omit<CreateQueryWrapperOptions<S, T>, "queries" | "tableId" | "schema">) => CreateQueryResult;
};
