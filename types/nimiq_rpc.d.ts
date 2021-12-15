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
        transactions: [],
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
}
