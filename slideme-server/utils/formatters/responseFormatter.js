/**
 * Response formatting utilities for API responses
 */

import { formatThaiBaht } from './currencyFormatter.js';
import { formatDisplayDate, formatTimeString } from './dateFormatter.js';

/**
 * Format service request data for API response
 * @param {Object} request - Service request data
 * @returns {Object} Formatted service request
 */
export const formatServiceRequest = (request) => {
  if (!request) return null;
  
  return {
    request_id: request.request_id,
    status: request.status,
    pickup_location: {
      address: request.location_from,
      latitude: parseFloat(request.pickup_lat),
      longitude: parseFloat(request.pickup_long)
    },
    dropoff_location: {
      address: request.location_to,
      latitude: parseFloat(request.dropoff_lat),
      longitude: parseFloat(request.dropoff_long)
    },
    booking_time: request.booking_time ? {
      date: formatDisplayDate(request.booking_time),
      time: formatTimeString(request.booking_time)
    } : null,
    request_time: {
      date: formatDisplayDate(request.request_time),
      time: formatTimeString(request.request_time)
    },
    vehicle_type: request.vehicletype_name,
    customer_message: request.customer_message,
    offer_price: request.offered_price ? formatThaiBaht(request.offered_price) : null
  };
};

/**
 * Format service history item for API response
 * @param {Object} historyItem - Service history data
 * @returns {Object} Formatted service history item
 */
export const formatServiceHistoryItem = (historyItem) => {
  if (!historyItem) return null;
  
  return {
    request_id: historyItem.request_id,
    service_date: formatDisplayDate(historyItem.request_time),
    service_time: formatTimeString(historyItem.request_time),
    status: historyItem.status,
    origin: historyItem.location_from,
    destination: historyItem.location_to,
    vehicle_type: historyItem.vehicletype_name,
    price: historyItem.offered_price ? formatThaiBaht(historyItem.offered_price) : null,
    driver_info: historyItem.driver_id ? {
      driver_id: historyItem.driver_id,
      name: `${historyItem.driver_first_name || ''} ${historyItem.driver_last_name || ''}`.trim(),
      phone: historyItem.driver_phone,
      rating: historyItem.driver_rating ? parseFloat(historyItem.driver_rating).toFixed(1) : null
    } : null
  };
};

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
export const formatSuccessResponse = (data = null, message = 'Operation successful') => {
  const response = {
    Status: true,
    Message: message
  };
  
  if (data !== null) {
    if (Array.isArray(data)) {
      response.Result = data;
    } else if (typeof data === 'object') {
      Object.assign(response, data);
    } else {
      response.Result = data;
    }
  }
  
  return response;
};

/**
 * Format error response
 * @param {string} error - Error message
 * @param {number} code - Error code
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (error = 'An error occurred', code = null) => {
  const response = {
    Status: false,
    Error: error
  };
  
  if (code !== null) {
    response.ErrorCode = code;
  }
  
  return response;
};