import { Router } from "https://deno.land/x/oak/mod.ts";
import rpc from "../rpc.ts"
import Config from "../config.ts"
import {
    BLOCKCHAIN,
    GENESIS_HEIGHT,
    OperationStatus,
    OperationType,
} from "../constants.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'


import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export default new Router()
    .post("/list", async ({ request, response }) => {
        const req = await request.body().value as Paths.NetworkList.RequestBody

        const result: Paths.NetworkList.Responses.$200 = {
            network_identifiers: [
                {
                    blockchain: BLOCKCHAIN,
                    network: Config.network,
                }
            ],
        }

        response.body = result
    })
    .post("/status", async ({ request, response }) => {
        const req = await request.body().value as Paths.NetworkStatus.RequestBody

        validateNetwork(req.network_identifier)

        const [head, genesis, peers, consensus, syncing] = await Promise.all([
            rpc<NimiqRpc.Block>('getBlockByNumber', 'latest'),
            rpc<NimiqRpc.Block>('getBlockByNumber', GENESIS_HEIGHT),
            rpc<NimiqRpc.Peer[]>('peerList'),
            rpc<NimiqRpc.ConsensusState>('consensus'),
            rpc<NimiqRpc.SyncStatus>('syncing'),
        ])

        const result: Paths.NetworkStatus.Responses.$200 = {
            current_block_identifier: {
                index: head.number,
                hash: head.hash,
            },
            current_block_timestamp: head.timestamp * 1e3,
            genesis_block_identifier: {
                index: genesis.number,
                hash: genesis.hash,
            },
            // oldest_block_identifier: {
            //     "index": 1123941,
            //     "hash": "0x1f2cc6c5027d2f201a5453ad1119574d2aed23a392654742ac3c78783c071f85"
            // },
            sync_status: {
                current_index: syncing ? syncing.currentBlock : head.number,
                target_index: syncing ? syncing.highestBlock : head.number,
                stage: consensus,
                synced: consensus === 'established',
            },
            peers: peers.map(peer => ({
                peer_id: peer.id,
                metadata: peer,
            })),
        }

        response.body = result
    })
    .post("/options", async ({ request, response }) => {
        const req = await request.body().value as Paths.NetworkOptions.RequestBody

        validateNetwork(req.network_identifier)

        const result: Paths.NetworkOptions.Responses.$200 = {
            version: {
                rosetta_version: "1.4.10",
                node_version: "1.5.8",
                middleware_version: "0.0.1",
            },
            allow: {
                operation_statuses: [
                    {
                        status: OperationStatus.FAILED,
                        successful: false,
                    },
                    {
                        status: OperationStatus.SUCCESS,
                        successful: true,
                    },
                ],
                operation_types: [
                    OperationType.REWARD,
                    OperationType.TRANSFER,
                    // OperationTypes.STAKE,
                ],
                errors: [
                    // {
                    //     code: 12,
                    //     message: "Invalid account format",
                    //     description: "This error is returned when the requested AccountIdentifier is improperly formatted.",
                    //     retriable: true,
                    //     details: {
                    //         address: "0x1dcc4de8dec75d7aab85b567b6",
                    //         error: "not base64",
                    //     },
                    // },
                ],
                historical_balance_lookup: false,
                timestamp_start_index: GENESIS_HEIGHT,
                call_methods: [],
                balance_exemptions: [],
                mempool_coins: true,
            },
        }

        response.body = result
    })
