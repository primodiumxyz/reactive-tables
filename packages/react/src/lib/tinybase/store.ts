import { createQueries, Queries as TinyBaseQueries } from "tinybase/queries";
import { createStore as createTinyBaseStore, Store as TinyBaseStore } from "tinybase/store";
import { createLocalPersister } from "tinybase/persisters/persister-browser";
export { TinyBaseStore, TinyBaseQueries }; // for more explicit types

type BaseStore = TinyBaseStore & {
  getQueries: () => TinyBaseQueries;
};
type PersistentStore = BaseStore & {
  dispose: () => void;
  ready: Promise<boolean>;
};

export type Store = {
  (): BaseStore;
  (key: "PERSIST"): PersistentStore;
};

const STORAGE_KEY = "TINYBASE_STATE_MANAGER_PERSISTER";

export const createStore = () => {
  // Create base store and queries object for contract and non-persistent local tables
  const store = createTinyBaseStore();
  const queries = createQueries(store);

  // Same for persistent tables
  // We don't want to setup the browser persister in node
  const isBrowser = typeof window !== "undefined";
  const getPersistentStore = (): PersistentStore => {
    if (!isBrowser) {
      console.warn("Persistent store is not available in node");
      return {
        ...store,
        getQueries: () => queries,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
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
    // TODO: is this ok? Or should the wrapper just be async?
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
