import {
    GENESIS_HEIGHT,
    OperationStatus,
    OperationType,
} from '../constants.ts'
import { blockRewardAt } from './block_reward.ts'
import Nimiq from './nimiq_lib.ts'

import type { Components } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

export function rpcBlockToRosetta(block: NimiqRpc.Block): Components.Schemas.Block {
    const block_reward = blockRewardAt(block.number)
    const transaction_fees = block.transactions.length && typeof block.transactions[0] !== 'string'
        ? (block.transactions as NimiqRpc.Transaction[]).reduce((sum, transaction) => sum + transaction.fee, 0)
        : 0

    return {
        block_identifier: {
            index: block.number,
            hash: block.hash,
        },
        parent_block_identifier: {
            // https://www.rosetta-api.org/docs/common_mistakes.html#malformed-genesis-block
            index: block.number === GENESIS_HEIGHT ? GENESIS_HEIGHT : block.number - 1,
            hash: block.number === GENESIS_HEIGHT ? block.hash : block.parentHash,
        },
        timestamp: block.timestamp * 1e3,
        transactions: [
            // Block reward
            {
                transaction_identifier: {
                    hash: `reward:${block.hash}`,
                },
                operations: [
                    {
                        operation_identifier: {
                            index: 0,
                        },
                        related_operations: [],
                        type: OperationType.REWARD,
                        status: OperationStatus.SUCCESS,
                        account: {
                            address: block.minerAddress,
                        },
                        amount: {
                            currency: {
                                symbol: "NIM",
                                decimals: 5,
                            },
                            value: (block_reward + transaction_fees).toString(),
                        },
                    },
                ],
            },
            ...(block.transactions.length && typeof block.transactions[0] !== 'string'
                ? (block.transactions as NimiqRpc.Transaction[]).map(transaction => rpcTransationToRosetta(transaction, true))
                : []
            ),
        ],
    }
}

export function rpcTransationToRosetta(transaction: Nimiq.Transaction | NimiqRpc.Transaction, include_operation_status: boolean): Components.Schemas.Transaction {
    return {
        transaction_identifier: {
            hash: typeof transaction.hash === 'function' ? transaction.hash().toHex() : transaction.hash,
        },
        operations: [
            {
                operation_identifier: {
                    index: 0,
                },
                related_operations: [],
                type: OperationType.TRANSFER,
                ...(include_operation_status ? { status: OperationStatus.SUCCESS } : {}),
                account: {
                    address: 'sender' in transaction ? transaction.sender.toUserFriendlyAddress() : transaction.fromAddress,
                },
                amount: {
                    currency: {
                        symbol: "NIM",
                        decimals: 5,
                    },
                    // Note the negative sign, indicating that this is an outgoing operation
                    value: `-${transaction.value + transaction.fee}`,
                },
            },
            {
                operation_identifier: {
                    index: 1,
                },
                related_operations: [
                    {
                        index: 0,
                    },
                ],
                type: OperationType.TRANSFER,
                ...(include_operation_status ? { status: OperationStatus.SUCCESS } : {}),
                account: {
                    address: 'recipient' in transaction ? transaction.recipient.toUserFriendlyAddress() : transaction.toAddress,
                },
                amount: {
                    currency: {
                        symbol: "NIM",
                        decimals: 5,
                    },
                    value: `${transaction.value}`,
                },
            },
        ],
        metadata: {
            ...(transaction.data
                ? { data: transaction.data instanceof Uint8Array ? Nimiq.BufferUtils.toHex(transaction.data) : transaction.data }
                : {}),
            ...('timestamp' in transaction ? { timestamp: transaction.timestamp } : {}),
        },
    }
}
