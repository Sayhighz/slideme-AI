/**
 * Service request status enum and helper functions
 */

/**
 * Request status enum
 */
export const REQUEST_STATUS = {
    PENDING: 'pending',    // New request, waiting for driver offers
    ACCEPTED: 'accepted',  // Driver offer accepted, service in progress
    COMPLETED: 'completed', // Service successfully completed
    CANCELLED: 'cancelled'  // Service cancelled by customer or system
  };
  
  /**
   * Driver offer status enum
   */
  export const OFFER_STATUS = {
    PENDING: 'pending',    // New offer, waiting for customer acceptance
    ACCEPTED: 'accepted',  // Offer accepted by customer
    REJECTED: 'rejected'   // Offer rejected by customer or system
  };
  
  /**
   * Payment status enum
   */
  export const PAYMENT_STATUS = {
    PENDING: 'Pending',    // Payment initiated but not completed
    COMPLETED: 'Completed', // Payment successfully completed
    FAILED: 'Failed'       // Payment failed
  };
  
  /**
   * Driver approval status enum
   */
  export const APPROVAL_STATUS = {
    PENDING: 'pending',    // New driver, waiting for approval
    APPROVED: 'approved',  // Driver approved to use the platform
    REJECTED: 'rejected'   // Driver application rejected
  };
  
  /**
   * Check if a status is valid request status
   * @param {string} status - Status to check
   * @returns {boolean} True if valid
   */
  export const isValidRequestStatus = (status) => {
    return Object.values(REQUEST_STATUS).includes(status);
  };
  
  /**
   * Check if a status is valid offer status
   * @param {string} status - Status to check
   * @returns {boolean} True if valid
   */
  export const isValidOfferStatus = (status) => {
    return Object.values(OFFER_STATUS).includes(status);
  };
  
  /**
   * Get all possible next statuses for a given request status
   * @param {string} currentStatus - Current request status
   * @returns {Array} Array of possible next statuses
   */
  export const getPossibleNextRequestStatuses = (currentStatus) => {
    switch (currentStatus) {
      case REQUEST_STATUS.PENDING:
        return [REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.CANCELLED];
      case REQUEST_STATUS.ACCEPTED:
        return [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.CANCELLED];
      case REQUEST_STATUS.COMPLETED:
      case REQUEST_STATUS.CANCELLED:
        return []; // Terminal states
      default:
        return [];
    }
  };