import { formatAndWriteSolidity } from "@latticexyz/common/codegen";
import fs from "fs";
import path from "path";
import * as xml2js from "xml2js";

const parser = new xml2js.Parser();

type terrainFile = { id: string; filePath: string };
type JsonCoords = {
  coord: { x: number; y: number };
  index: number;
  value: string;
};
export async function terraingen(csvSrcs: terrainFile[], outputBaseDirectory: string) {
  const json = csvToJsonCoords(csvSrcs);
  const content = generateContent(json);
  const finalContent = addContext(content);
  const fullOutputPath = path.join(outputBaseDirectory, `scripts/CreateTerrain.sol`);
  await formatAndWriteSolidity(finalContent, fullOutputPath, `Generated terrain`);
}

const numberBase: Record<string, string> = {
  1: "Iron",
  2: "Copper",
  3: "Iron",
  4: "Lithium",
  5: "Sulfur",
  6: "Titanium",
  7: "Kimberlite",
  8: "Iridium",
  9: "Platinum",
};

function csvToJsonCoords(tmxUrls: terrainFile[]) {
  const res: Array<JsonCoords> = [];

  tmxUrls.forEach((tmxUrl) => {
    const tmx = fs.readFileSync(tmxUrl.filePath, "utf-8");
    parser.parseString(tmx, (err, result) => {
      if (err) throw err;

      const csv = result.map.layer[0].data[0]._ as string;
      const lines = csv.split("\n").filter((x) => !!x);
      for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i]
          .replace(/\s+/g, "")
          .split(",")
          .filter((x) => !!x);
        for (let j = 0; j < currentLine.length; j++) {
          if (currentLine[j] == "0") continue;
          const value = numberBase[currentLine[j]];
          if (!value) throw new Error(`Invalid value ${currentLine[j]} at line ${i}, column ${j}`);
          res.push({
            coord: { x: j, y: i },
            index: Number(tmxUrl.id),
            value: value,
          });
        }
      }
    });
  });

  return res;
}

function generateContent(jsonContent: JsonCoords[]) {
  return jsonContent
    .map((elem) => `P_Terrain.set(${elem.index}, ${elem.coord.x}, ${elem.coord.y}, uint8(EResource.${elem.value}));`)
    .join("");
}

function addContext(str: string) {
  return `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { P_Terrain } from "codegen/index.sol";
import { EResource } from "codegen/common.sol";

  function createTerrain() {
    ${str}
}
`;
}
