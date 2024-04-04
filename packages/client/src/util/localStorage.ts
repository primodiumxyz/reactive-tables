import { Hex } from "viem";
import { STORAGE_PREFIX } from "./constants";

export function findEntriesWithPrefix(prefix: string = STORAGE_PREFIX) {
  // Array to hold the matched entries
  const matchedEntries = [];

  // Define the prefix

  // Loop through all keys in local storage
  for (let i = 0; i < localStorage.length; i++) {
    // Get key at the current index
    const key = localStorage.key(i);
    if (!key) continue;

    // Check if the key starts with the specified prefix
    if (key.startsWith(prefix)) {
      // Splice content after the prefix
      const splicedContent = key.slice(prefix.length);

      // Retrieve the value
      const value = localStorage.getItem(key);

      if (!value) continue;
      // Add the spliced content and value to the array as an object
      matchedEntries.push({ publicKey: splicedContent, privateKey: value });
    }
  }
  return matchedEntries;
}

export function getPrivateKey(publicKey: Hex): Hex | undefined {
  const entry = localStorage.getItem(STORAGE_PREFIX + publicKey);
  if (!entry) return;
  return entry as Hex;
}
