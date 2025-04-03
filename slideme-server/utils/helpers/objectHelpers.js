/**
 * Object helper functions
 */

/**
 * Pick specified properties from an object
 * @param {Object} obj - Source object
 * @param {Array} keys - Array of keys to pick
 * @returns {Object} New object with only the specified keys
 */
export const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    
    return keys.reduce((result, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  };
  
  /**
   * Omit specified properties from an object
   * @param {Object} obj - Source object
   * @param {Array} keys - Array of keys to omit
   * @returns {Object} New object without the specified keys
   */
  export const omit = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  };
  
  /**
   * Create a new object with all falsy values removed
   * @param {Object} obj - Source object
   * @returns {Object} New object with only truthy values
   */
  export const compact = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    
    return Object.keys(obj).reduce((result, key) => {
      if (obj[key]) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  };
  
  /**
   * Deep clone an object
   * @param {Object} obj - Source object
   * @returns {Object} Deep cloned object
   */
  export const deepClone = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    return JSON.parse(JSON.stringify(obj));
  };
  
  /**
   * Safely access nested object properties without errors
   * @param {Object} obj - Source object
   * @param {string} path - Dot-notation path to property
   * @param {any} defaultValue - Default value if property doesn't exist
   * @returns {any} Property value or default value
   */
  export const getNestedValue = (obj, path, defaultValue = undefined) => {
    if (!obj || typeof obj !== 'object' || !path) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current === undefined ? defaultValue : current;
  };