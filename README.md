# Rosetta for Nimiq

This is an implementation of Coinbase's [Rosetta API](https://www.rosetta-api.org/) for the [Nimiq PoW Blockchain (1.x)](https://github.com/nimiq/core-js/).
It acts as a proxy between the client and the Nimiq node's RPC server.

## Usage

_TODO: Docker setup instructions_

To run the server for a testnet or mainnet node, change the `network` in src/config.ts to `"testnet"` or `"mainnet"` respectively.

> A future version of this server will accept an external configuration file.

## Development

This server is written in Typescript for [Deno](https://deno.land/) >= v1.17.0.

To run:

```
deno run --allow-net --watch src/mod.ts
```

This will start a Rosetta server at `http://localhost:8080`.

## Testing

This Rosetta implementation can be tested with the [Rosetta CLI](https://github.com/coinbase/rosetta-cli/), which you need to have [installed](https://github.com/coinbase/rosetta-cli/#install).

Additionally, you need to have access to a devnet or testnet [Nimiq node](https://github.com/nimiq/core-js/#quickstart) with [enabled RPC server](https://github.com/nimiq/core-js/blob/master/doc/nodejs-client.md). You can run your own devnet locally with the following config:

```js
{
    network: "dev",     // Start a devnet
    type: "full",       // Rosetta requires a full node
    protocol: "dumb",   // So we don't have to worry about a domain or TLS
    passive: "yes",     // So the node starts working without peers
    statistics: 5,      // To notice when transactions are in the mempool

    // We need the miner to produce a chain
    miner: {
        enabled: "yes",
        threads: 1,
    },

    // Enable the RPC Server, the access point for the Rosetta server
    rpcServer: {
        enabled: "yes",

        // If you change the port of the RPC server from the default,
        // you need to update the port in the Rosetta server config
        // at (src/config.ts).
    },
}
```

When both the Nimiq node and the Rosetta server (see [Development](#development)) are running, run the CLI tests. It is recommended to run the construction test first, so the subsequent data test has some transactions to validate. In a fresh devnet, the construction test takes around 5 minutes, the data test less than 30 seconds.

```bash
# Construction test (only available for devnet)
rosetta-cli check:construction --configuration-file rosetta-cli-conf/devnet/config.json

# Data test
rosetta-cli check:data --configuration-file rosetta-cli-conf/devnet/config.json
```

> The **construction test** checks if valid transactions can be created via the API and that those transactions get included into the blockchain.
>
> The **data test** checks for data format correctness and that all relevant blockchain data can be retrieved from the API, also validating that the chain and balance states are consistent.

## Acknowledgements

This Rosetta API implementation was developed with the help and inspiration of the following sources:

- [Rosetta API documentation](https://www.rosetta-api.org/docs/welcome.html)
- [Rosetta-Ethereum reference implementation](https://github.com/coinbase/rosetta-ethereum/)
- [Zilliqa-Rosetta implementation](https://github.com/Zilliqa/zilliqa-rosetta/)
