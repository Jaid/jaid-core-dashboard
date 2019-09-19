/** @module jaid-core-dashboard */

/**
 * @function
 * @param {number} [compareValue]
 * @returns {number} Seconds passed since Unix epoch (01 January 1970)
 * @example
 * import jaidCoreDashboard from "jaid-core-dashboard"
 * const result = jaidCoreDashboard()
 * result === 1549410770
 * setTimeout(() => {
 *   const result2 = jaidCoreDashboard(result)
 *   result2 === 3
 * }, 3000)
 */
export default compareValue => {
  const seconds = Math.floor(Date.now() / 1000)
  if (compareValue === undefined) {
    return seconds
  } else {
    return seconds - compareValue
  }
}