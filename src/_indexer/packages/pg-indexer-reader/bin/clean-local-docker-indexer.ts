#!/usr/bin/env node
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const currentDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(currentDir, "..");

try {
  process.chdir(packageDir);
  execSync("pnpm run clean:local", { stdio: "inherit" });
} catch (error) {
  console.error("Failed to start local docker indexer:", error);
  process.exit(1);
}
