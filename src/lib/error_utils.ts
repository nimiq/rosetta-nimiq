import { Middleware } from "https://deno.land/x/oak/middleware.ts";

import type { Components } from '../../types/rosetta.d.ts'
import {
    RosettaError,
    InternalError,
} from './errors.ts'

export const errorHandler: Middleware = async ({ response }, next) => {
    try {
        await next();
    } catch (err) {
        console.error(err)

        let error: RosettaError

        // Handle unhandled errors
        if (err instanceof RosettaError) {
            error = err
        } else {
            error = new InternalError(err instanceof Error ? err.message : String(err))
        }

        response.status = 500
        response.body = formatError(error)
    }
}

export function formatError(error: RosettaError): Components.Schemas.Error {
    const { code, message, description, retriable, details } = error

    return {
        code,
        message,
        description,
        retriable,
        ...(details ? { details } : {}),
    }
}
