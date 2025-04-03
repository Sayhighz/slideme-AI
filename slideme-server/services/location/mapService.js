/**
 * Map service for directions and routes
 */
import axios from 'axios';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

// Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get route directions between two points
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise<Object>} Route information or null if routing fails
 */
export const getDirections = async (originLat, originLng, destLat, destLng) => {
  try {
    if (!originLat || !originLng || !destLat || !destLng) {
      logger.warn('Missing coordinates for directions');
      return null;
    }
    
    // Check if Google Maps API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      
      // Return mock directions in development for testing
      if (env.IS_DEVELOPMENT) {
        logger.info('Using mock directions in development');
        return {
          distance: { text: '5 km', value: 5000 },
          duration: { text: '15 mins', value: 900 },
          polyline: 'mock_polyline_encoding'
        };
      }
      
      return null;
    }
    
    // Make request to Google Maps Directions API
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    // Check if directions were successfully retrieved
    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      logger.info('Successfully retrieved directions', { 
        origin: `${originLat},${originLng}`, 
        destination: `${destLat},${destLng}` 
      });
      
      return {
        distance: leg.distance,
        duration: leg.duration,
        polyline: route.overview_polyline.points
      };
    } else {
      logger.warn('Failed to retrieve directions', { 
        origin: `${originLat},${originLng}`, 
        destination: `${destLat},${destLng}`,
        status: response.data.status,
        error: response.data.error_message 
      });
      
      return null;
    }
  } catch (error) {
    logger.error('Error getting directions', { 
      origin: `${originLat},${originLng}`, 
      destination: `${destLat},${destLng}`,
      error: error.message 
    });
    
    return null;
  }
};

/**
 * Find nearby drivers
 * @param {number} latitude - Customer latitude
 * @param {number} longitude - Customer longitude
 * @param {number} radius - Search radius in kilometers
 * @param {number} vehicleTypeId - Vehicle type ID to filter drivers
 * @returns {Promise<Array>} Array of nearby drivers or empty array if none found
 */
export const findNearbyDrivers = async (latitude, longitude, radius = 10, vehicleTypeId = null) => {
  try {
    if (!latitude || !longitude) {
      logger.warn('Missing coordinates for nearby driver search');
      return [];
    }
    
    // Convert radius from kilometers to meters
    const radiusInKm = radius;
    
    // SQL query to find drivers within radius
    // Uses Haversine formula directly in SQL
    let query = `
      SELECT 
        d.driver_id, 
        d.first_name, 
        d.last_name, 
        d.license_plate,
        d.vehicletype_id,
        dd.current_latitude,
        dd.current_longitude,
        v.vehicletype_name,
        (
          6371 * acos(
            cos(radians(?)) * 
            cos(radians(dd.current_latitude)) * 
            cos(radians(dd.current_longitude) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(dd.current_latitude))
          )
        ) AS distance
      FROM drivers d
      JOIN driverdetails dd ON d.driver_id = dd.driver_id
      JOIN vehicle_types v ON d.vehicletype_id = v.vehicletype_id
      WHERE d.approval_status = 'approved'
      AND dd.current_latitude IS NOT NULL
      AND dd.current_longitude IS NOT NULL
    `;
    
    const params = [latitude, longitude, latitude];
    
    // Add vehicle type filter if specified
    if (vehicleTypeId) {
      query += ` AND d.vehicletype_id = ?`;
      params.push(vehicleTypeId);
    }
    
    // Add radius filter and order by distance
    query += ` HAVING distance <= ? ORDER BY distance ASC`;
    params.push(radiusInKm);
    
    // Execute query
    const db = (await import('../../config/db.js')).default;
    const drivers = await db.query(query, params);
    
    logger.info('Found nearby drivers', { 
      count: drivers.length,
      latitude,
      longitude,
      radius: radiusInKm
    });
    
    return drivers;
  } catch (error) {
    logger.error('Error finding nearby drivers', { 
      latitude,
      longitude,
      radius,
      error: error.message 
    });
    
    return [];
  }
};

/**
 * Generate static map image URL
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} zoom - Map zoom level (1-20)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {Array} markers - Array of marker objects {lat, lng, label}
 * @returns {string} Static map URL or null if generation fails
 */
export const generateStaticMapUrl = (latitude, longitude, zoom = 14, width = 600, height = 300, markers = []) => {
  try {
    if (!latitude || !longitude) {
      logger.warn('Missing coordinates for static map');
      return null;
    }
    
    // Check if Google Maps API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      return null;
    }
    
    // Base URL
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}`;
    
    // Add markers
    markers.forEach(marker => {
      const label = marker.label ? `label:${marker.label}|` : '';
      url += `&markers=${label}${marker.lat},${marker.lng}`;
    });
    
    // Add API key
    url += `&key=${GOOGLE_MAPS_API_KEY}`;
    
    return url;
  } catch (error) {
    logger.error('Error generating static map URL', { error: error.message });
    return null;
  }
};

export default {
  getDirections,
  findNearbyDrivers,
  generateStaticMapUrl
};