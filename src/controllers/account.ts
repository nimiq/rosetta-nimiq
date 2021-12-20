import { Router } from "../deps/oak.ts";
import rpc from "../rpc.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'

import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export default new Router()
    .post("/balance", async ({ request, response }) => {
        const req = await request.body().value as Paths.AccountBalance.RequestBody

        validateNetwork(req.network_identifier)

        const headBefore = await rpc<NimiqRpc.Block>('getBlockByNumber', 'latest')

        if (req.block_identifier) {
            // Check that the balance is requested at the current head block, as otherwise we cannot serve the request
            if (req.block_identifier.hash && req.block_identifier.hash !== headBefore.hash) {
                throw new Error('Requested block not available')
            }

            if (req.block_identifier.index && req.block_identifier.index !== headBefore.number) {
                throw new Error('Requested block not available')
            }
        }

        const account = await rpc<NimiqRpc.Account>('getAccount', req.account_identifier.address)

        const headAfter = await rpc<NimiqRpc.Block>('getBlockByNumber', 'latest')

        // Ensure the head did not change in the meantime, in which case we wouldn't know for which
        // block the balance is.
        if (headBefore.hash !== headAfter.hash) {
            // TODO: This condition can be alleviated by checking if the latter block changed the account's state
            throw new Error('Inconsistent balance state')
        }

        const result: Paths.AccountBalance.Responses.$200 = {
            block_identifier: {
                index: headAfter.number,
                hash: headAfter.hash,
            },
            balances: [
                {
                    currency: {
                        symbol: "NIM",
                        decimals: 5,
                    },
                    value: account.balance.toString(),
                },
            ],
        }

        response.body = result
    })
