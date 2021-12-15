/**
 * Adapted from Nimiq.Policy
 */

/**
 * Miner reward per block.
 */
 export function blockRewardAt(blockHeight: number): number {
    const currentSupply = supplyAfter(blockHeight - 1);
    return _blockRewardAt(currentSupply, blockHeight);
}


/**
 * Circulating supply after block.
 */
function supplyAfter(blockHeight: number): number {
    // Calculate last entry in supply cache that is below blockHeight.
    let startHeight = Math.floor(blockHeight / _supplyCacheInterval) * _supplyCacheInterval;
    startHeight = Math.max(0, Math.min(startHeight, _supplyCacheMax));

    // Calculate respective block for the last entry of the cache and the targeted height.
    const startI = startHeight / _supplyCacheInterval;
    const endI = Math.floor(blockHeight / _supplyCacheInterval);

    // The starting supply is the initial supply at the beginning and a cached value afterwards.
    let supply = startHeight === 0 ? INITIAL_SUPPLY : _supplyCache.get(startHeight)!;
    // Use and update cache.
    for (let i = startI; i < endI; ++i) {
        startHeight = i * _supplyCacheInterval;
        // Since the cache stores the supply *before* a certain block, subtract one.
        const endHeight = (i + 1) * _supplyCacheInterval - 1;
        supply = _supplyAfter(supply, endHeight, startHeight);
        // Don't forget to add one again.
        _supplyCache.set(endHeight + 1, supply);
        _supplyCacheMax = endHeight + 1;
    }

    // Calculate remaining supply (this also adds the block reward for endI*interval).
    return _supplyAfter(supply, blockHeight, endI * _supplyCacheInterval);
}

/**
 * Circulating supply after block.
 */
function _supplyAfter(initialSupply: number, blockHeight: number, startHeight = 0): number {
    let supply = initialSupply;
    for (let i = startHeight; i <= blockHeight; ++i) {
        supply += _blockRewardAt(supply, i);
    }
    return supply;
}

/**
 * Miner reward per block.
 */
function _blockRewardAt(currentSupply: number, blockHeight: number) {
    if (blockHeight <= 0) return 0;
    const remaining = TOTAL_SUPPLY - currentSupply;
    if (blockHeight >= EMISSION_TAIL_START && remaining >= EMISSION_TAIL_REWARD) {
        return EMISSION_TAIL_REWARD;
    }
    const remainder = remaining % EMISSION_SPEED;
    return (remaining - remainder) / EMISSION_SPEED;
}

/**
 * Targeted total supply in lunas.
 */
const TOTAL_SUPPLY = 21e14;

/**
 * Initial supply before genesis block in lunas.
 */
const INITIAL_SUPPLY = 252000000000000;

/**
 * Emission speed.
 */
const EMISSION_SPEED = Math.pow(2, 22);

/**
 * First block using constant tail emission until total supply is reached.
 */
const EMISSION_TAIL_START = 48692960;

/**
 * Constant tail emission in lunas until total supply is reached.
 */
const EMISSION_TAIL_REWARD = 4000;

const _supplyCache = new Map<number, number>();
const _supplyCacheInterval = 5000; // blocks
let _supplyCacheMax = 0; // blocks
