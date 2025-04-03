/**
 * Geocoding service
 */
import axios from 'axios';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

// Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Convert address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates {lat, lng} or null if geocoding fails
 */
export const geocodeAddress = async (address) => {
  try {
    if (!address) {
      logger.warn('No address provided for geocoding');
      return null;
    }
    
    // Check if Google Maps API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      
      // Return mock geocoding in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock geocoding in development');
        return {
          lat: 13.7563,
          lng: 100.5018
        };
      }
      
      return null;
    }
    
    // Make request to Google Maps Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    // Check if geocoding was successful
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      
      logger.info('Successfully geocoded address', { address });
      
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      logger.warn('Geocoding failed', { 
        address, 
        status: response.data.status,
        error: response.data.error_message 
      });
      
      return null;
    }
  } catch (error) {
    logger.error('Error geocoding address', { 
      address, 
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Convert coordinates to address (reverse geocoding)
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<string>} Address or null if reverse geocoding fails
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      logger.warn('Missing coordinates for reverse geocoding');
      return null;
    }
    
    // Check if Google Maps API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      
      // Return mock address in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock reverse geocoding in development');
        return 'Bangkok, Thailand';
      }
      
      return null;
    }
    
    // Make request to Google Maps Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    // Check if reverse geocoding was successful
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const address = response.data.results[0].formatted_address;
      
      logger.info('Successfully reverse geocoded coordinates', { 
        latitude, 
        longitude 
      });
      
      return address;
    } else {
      logger.warn('Reverse geocoding failed', { 
        latitude, 
        longitude, 
        status: response.data.status,
        error: response.data.error_message 
      });
      
      return null;
    }
  } catch (error) {
    logger.error('Error reverse geocoding coordinates', { 
      latitude, 
      longitude, 
      error: error.message 
    });
    
    return null;
  }
};

export default {
  geocodeAddress,
  reverseGeocode
};