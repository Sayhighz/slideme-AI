/**
 * Address validation utilities
 */

/**
 * Validate address data
 * @param {Object} addressData - Address data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateAddress = (addressData) => {
    const errors = [];
    
    if (!addressData) {
      return { isValid: false, errors: ['Address data is required'] };
    }
    
    // Validate required fields
    if (!addressData.customer_id) {
      errors.push('Customer ID is required');
    }
    
    if (!addressData.location_from) {
      errors.push('Pickup location is required');
    }
    
    if (!addressData.location_to) {
      errors.push('Dropoff location is required');
    }
    
    if (!addressData.pickup_lat || !addressData.pickup_long) {
      errors.push('Pickup coordinates are required');
    }
    
    if (!addressData.dropoff_lat || !addressData.dropoff_long) {
      errors.push('Dropoff coordinates are required');
    }
    
    if (!addressData.vehicletype_id) {
      errors.push('Vehicle type is required');
    }
    
    // Validate coordinate formats
    if (addressData.pickup_lat && isNaN(parseFloat(addressData.pickup_lat))) {
      errors.push('Pickup latitude must be a valid number');
    }
    
    if (addressData.pickup_long && isNaN(parseFloat(addressData.pickup_long))) {
      errors.push('Pickup longitude must be a valid number');
    }
    
    if (addressData.dropoff_lat && isNaN(parseFloat(addressData.dropoff_lat))) {
      errors.push('Dropoff latitude must be a valid number');
    }
    
    if (addressData.dropoff_long && isNaN(parseFloat(addressData.dropoff_long))) {
      errors.push('Dropoff longitude must be a valid number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate saved address bookmark
   * @param {Object} bookmarkData - Bookmark data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  export const validateBookmark = (bookmarkData) => {
    const errors = [];
    
    if (!bookmarkData) {
      return { isValid: false, errors: ['Bookmark data is required'] };
    }
    
    // Validate required fields
    if (!bookmarkData.customer_id) {
      errors.push('Customer ID is required');
    }
    
    if (!bookmarkData.save_name) {
      errors.push('Bookmark name is required');
    }
    
    if (!bookmarkData.location_from) {
      errors.push('Pickup location is required');
    }
    
    if (!bookmarkData.location_to) {
      errors.push('Dropoff location is required');
    }
    
    if (!bookmarkData.pickup_lat || !bookmarkData.pickup_long) {
      errors.push('Pickup coordinates are required');
    }
    
    if (!bookmarkData.dropoff_lat || !bookmarkData.dropoff_long) {
      errors.push('Dropoff coordinates are required');
    }
    
    if (!bookmarkData.vehicletype_id) {
      errors.push('Vehicle type is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };