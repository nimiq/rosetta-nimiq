import { Application, Router } from "https://deno.land/x/oak/mod.ts";

import network from './controllers/network.ts'
import block from './controllers/block.ts'

const root = new Router()
    .use("/network", network.routes(), network.allowedMethods())
    .use("/block", block.routes(), block.allowedMethods())

console.log("Rosetta server running. Access it at http://localhost:8080/")
await new Application()
    .use(root.routes())
    .listen({ port: 8080 });
