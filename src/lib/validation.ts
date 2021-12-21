import type { Components } from "../../types/rosetta.d.ts";
import Config from "../config.ts";
import { BLOCKCHAIN } from "../constants.ts";
import { InvalidBlockchainError, InvalidNetworkError } from "./errors.ts";

export function validateNetwork(network_identifier: Components.Schemas.NetworkIdentifier): boolean {
    if (network_identifier.blockchain !== BLOCKCHAIN) {
        throw new InvalidBlockchainError(network_identifier.blockchain);
    }

    if (network_identifier.network !== Config.network) {
        throw new InvalidNetworkError(network_identifier.network);
    }

    return true;
}
