import { Router } from "../deps/oak.ts";
import rpc from "../rpc.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'
import {
    rpcBlockToRosetta,
} from '../lib/conversion.ts'
import {
    NotImplementedError,
    BlockNotFoundError,
} from '../lib/errors.ts'

import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export default new Router()
    .post("/", async ({ request, response }) => {
        const req = await request.body().value as Paths.Block.RequestBody

        validateNetwork(req.network_identifier)

        let block: NimiqRpc.Block
        if (req.block_identifier.hash) {
            const hash = req.block_identifier.hash
            block = await rpc<NimiqRpc.Block>('getBlockByHash', hash, true)
                .catch(error => {
                    if ((error as Error).message.startsWith('No block found')) {
                        throw new BlockNotFoundError(hash)
                    }
                    throw error
                })
        } else if (req.block_identifier.index) {
            const index = req.block_identifier.index
            block = await rpc<NimiqRpc.Block>('getBlockByNumber', index, true)
            .catch(error => {
                if ((error as Error).message.startsWith('No block found')) {
                    throw new BlockNotFoundError(index)
                }
                throw error
            })
        } else {
            block = await rpc<NimiqRpc.Block>('getBlockByNumber', 'latest', true)
        }

        const result: Paths.Block.Responses.$200 = {
            block: rpcBlockToRosetta(block),
        }

        response.body = result
    })
    .post("/transaction", () => {
        throw new NotImplementedError('/block/transaction')
    })
