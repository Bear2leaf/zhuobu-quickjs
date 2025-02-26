/**
 *
 * @param {number} x
 * @returns
 */
export function sign(x) {
    return x >= 0 ? 1 : -1;
}

/**
 * 
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}