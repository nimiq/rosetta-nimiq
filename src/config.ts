import defaultConfig from "./config.default.json" assert { type: "json" };

type Config = {
    network: "mainnet" | "testnet" | "devnet",
    rpc: {
        endpoint: string,
        port: number,
    },
}

let userConfig;
try {
    userConfig = Deno.args.length ? JSON.parse(Deno.readTextFileSync(Deno.args[0])) : {};
} catch (error) {
    console.error('Failed to parse provided config file:');
    throw error;
}

// Testing for object type is fun, because everything is an object in Javascript, even `null`
if (typeof userConfig !== 'object' || !userConfig || Array.isArray(userConfig)) {
    throw new Error('Invalid provided config file: not a JSON object');
}

// Validate that userConfig only includes known options
for (const option in userConfig) {
    if (!(option in defaultConfig)) {
        throw new Error(`Unknown option '${option}' in provided config file`);
    }
}

const config: Config = {
    ...defaultConfig,
    ...userConfig,
};

console.debug("Config:", config);

export default Object.freeze(config);
