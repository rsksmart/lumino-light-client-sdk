export const ONE_MINUTE_IN_MS = 60000;

/**
 * We change the values according to the chain_id
 */
export const TIMEOUT_MAP = {
    33: ONE_MINUTE_IN_MS * 5,
    32: ONE_MINUTE_IN_MS * 30,
    31: ONE_MINUTE_IN_MS * 30
};

