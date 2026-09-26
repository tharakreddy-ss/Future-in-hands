import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { spawnSync } from "node:child_process";
loadEnvConfig(process.cwd());
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", ...process.argv.slice(2)], { env: process.env, stdio: "inherit" });
process.exitCode = result.status ?? 1;
