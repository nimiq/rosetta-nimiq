import Config from './config.ts'

type JsonPrimitive = string | number | boolean | null

export default function rpc<T>(method: string, ...params: JsonPrimitive[]): Promise<T> {
    const { endpoint, port } = Config.rpc

    return fetch(`${endpoint}:${port}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: 42,
        })
    })
    .then(response => response.json())
    .then(result => result.result)
}
