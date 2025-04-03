/**
 * Array helper functions
 */

/**
 * Group array items by a specified key
 * @param {Array} array - The array to group
 * @param {string|Function} key - The key to group by or a function that returns the key
 * @returns {Object} Grouped object where keys are the group values and values are arrays of items
 */
export const groupBy = (array, key) => {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  };
  
  /**
   * Chunks an array into smaller arrays of a specified size
   * @param {Array} array - The array to chunk
   * @param {number} size - The chunk size
   * @returns {Array} Array of chunks
   */
  export const chunk = (array, size) => {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };
  
  /**
   * Removes duplicate items from an array
   * @param {Array} array - The array to deduplicate
   * @param {string|Function} [key] - Optional key or function to use for comparison
   * @returns {Array} Deduplicated array
   */
  export const unique = (array, key) => {
    if (!Array.isArray(array)) return [];
    
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  };