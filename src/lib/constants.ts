/**
 * List of metadata properties encoded as hex strings, to treat them differently in the store.
 *
 * Specifically, these properties do not need any encoding/decoding when stored with TinyBase, as they are treated as
 * strings.
 *
 * @category Tables
 */
export const metadataProperties = ["__staticData", "__encodedLengths", "__dynamicData"];

/**
 * List of local offchain properties, provided as utilities for storage, synchronization, and any internal purposes that can
 * enhance the developer experience.
 *
 * @category Tables
 */
export const localProperties = ["__lastSyncedAtBlock"];
