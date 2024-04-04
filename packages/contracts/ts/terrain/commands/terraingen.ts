import { getSrcDirectory } from "@latticexyz/common/foundry";
import { loadConfig } from "@latticexyz/config/node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { StoreConfigWithPrototypes } from "../../prototypes/types";
import { terraingen } from "../terraingen";

const __dirname = fileURLToPath(import.meta.url);
const config = (await loadConfig()) as StoreConfigWithPrototypes;

const configDir = path.resolve(__dirname, "../../../../config");
const tmxFiles = fs.readdirSync(configDir).filter((file) => file.endsWith(".tmx"));
const tmxSrcs = tmxFiles.map((file) => ({ id: file.charAt(0), filePath: path.join(configDir, file) }));

const srcDirectory = await getSrcDirectory();

const generateTerrain = () => {
  terraingen(tmxSrcs, path.join(srcDirectory, config.codegenDirectory));
};

generateTerrain();
