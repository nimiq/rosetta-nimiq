import Config from "../config.ts";

import type { NimiqRpc } from "../../types/nimiq_rpc.d.ts";

type JsonPrimitive = string | number | boolean | null;

export default function rpc<T>(method: string, ...params: JsonPrimitive[]): Promise<T> {
    const { endpoint, port } = Config.rpc;

    return fetch(`${endpoint}:${port}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
            id: 42,
        }),
    })
        .then(async (response) => {
            const result = await response.json();
            if ("error" in result) {
                throw new Error((result.error as NimiqRpc.RpcError).message);
            }
            return result.result;
        });
}
