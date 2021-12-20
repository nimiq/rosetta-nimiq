import type { Components } from '../../types/rosetta.d.ts'

export class RosettaError extends Error implements Components.Schemas.Error {
    constructor(
        public code: number,
        message: string,
        public description: string,
        public retriable: boolean,
        public details?: Record<string, any>,
    ) {
        super(message)
    }
}

export class InternalError extends RosettaError {
    constructor(error: string) {
        super(0, 'Internal Error', error, true)
    }
}

// Data API Errors

export class InvalidBlockchainError extends RosettaError {
    constructor(blockchain: string) {
        super(1, 'Invalid Blockchain', `The requested blockchain ${blockchain} is not supported.`, false)
    }
}

export class InvalidNetworkError extends RosettaError {
    constructor(network: string) {
        super(2, 'Invalid Network', `The requested network ${network} is not supported.`, false)
    }
}

export class NotImplementedError extends RosettaError {
    constructor(request: string) {
        super(3, 'Not Implemented', `The request ${request} is not implemented.`, false)
    }
}

export class BlockNotFoundError extends RosettaError {
    constructor(numberOrHash: number | string) {
        super(4, 'Block Not Found', `The block ${numberOrHash} was not found.`, false)
    }
}

export class BlockIsNotTipError extends RosettaError {
    constructor(numberOrHash: number | string) {
        super(5, 'Block Is Not Tip', `The requested block ${numberOrHash} is not the tip of the chain.`, false)
    }
}

export class InconsistentStateError extends RosettaError {
    constructor() {
        super(6, 'Incosistent State', 'The state of the blockchain was inconsistent during the request.', true)
    }
}

export class TransactionNotFoundError extends RosettaError {
    constructor(hash: string) {
        super(7, 'Transaction Not Found', `Transaction with hash ${hash} was not found.`, false)
    }
}

// Construction API Errors

export class UnsupportedCurveError extends RosettaError {
    constructor(curve: string) {
        super(8, 'Unsupported Curve', `The curve ${curve} is not supported.`, false)
    }
}

export class InvalidOperationsError extends RosettaError {
    constructor(description: string) {
        super(9, 'Invalid Operations', description, false)
    }
}

export class MissingParamtersError extends RosettaError {
    constructor(description: string) {
        super(10, 'Missing Parameters', description, false)
    }
}

export const ERRORS = [
    new InternalError('Some internal error'),
    new InvalidBlockchainError('SomeChain'),
    new InvalidNetworkError('somenet'),
    new NotImplementedError('/some/request'),
    new BlockNotFoundError(42),
    new BlockIsNotTipError(42),
    new InconsistentStateError(),
    new TransactionNotFoundError('0000000000000000000000000000000000000000000000000000000000000000'),
    new UnsupportedCurveError('somecurve'),
    new InvalidOperationsError('This is some error description.'),
    new MissingParamtersError('This is some error description.'),
]
