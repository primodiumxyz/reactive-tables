import { type Hex, concatHex, hexToString, sliceHex, stringToHex } from "viem";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionKeys<T> = T extends any ? keyof T : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionPick<T, K extends UnionKeys<T>> = T extends any ? Pick<T, Extract<K, keyof T>> : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReverseMap<T extends Record<any, any>> = { [K in keyof T as T[K]]: K };

/* -------------------------------------------------------------------------- */
/*                                  RESOURCE                                  */
/* -------------------------------------------------------------------------- */

type ResourceType = (typeof resourceTypes)[number];
type Resource = {
  readonly resourceId: Hex;
  readonly type: ResourceType;
  readonly namespace: string;
  readonly name: string;
};

export const resourceTypes = ["table", "offchainTable", "namespace", "module", "system"] as const;
export const resourceTypeIds = {
  // keep these in sync with storeResourceTypes.sol
  table: "tb",
  offchainTable: "ot",
  // keep these in sync with worldResourceTypes.sol
  namespace: "ns",
  module: "md",
  system: "sy",
} as const satisfies Record<ResourceType, string>;

const resourceTypeIdToType = Object.fromEntries(
  Object.entries(resourceTypeIds).map(([key, value]) => [value, key]),
) as ReverseMap<typeof resourceTypeIds>;

function getResourceType(resourceTypeId: string): ResourceType | undefined {
  // TODO: replace Partial with `noUncheckedIndexedAccess`
  const type = (resourceTypeIdToType as Partial<Record<string, ResourceType>>)[resourceTypeId];
  if (resourceTypes.includes(type as ResourceType)) {
    return type;
  }
}

export function hexToResource(hex: Hex): Resource {
  const resourceTypeId = hexToString(sliceHex(hex, 0, 2)).replace(/\0+$/, "");
  const type = getResourceType(resourceTypeId);
  const namespace = hexToString(sliceHex(hex, 2, 16)).replace(/\0+$/, "");
  const name = hexToString(sliceHex(hex, 16, 32)).replace(/\0+$/, "");

  if (!type) {
    throw new Error(`Unknown type (${resourceTypeId}) for resource (${resourceToLabel({ namespace, name })})`);
  }

  return { resourceId: hex, type, namespace, name };
}

export function resourceToHex(resource: Omit<Resource, "resourceId">): Hex {
  const typeId = resourceTypeIds[resource.type];
  return concatHex([
    stringToHex(typeId, { size: 2 }),
    stringToHex(resource.namespace.slice(0, 14), { size: 14 }),
    stringToHex(resource.name.slice(0, 16), { size: 16 }),
  ]);
}

const rootNamespace = "";

export type ResourceLabel<
  namespace extends string = string,
  name extends string = string,
> = namespace extends typeof rootNamespace ? name : `${namespace}__${name}`;

export function resourceToLabel<namespace extends string, name extends string>({
  namespace,
  name,
}: {
  readonly namespace: namespace;
  readonly name: name;
}): ResourceLabel<namespace, name> {
  return (namespace === rootNamespace ? name : `${namespace}__${name}`) as ResourceLabel<namespace, name>;
}

/* -------------------------------------------------------------------------- */
/*                                     HEX                                    */
/* -------------------------------------------------------------------------- */

export function readHex(data: Hex, start: number, end?: number): Hex {
  return `0x${data
    .replace(/^0x/, "")
    .slice(start * 2, end != null ? end * 2 : undefined)
    .padEnd(((end ?? start) - start) * 2, "0")}`;
}

export function spliceHex(data: Hex, start: number, deleteCount = 0, newData: Hex = "0x"): Hex {
  return concatHex([readHex(data, 0, start), newData, readHex(data, start + deleteCount)]);
}
