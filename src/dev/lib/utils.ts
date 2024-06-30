import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { Type, type Properties, type Schema } from "@/lib/external/mud/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serialize = (obj: any) => {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  });
};

export const parseProperties = <PS extends Schema, T = unknown>(
  obj: Record<string, string>,
  propertiesSchema: PS,
): Properties<PS, T> => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      switch (propertiesSchema[key]) {
        case Type.BigInt:
        case Type.OptionalBigInt:
          return [key, BigInt(value)];
        case Type.BigIntArray:
        case Type.OptionalBigIntArray:
          return [key, value.split(",").map(BigInt)];
        case Type.T:
        case Type.OptionalT:
          return [key, JSON.parse(value)];
        case Type.Number:
        case Type.OptionalNumber:
          return [key, Number(value)];
        case Type.NumberArray:
        case Type.OptionalNumberArray:
          return [key, value.split(",").map(Number)];
        case Type.Boolean:
        case Type.OptionalBoolean:
          return [key, value === "true"];
        default:
          return [key, value];
      }
    }),
  ) as Properties<PS, T>;
};

export const stringifyProperties = <PS extends Schema, T = unknown>(
  properties: Properties<PS, T>,
  propertiesSchema: PS,
): Record<string, string> => {
  return Object.fromEntries(
    Object.keys(propertiesSchema).map((name) => {
      const fieldValue = properties[name];
      const fieldValueString =
        propertiesSchema[name] === Type.T
          ? serialize(fieldValue)
          : Array.isArray(fieldValue)
            ? fieldValue.map(String).join(", ")
            : String(fieldValue);

      return [name, fieldValueString];
    }),
  );
};

export const useCopyCell = () => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const copyToClipboard = (content: string | Record<string, string>, cellId: string) => {
    navigator.clipboard.writeText(content instanceof Object ? JSON.stringify(content) : content);
    setCopiedCell(cellId);
  };

  const getCellAttributes = (content: string | Record<string, string>, cellId: string, className?: string) => {
    return {
      className: twMerge(
        "px-1 whitespace-nowrap overflow-auto hover:bg-base-700 cursor-pointer",
        copiedCell === cellId && "bg-green-light hover:bg-green-light",
        className,
      ),
      onClick: () => copyToClipboard(content, cellId),
    };
  };

  useEffect(() => {
    if (copiedCell) {
      const timer = setTimeout(() => {
        setCopiedCell(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [copiedCell]);

  return { copiedCell, copyToClipboard, getCellAttributes };
};
