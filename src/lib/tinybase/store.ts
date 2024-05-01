import { createStore as createTinyBaseStore, type Store as TinyBaseStore } from "tinybase/store";
import { createQueries, type Queries as TinyBaseQueries } from "tinybase/queries";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
export type { TinyBaseStore, TinyBaseQueries }; // for more explicit types

/**
 * Defines a native non-persistent TinyBase store, appended with its associated queries object.
 *
 * @category Tables
 */
type BaseStore = TinyBaseStore & {
  getQueries: () => TinyBaseQueries;
};

/**
 * Defines a persistent TinyBase store, appended with its associated queries object, and additional methods to dispose of
 * the synchronization with the local storage and to check if the sync is ready.
 *
 * @category Tables
 */
type PersistentStore = BaseStore & {
  dispose: () => void;
  ready: Promise<boolean>;
};

/**
 * Defines a function that returns a TinyBase store, either a base store or a persistent store.
 *
 * Note: The persistent store is only available on the browser.
 *
 * Note: The persistent store can be used for storing properties inside a local table.
 *
 * @category Tables
 */
export type Store = {
  (): BaseStore;
  (key: "PERSIST"): PersistentStore;
};

// The local storage key for the persistent store's data
const STORAGE_KEY = "TINYBASE_STATE_MANAGER_PERSISTER";

/**
 * Creates a function that returns a TinyBase store, either a base store or a persistent store.
 *
 * @returns The {@link Store} function.
 * @see {@link BaseStore} and {@link PersistentStore} for additional methods.
 * @category Tables
 */
export const createStore = () => {
  // Create base store and queries object for contract and non-persistent local tables
  const store = createTinyBaseStore();
  const queries = createQueries(store);

  // Same for persistent tables
  // We don't want to setup the browser persister in node
  const isBrowser = typeof window !== "undefined";
  const getPersistentStore = (): PersistentStore => {
    if (!isBrowser) {
      throw new Error("Persistent store is only available on the browser");
    }

    const persistentStore = createTinyBaseStore();
    const persistentQueries = createQueries(persistentStore);

    // Setup the storage persister on local storage
    const persister = createLocalPersister(persistentStore, STORAGE_KEY, (err: unknown) => {
      console.warn("Error persisting state, some settings might no be saved correctly");
      console.error(err);
    });

    // Enable autosave and autoload
    // We don't want to make the whole wrapper async so we can just let the consumr know when it's ready
    (async () => {
      persistentStore.setValue("ready", false);
      await persister.startAutoLoad();
      await persister.startAutoSave();
      persistentStore.setValue("ready", true);
    })();

    return {
      ...persistentStore,
      getQueries: () => persistentQueries,
      dispose: () => persister.destroy(),
      // Return a promise that resolves when the store is ready
      ready: new Promise((resolve: (value: boolean) => void) => {
        // either if it's already ready
        if (persistentStore.getValue("ready")) resolve(true);

        // or listen to change on the ready value and resolve when it is
        const listener = persistentStore.addValueListener("ready", (_, __, ready) => {
          if (ready) {
            persistentStore.delListener(listener);
            resolve(true);
          }
        });
      }),
    };
  };

  function getStore(): BaseStore;
  function getStore(key: "PERSIST"): PersistentStore;
  function getStore(key?: "PERSIST"): BaseStore | PersistentStore {
    // Access the persistent store if the key is provided
    if (key === "PERSIST") {
      return getPersistentStore();
    } else {
      // Otherwise, return the regular store
      return {
        ...store,
        getQueries: () => queries,
      };
    }
  }

  return getStore;
};
