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
