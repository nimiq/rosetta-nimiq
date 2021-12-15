import { Router } from "https://deno.land/x/oak/mod.ts";
import rpc from "../rpc.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'
import {
    rpcBlockToRosetta,
} from '../lib/conversion.ts'

import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export default new Router()
    .post("/", async ({ request, response }) => {
        const req = await request.body().value as Paths.Block.RequestBody

        validateNetwork(req.network_identifier)

        let block: NimiqRpc.Block
        if (req.block_identifier.hash) {
            block = await rpc<NimiqRpc.Block>('getBlockByHash', req.block_identifier.hash, true)
        } else if (req.block_identifier.index) {
            block = await rpc<NimiqRpc.Block>('getBlockByNumber', req.block_identifier.index, true)
        } else {
            block = await rpc<NimiqRpc.Block>('getBlockByNumber', 'latest', true)
        }

        const result: Paths.Block.Responses.$200 = {
            block: rpcBlockToRosetta(block),
        }

        response.body = result
    })
