import { Sql } from "postgres";
import { Middleware } from "koa";
import Router from "@koa/router";
import compose from "koa-compose";
import { queryLogs } from "../queryLogs";
import { recordToLog } from "../../util/recordToLog";
import { debug, error } from "../../util/debug";
import { createBenchmark } from "@latticexyz/common";
import { compress } from "../../util/compress";
import { dbQuerySchema, filterSchema } from "../querySchema";
import { toSQL } from "../queryToSql";
import { Readable } from "stream";

export function api(database: Sql): Middleware {
  const router = new Router();

  router.get("/api/logs", compress(), async (ctx) => {
    const benchmark = createBenchmark("postgres:logs");
    let options: ReturnType<typeof filterSchema.parse>;

    try {
      options = filterSchema.parse(typeof ctx.query.input === "string" ? JSON.parse(ctx.query.input) : {});
    } catch (e) {
      ctx.status = 400;
      ctx.body = JSON.stringify(e);
      debug(e);
      return;
    }

    try {
      options.filters = options.filters.length > 0 ? [...options.filters] : [];

      const records = await queryLogs(database, options ?? {}).execute();
      benchmark("query records");

      if (records.length === 0) {
        ctx.status = 200;
        ctx.body =
          JSON.stringify({
            blockNumber: 0,
            chunk: 1,
            totalChunks: 1,
            logs: [],
          }) + "\n";
        return;
      }

      const blockNumber = records[0].chainBlockNumber;
      const logs = records.map(recordToLog);
      benchmark("map records to logs");

      // Chunk the logs array into chunks, so client can process valid JSON early
      const chunkSize = 1000;
      const chunks: (typeof logs)[] = [];
      for (let i = 0; i < logs.length; i += chunkSize) {
        const chunk = logs.slice(i, i + chunkSize);
        chunks.push(chunk);
      }

      const readableStream = new Readable({
        read() {
          chunks.forEach(async (chunk, index) => {
            this.push(
              JSON.stringify({
                blockNumber,
                chunk: index + 1,
                totalChunks: chunks.length,
                logs: chunk,
              }) + "\n"
            );
          });

          this.push(null); // No more data
        },
      });

      ctx.body = readableStream;
      ctx.status = 200;
    } catch (e) {
      ctx.status = 500;
      ctx.body = JSON.stringify(e);
      error(e);
    }
  });

  router.get("/api/queryLogs", compress(), async (ctx) => {
    const benchmark = createBenchmark("postgres:logs");

    try {
      const input = dbQuerySchema.parse(typeof ctx.query.input === "string" ? JSON.parse(ctx.query.input) : {});
      const records = await toSQL(database, input.address, input.queries);
      benchmark("query records");

      if (records.length === 0) {
        if (records.length === 0) {
          ctx.status = 200;
          ctx.body =
            JSON.stringify({
              blockNumber: 0,
              chunk: 1,
              totalChunks: 1,
              logs: [],
            }) + "\n";
          return;
        }
      }

      const blockNumber = records[0].chainBlockNumber;
      const logs = records.map(recordToLog);

      benchmark("map records to logs");

      // Chunk the logs array into chunks, so client can process valid JSON early
      const chunkSize = 1000;
      const chunks: (typeof logs)[] = [];
      for (let i = 0; i < logs.length; i += chunkSize) {
        const chunk = logs.slice(i, i + chunkSize);
        chunks.push(chunk);
      }

      const readableStream = new Readable({
        read() {
          chunks.forEach(async (chunk, index) => {
            this.push(
              JSON.stringify({
                blockNumber,
                chunk: index + 1,
                totalChunks: chunks.length,
                logs: chunk,
              }) + "\n"
            );
          });

          this.push(null); // No more data
        },
      });

      ctx.body = readableStream;
      ctx.status = 200;
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = JSON.stringify(e);
      debug(e);
      return;
    }

    ctx.status = 200;
  });

  return compose([router.routes(), router.allowedMethods()]) as Middleware;
}
