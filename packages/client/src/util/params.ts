export function convertParamsToObj(paramString: string): Record<string, string> {
  // Remove the initial '?' if present
  if (paramString.startsWith("?")) {
    paramString = paramString.slice(1);
  }

  // Split the string into key-value pairs
  const pairs = paramString.split("&");

  // Convert the pairs to an object
  const params: Record<string, string> = {};
  pairs.forEach((pair) => {
    if (!pair) return;
    const [key, value] = pair.split("=");
    if (!key) return;
    params[key] = value;
  });

  return params;
}

export function convertObjToParams(obj: Record<string, string>) {
  // Convert each key-value pair into a string and join them with '&'
  const paramString = Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join("&");

  return "?" + paramString;
}
