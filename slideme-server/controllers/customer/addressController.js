import con from "../config/db.js";
import logger from "../../config/logger.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";
import { validateAddress, validateBookmark } from "../../utils/validators/addressValidator.js";

/**
 * Edit address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const editAddress = (req, res) => {
  const validation = validateAddress(req.body);
  if (!validation.isValid) {
    return res.status(400).json(formatErrorResponse(validation.errors.join(", ")));
  }

  const sql = `
    UPDATE addresses 
    SET 
      save_name = ?, 
      location_from = ?,
      pickup_lat = ?,
      pickup_long = ?,
      location_to = ?,
      dropoff_lat = ?, 
      dropoff_long = ?,
      vehicletype_id = ?
    WHERE address_id = ?
  `;

  const values = [
    req.body.save_name,
    req.body.location_from,
    req.body.pickup_lat,
    req.body.pickup_long,
    req.body.location_to,
    req.body.dropoff_lat,
    req.body.dropoff_long,
    req.body.vehicletype_id,
    req.body.address_id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error editing address', { error: err.message });
      return res.json(formatErrorResponse(err.message));
    }
    
    return res.json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
    }, "Address updated successfully"));
  });
};

/**
 * Add bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addBookmark = (req, res) => {
  const validation = validateBookmark(req.body);
  if (!validation.isValid) {
    return res.status(400).json(formatErrorResponse(validation.errors.join(", ")));
  }

  const sql = `
    INSERT INTO addresses (
      customer_id,
      save_name,
      location_from,
      pickup_lat,
      pickup_long,
      location_to,
      dropoff_lat,  
      dropoff_long,
      vehicletype_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    req.body.customer_id,
    req.body.save_name,
    req.body.location_from,
    req.body.pickup_lat,
    req.body.pickup_long,
    req.body.location_to,
    req.body.dropoff_lat,
    req.body.dropoff_long,
    req.body.vehicletype_id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error adding bookmark', { error: err.message });
      return res.json(formatErrorResponse(err.message));
    }
    
    return res.json(formatSuccessResponse({
      InsertId: result.insertId
    }, "Bookmark added successfully"));
  });
};

/**
 * Disable bookmark
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disableBookmark = (req, res) => {
  if (!req.body.address_id) {
    return res.status(400).json(formatErrorResponse("address_id is required"));
  }

  const sql = `
    UPDATE addresses 
    SET 
      is_deleted = 1
    WHERE address_id = ?
  `;

  const values = [req.body.address_id];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error('Error disabling bookmark', { error: err.message });
      return res.json(formatErrorResponse(err.message));
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("Address not found"));
    }
    
    return res.json(formatSuccessResponse({
      AffectedRows: result.affectedRows,
    }, "Bookmark disabled successfully"));
  });
};

/**
 * Get user bookmarks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getuserBookmarks = (req, res) => {
  const customer_id = req.query.customer_id || null;
  
  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("customer_id is required"));
  }
  
  const sql = `
    SELECT
      address_id,
      save_name,
      location_from,
      pickup_lat,
      pickup_long,
      location_to,
      dropoff_lat,
      dropoff_long,
      vehicletype_id
    FROM
      addresses
    WHERE
      customer_id = ?
      AND is_deleted = 0;
  `;
  
  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error fetching bookmarks', { error: err.message });
      return res.json(formatErrorResponse(err.message));
    }
    
    return res.json(formatSuccessResponse(result));
  });
};

/**
 * Get service info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getServiceInfo = (req, res) => {
  const request_id = req.query.request_id || null;
  
  if (!request_id) {
    return res.status(400).json(formatErrorResponse("request_id is required"));
  }
  
  const sql = `
    SELECT 
      c.first_name,
      c.last_name,
      AVG(r.rating) AS average_rating,
      do.offered_price AS price,
      sr.location_from,
      sr.pickup_lat,
      sr.pickup_long,
      sr.location_to,
      sr.dropoff_lat,
      sr.dropoff_long
    FROM servicerequests sr
    INNER JOIN customers c 
      ON sr.customer_id = c.customer_id
    INNER JOIN driveroffers do 
      ON sr.request_id = do.request_id
      AND do.offer_status = 'accepted'
    LEFT JOIN reviews r 
      ON do.driver_id = r.driver_id
    WHERE sr.request_id = ?
    GROUP BY
      sr.request_id,
      c.first_name,
      c.last_name,
      do.offered_price,
      sr.pickup_lat,
      sr.pickup_long,
      sr.location_from,
      sr.dropoff_lat,
      sr.dropoff_long,
      sr.location_to;
  `;
  
  con.query(sql, [request_id], (err, result) => {
    if (err) {
      logger.error('Error fetching service info', { error: err.message });
      return res.json(formatErrorResponse(err.message));
    }
    
    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("Service not found"));
    }
    
    return res.json(formatSuccessResponse(result));
  });
};

/**
 * Get order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const orderStatus = (req, res) => {
  const { customer_id } = req.params;
  
  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("customer_id is required"));
  }
  
  const sql = `
    SELECT sr.request_id, do.driver_id, sr.status
    FROM servicerequests sr
    INNER JOIN driveroffers do 
      ON sr.request_id = do.request_id
      AND do.offer_status = 'accepted'
    WHERE sr.customer_id = ? 
    ORDER BY sr.request_time DESC
    LIMIT 1;
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error('Error fetching order status', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("No accepted records found for customer_id"));
    }

    return res.status(200).json(formatSuccessResponse(result[0]));
  });
};

/**
 * Check status order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkStatusOrder = (req, res) => {
  const { request_id } = req.params;

  if (isNaN(request_id)) {
    return res.status(400).json(formatErrorResponse("request_id must be a number"));
  }

  const query = `SELECT status FROM servicerequests WHERE request_id = ?`;

  con.query(query, [request_id], (err, result) => {
    if (err) {
      logger.error('Error checking status order', { error: err.message });
      return res.status(500).json(formatErrorResponse("Server error"));
    }

    if (result.length > 0) {
      return res.status(200).json(formatSuccessResponse({
        RequestId: request_id,
        StatusOrder: result[0].status
      }));
    } else {
      return res.status(404).json(formatErrorResponse("Request not found"));
    }
  });
};