import { Blake2b } from "../deps/blake2b.ts";
// @deno-types="../deps/nimiq/types.d.ts"
import Nimiq from '../deps/nimiq/web.esm.js'

import Config from "../config.ts"

const genesis_config = {
    devnet: "dev",
    testnet: "test",
    mainnet: "main",
}[Config.network] as "dev" | "test" | "main"

Nimiq.GenesisConfig[genesis_config]()

// Overwrite blake2b hash function to not require the WASM module
Nimiq.Hash.blake2b = function(arr: Uint8Array) {
    const blake = new Blake2b(Nimiq.Hash.SIZE.get(Nimiq.Hash.Algorithm.BLAKE2B)!).update(arr)
    return new Nimiq.Hash(blake.digest() as Uint8Array, Nimiq.Hash.Algorithm.BLAKE2B)
}

export default Nimiq
