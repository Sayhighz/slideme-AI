/**
 * Math helper functions
 */

/**
 * Round a number to a specified number of decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export const roundTo = (value, decimals = 2) => {
    if (isNaN(value)) return 0;
    
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };
  
  /**
   * Calculate the average of an array of numbers
   * @param {Array} numbers - Array of numbers
   * @returns {number} Average value
   */
  export const average = (numbers) => {
    if (!Array.isArray(numbers) || numbers.length === 0) return 0;
    
    const sum = numbers.reduce((total, num) => total + (isNaN(num) ? 0 : Number(num)), 0);
    return roundTo(sum / numbers.length);
  };
  
  /**
   * Calculate the percentage
   * @param {number} value - The value
   * @param {number} total - The total
   * @returns {number} Percentage
   */
  export const percentage = (value, total) => {
    if (!value || !total || isNaN(value) || isNaN(total) || total === 0) return 0;
    
    return roundTo((value / total) * 100);
  };
  
  /**
   * Generate a random number between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  export const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  export const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };
  
  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} Angle in degrees
   */
  export const radiansToDegrees = (radians) => {
    return radians * (180 / Math.PI);
  };