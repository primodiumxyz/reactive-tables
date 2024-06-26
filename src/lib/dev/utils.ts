// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serialize = (obj: any) => {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  });
};
