import { Router } from "../deps/oak.ts";
import rpc from "../rpc.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'
import {
    rpcTransationToRosetta,
} from '../lib/conversion.ts'
import {
    TransactionNotFoundError,
} from '../lib/errors.ts'

import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export default new Router()
    .post("/", async ({ request, response }) => {
        const req = await request.body().value as Paths.Mempool.RequestBody

        validateNetwork(req.network_identifier)

        const hashes = await rpc<string[]>('mempoolContent')

        const result: Paths.Mempool.Responses.$200 = {
            transaction_identifiers: hashes.map(hash => ({ hash })),
        }

        response.body = result
    })
    .post("/transaction", async ({ request, response }) => {
        const req = await request.body().value as Paths.MempoolTransaction.RequestBody

        validateNetwork(req.network_identifier)

        const transaction = await rpc<NimiqRpc.Transaction>('getTransactionByHash', req.transaction_identifier.hash)
            .catch(error => {
                if ((error as Error).message.startsWith('Unknown transaction hash')) {
                    throw new TransactionNotFoundError(req.transaction_identifier.hash)
                }
                throw error
            })

        const result: Paths.MempoolTransaction.Responses.$200 = {
            transaction: rpcTransationToRosetta(transaction, true),
        }

        response.body = result
    })
