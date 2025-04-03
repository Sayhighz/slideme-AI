/**
 * User validation utilities
 */

/**
 * Validate phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if the phone number is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    
    // Thai phone numbers: 10 digits, starting with 0
    const regex = /^0[0-9]{9}$/;
    return regex.test(phoneNumber);
  };
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if the email is valid
   */
  export const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    if (email === '') return true;
    
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };
  
  /**
   * Validate user data
   * @param {Object} userData - User data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  export const validateUserData = (userData) => {
    const errors = [];
    
    if (!userData) {
      return { isValid: false, errors: ['User data is required'] };
    }
    
    // Phone number is required
    if (!userData.phone_number) {
      errors.push('Phone number is required');
    } else if (!validatePhoneNumber(userData.phone_number)) {
      errors.push('Phone number is invalid');
    }
    
    // Email is optional but must be valid if provided
    if (userData.email && !validateEmail(userData.email)) {
      errors.push('Email is invalid');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate driver data
   * @param {Object} driverData - Driver data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  export const validateDriverData = (driverData) => {
    const errors = [];
    
    if (!driverData) {
      return { isValid: false, errors: ['Driver data is required'] };
    }
    
    // Basic user validation
    const userValidation = validateUserData(driverData);
    if (!userValidation.isValid) {
      return userValidation;
    }
    
    // Driver-specific validations
    if (!driverData.license_plate) {
      errors.push('License plate is required');
    }
    
    if (!driverData.license_number) {
      errors.push('License number is required');
    }
    
    if (!driverData.id_expiry_date) {
      errors.push('ID expiry date is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };