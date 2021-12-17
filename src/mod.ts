import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { errorHandler } from './lib/error_utils.ts'

import network from './controllers/network.ts'
import block from './controllers/block.ts'
import account from './controllers/account.ts'
import mempool from './controllers/mempool.ts'

const root = new Router()
    .use("/network", network.routes(), network.allowedMethods())
    .use("/block", block.routes(), block.allowedMethods())
    .use("/account", account.routes(), account.allowedMethods())
    .use("/mempool", mempool.routes(), mempool.allowedMethods())

console.log("Rosetta server running. Access it at http://localhost:8080/")
await new Application()
    .use(errorHandler)
    .use(root.routes())
    .listen({ port: 8080 });
