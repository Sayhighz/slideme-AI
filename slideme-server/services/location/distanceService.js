/**
 * Distance calculation service
 */
import logger from '../../config/logger.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  try {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      logger.warn('Missing coordinates for distance calculation');
      return 0;
    }

    // Convert string coordinates to numbers if needed
    const latitude1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const longitude1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const latitude2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const longitude2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;

    // Radius of the Earth in kilometers
    const earthRadius = 6371;
    
    // Convert degrees to radians
    const dLat = toRadians(latitude2 - latitude1);
    const dLon = toRadians(longitude2 - longitude1);
    
    // Haversine formula
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(latitude1)) * Math.cos(toRadians(latitude2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = earthRadius * c;
    
    // Round to 2 decimal places
    return Math.round(distance * 100) / 100;
  } catch (error) {
    logger.error('Error calculating distance', { error: error.message });
    return 0;
  }
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated travel time based on distance
 * @param {number} distance - Distance in kilometers
 * @param {number} avgSpeed - Average speed in km/h (default: 30 km/h for Bangkok traffic)
 * @returns {number} Estimated travel time in minutes
 */
export const calculateTravelTime = (distance, avgSpeed = 30) => {
  try {
    if (!distance || distance <= 0) return 0;
    
    // Time in hours = distance / speed
    // Convert to minutes = time * 60
    const travelTimeMinutes = (distance / avgSpeed) * 60;
    
    // Round to nearest minute
    return Math.round(travelTimeMinutes);
  } catch (error) {
    logger.error('Error calculating travel time', { error: error.message });
    return 0;
  }
};

/**
 * Calculate price estimation based on distance
 * @param {number} distance - Distance in kilometers
 * @param {string} vehicleType - Vehicle type (from vehicle_types table)
 * @returns {number} Estimated price in THB
 */
export const calculatePriceEstimate = (distance, vehicleType = 'standard_slide') => {
  try {
    if (!distance || distance <= 0) return 0;
    
    // Base rates by vehicle type (THB/km)
    const baseRates = {
      'standard_slide': 20,
      'heavy_duty_slide': 30,
      'luxury_slide': 40,
      'emergency_slide': 35
    };
    
    // Base fare (minimum fare)
    const baseFare = {
      'standard_slide': 100,
      'heavy_duty_slide': 150,
      'luxury_slide': 200,
      'emergency_slide': 250
    };
    
    // Get rate for vehicle type or default to standard
    const rate = baseRates[vehicleType] || baseRates.standard_slide;
    const minimumFare = baseFare[vehicleType] || baseFare.standard_slide;
    
    // Calculate fare based on distance and rate
    const calculatedFare = distance * rate;
    
    // Return the higher of calculated fare or minimum fare
    const estimatedPrice = Math.max(calculatedFare, minimumFare);
    
    // Round to nearest 10 THB
    return Math.ceil(estimatedPrice / 10) * 10;
  } catch (error) {
    logger.error('Error calculating price estimate', { error: error.message });
    return 0;
  }
};

export default {
  calculateDistance,
  calculateTravelTime,
  calculatePriceEstimate
};