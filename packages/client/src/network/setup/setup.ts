import { createComponents } from "../components";
import { createNetwork } from "./createNetwork";

export async function setup() {
  const network = await createNetwork();
  const components = createComponents(network);

  return {
    network,
    components,
  };
}
