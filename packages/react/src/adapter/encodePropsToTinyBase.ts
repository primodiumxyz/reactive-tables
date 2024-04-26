import { PropertiesArray, TinyBaseFormattedType } from "@/adapter";

// We want to encode the original type as well when dealing with local tables, because we
// don't have a schema to rely on. And we don't care that much about the schema, because that's TypeScript types we want.
export const encodePropsToTinyBase = (
  propKeys: string[],
  propAttributes: PropertiesArray = [],
): TinyBaseFormattedType => {
  const formattedProperties: TinyBaseFormattedType = {};

  propAttributes.forEach((prop, i) => {
    const key = propKeys[i];
    const propType = Array.isArray(prop) ? `${typeof prop[0]}[]` : typeof prop;

    // Serialize arrays (bigints, numbers, booleans)
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
