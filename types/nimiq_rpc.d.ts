export declare namespace NimiqRpc {
    export interface Block {
        number: number,
        hash: string,
        pow: string,
        parentHash: string,
        nonce: number,
        bodyHash: string,
        accountsHash: string,
        miner: string,
        minerAddress: string,
        difficulty: string,
        extraData: string,
        size: number,
        timestamp: number,
        transactions: string[] | Transaction[],
    }

    export interface Peer {
        id: string,
        address: string,
        addressState: number,
        connectionState?: number,
        version?: number,
        timeOffset?: number,
        headHash?: string,
        latency?: number,
        rx?: number,
        tx?: number,
    }

    export type ConsensusState = "established" | "syncing" | "connecting"

    export type SyncStatus = false | {
        startingBlock: number,
        currentBlock: number,
        highestBlock: number,
    }

    export interface Transaction {
        hash: string,
        blockHash: string,
        blockNumber: number,
        timestamp: number,
        confirmations: number,
        transactionIndex: number,
        from: string,
        fromAddress: string,
        to: string,
        toAddress: string,
        value: number,
        fee: number,
        data: null,
        flags: number
    }

    export interface Account {
        id: string,
        address: string,
        balance: number,
        type: 0 | 1 | 2,
    }
}
