import clientComponents from "./components/clientComponents";
import { extendContractComponents } from "./components/customComponents/extendComponents";
import { CreateNetworkResult } from "./types";

export let components: Components;

type Components = ReturnType<typeof createComponents>;

export function createComponents({ components: rawContractComponents }: CreateNetworkResult) {
  const contractComponents = extendContractComponents(rawContractComponents);

  const comps = {
    ...contractComponents,
    ...clientComponents,
  };
  components = comps;
  return comps;
}
