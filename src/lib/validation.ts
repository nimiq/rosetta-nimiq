import type { Components } from '../../types/rosetta.d.ts'
import Config from "../config.ts"
import {
    BLOCKCHAIN,
} from "../constants.ts"

export function validateNetwork(network_identifier: Components.Schemas.NetworkIdentifier): boolean {
    if (network_identifier.blockchain !== BLOCKCHAIN) {
        throw new Error('Unsupported Blockchain')
    }

    if (network_identifier.network !== Config.network) {
        throw new Error('Unsupported network')
    }

    return true
}
