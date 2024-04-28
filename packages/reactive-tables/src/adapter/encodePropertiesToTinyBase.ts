import { Primitive, TinyBaseFormattedType } from "@/adapter";

// We want to encode the original type as well when dealing with local tables, because we
// don't have a schema to rely on. And we don't care that much about the schema, because that's TypeScript types we want.
/**
 * Encode the properties of a record to a TinyBase-friendly format.
 *
 * This will serialize arrays (bigints, numbers, booleans) and record their type, as we can't store them inside a TinyBase table.
 *
 * @param propKeys The keys of the properties to encode.
 * @param propAttributes The properties to encode.
 * @returns
 */
export const encodePropertiesToTinyBase = (properties: Record<string, Primitive>): TinyBaseFormattedType => {
  const formattedProperties: TinyBaseFormattedType = {};

  // Go through each property (key-attribute pair)
  Object.entries(properties).forEach(([key, prop]) => {
    // Find its TypeScript type
    const propType = Array.isArray(prop) ? `${typeof prop[0]}[]` : typeof prop;

    // Serialize arrays (bigints, numbers, booleans), and turn bigints into strings
    formattedProperties[key] = (
      Array.isArray(prop)
        ? JSON.stringify(prop, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        : typeof prop === "bigint"
          ? prop.toString()
          : prop
    ) as TinyBaseFormattedType[keyof TinyBaseFormattedType];

    // Record type
    formattedProperties[`type__${key}`] = propType;
  });

  return formattedProperties;
};
