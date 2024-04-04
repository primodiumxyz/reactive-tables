import { formatAndWriteSolidity } from "@latticexyz/common/codegen";
import { StoreConfig } from "@latticexyz/store";
import path from "path";
import { renderPrototypes } from "./renderPrototype";
import { renderPrototypeIndex } from "./renderPrototypeIndex";
import { renderPrototypeScript } from "./renderPrototypeScript";
import { PrototypesConfig, StoreConfigWithPrototypes } from "./types";

const generateIndex = async (prototypes: PrototypesConfig<StoreConfig>, outputBaseDirectory: string) => {
  const output = renderPrototypeIndex(prototypes);
  const fullOutputPath = path.join(outputBaseDirectory, `Prototypes.sol`);

  await formatAndWriteSolidity(output, fullOutputPath, "");
};

const generateSystem = async (prototypes: PrototypesConfig<StoreConfig>, outputBaseDirectory: string) => {
  const output = renderPrototypeScript(prototypes);

  const fullOutputPath = path.join(outputBaseDirectory, `scripts/CreatePrototypes.sol`);
  await formatAndWriteSolidity(output, fullOutputPath, "");
};

const generatePrototypes = async (config: StoreConfigWithPrototypes, outputBaseDirectory: string) => {
  const output = renderPrototypes(config);
  const name = "All";
  const fullOutputPath = path.join(outputBaseDirectory, `prototypes/${name}Prototype.sol`);
  await formatAndWriteSolidity(output, fullOutputPath, `Generated prototype ${name}`);
};

export async function prototypegen(config: StoreConfigWithPrototypes, outputBaseDirectory: string) {
  generateIndex(config.prototypeConfig, outputBaseDirectory);
  generatePrototypes(config, outputBaseDirectory);
}
