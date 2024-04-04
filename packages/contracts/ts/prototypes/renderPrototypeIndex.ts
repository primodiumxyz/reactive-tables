import { renderedSolidityHeader } from "@latticexyz/common/codegen";
import { StoreConfig } from "@latticexyz/store";
import { PrototypesConfig } from "./types";

export function renderPrototypeIndex(prototypes: PrototypesConfig<StoreConfig>) {
  return `
  ${renderedSolidityHeader}
  
  import { createPrototypes } from "./prototypes/AllPrototype.sol";
  ${Object.keys(prototypes)
    .map((key) => `import {${key}Prototype, ${key}PrototypeId} from "./prototypes/AllPrototype.sol"`)
    .join(";")};
  `;
}
