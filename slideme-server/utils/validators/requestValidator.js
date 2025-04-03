/**
 * Request validation utilities
 */

/**
 * Validate service request creation data
 * @param {Object} requestData - Request data to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateCreateRequest = (requestData) => {
    const errors = [];
    
    if (!requestData) {
      return { isValid: false, errors: ['Request data is required'] };
    }
    
    // Validate required fields
    if (!requestData.customer_id) {
      errors.push('Customer ID is required');
    }
    
    if (!requestData.pickup_lat || !requestData.pickup_long) {
      errors.push('Pickup coordinates are required');
    }
    
    if (!requestData.location_from) {
      errors.push('Pickup location is required');
    }
    
    if (!requestData.dropoff_lat || !requestData.dropoff_long) {
      errors.push('Dropoff coordinates are required');
    }
    
    if (!requestData.location_to) {
      errors.push('Dropoff location is required');
    }
    
    if (!requestData.vehicletype_id) {
      errors.push('Vehicle type is required');
    }
    
    // Validate coordinate formats
    if (requestData.pickup_lat && isNaN(parseFloat(requestData.pickup_lat))) {
      errors.push('Pickup latitude must be a valid number');
    }
    
    if (requestData.pickup_long && isNaN(parseFloat(requestData.pickup_long))) {
      errors.push('Pickup longitude must be a valid number');
    }
    
    if (requestData.dropoff_lat && isNaN(parseFloat(requestData.dropoff_lat))) {
      errors.push('Dropoff latitude must be a valid number');
    }
    
    if (requestData.dropoff_long && isNaN(parseFloat(requestData.dropoff_long))) {
      errors.push('Dropoff longitude must be a valid number');
    }
    
    // Validate booking time if provided
    if (requestData.booking_time) {
      const bookingTime = new Date(requestData.booking_time);
      if (isNaN(bookingTime.getTime())) {
        errors.push('Booking time is invalid');
      } else {
        // Ensure booking time is in the future
        const now = new Date();
        if (bookingTime < now) {
          errors.push('Booking time must be in the future');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate offer creation
   * @param {Object} offerData - Offer data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  export const validateOfferCreation = (offerData) => {
    const errors = [];
    
    if (!offerData) {
      return { isValid: false, errors: ['Offer data is required'] };
    }
    
    // Validate required fields
    if (!offerData.request_id) {
      errors.push('Request ID is required');
    }
    
    if (!offerData.driver_id) {
      errors.push('Driver ID is required');
    }
    
    if (!offerData.offered_price) {
      errors.push('Offered price is required');
    } else if (isNaN(parseFloat(offerData.offered_price)) || parseFloat(offerData.offered_price) <= 0) {
      errors.push('Offered price must be a positive number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };