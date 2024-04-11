#!/usr/bin/env node
import "dotenv/config";
import { z } from "zod";
import Koa from "koa";
import cors from "@koa/cors";
import Router from "@koa/router";
import postgres from "postgres";
import { frontendEnvSchema, parseEnv } from "./parseEnv";
import { api } from "../src/postgres/routes/api";
// import { registerSentryMiddlewares } from "../src/sentry";

const env = parseEnv(
  z.intersection(
    frontendEnvSchema,
    z.object({
      DATABASE_URL: z.string(),
    })
  )
);

const database = postgres(env.DATABASE_URL, { prepare: false });

const server = new Koa();

// if (process.env.SENTRY_DSN) {
//   registerSentryMiddlewares(server);
// }

server.use(cors());
server.use(api(database));

const router = new Router();

router.get("/", (ctx) => {
  ctx.body = "emit HelloWorld();";
});

// k8s healthchecks
router.get("/healthz", (ctx) => {
  ctx.status = 200;
});
router.get("/readyz", (ctx) => {
  ctx.status = 200;
});

server.use(router.routes());
server.use(router.allowedMethods());

server.listen({ host: env.HOST, port: env.PORT });
console.log(
  `postgres indexer frontend listening on http://${env.HOST}:${env.PORT}`
);
