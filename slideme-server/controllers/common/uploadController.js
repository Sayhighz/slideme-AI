import path from 'path';
import fs from 'fs';
import logger from "../../config/logger.js";
import con from '../../config/db.js';
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";

const uploadsDir = path.resolve("uploads");

/**
 * Fetch image from server
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const fetchImage = (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json(formatErrorResponse("Filename is required"));
  }

  const filePath = path.join(uploadsDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.warn('File not found', { filename });
      return res.status(404).json(formatErrorResponse("File not found"));
    }
    res.sendFile(filePath);
  });
};

/**
 * Upload photos before service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadBeforeService = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json(formatErrorResponse("No files uploaded"));
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    return res.status(400).json(formatErrorResponse("request_id and driver_id are required"));
  }

  const photoPaths = req.files.map((file) => file.path);
  const photoPathsJSON = JSON.stringify(photoPaths);

  const sql = `
    INSERT INTO driverlogs (
      request_id,
      driver_id,
      photo_before_service
    ) VALUES (?, ?, ?)
  `;

  con.query(sql, [request_id, driver_id, photoPathsJSON], (err, result) => {
    if (err) {
      logger.error('Error uploading before service photos', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }
    
    res.json(formatSuccessResponse({
      InsertId: result.insertId, 
      FilePaths: photoPaths
    }, "Photos uploaded successfully"));
  });
};

/**
 * Upload photos after service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadAfterService = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json(formatErrorResponse("No files uploaded"));
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    return res.status(400).json(formatErrorResponse("request_id and driver_id are required"));
  }

  const photoPaths = req.files.map((file) => file.path);
  const photoPathsJSON = JSON.stringify(photoPaths);

  const sql = `
    UPDATE driverlogs 
    SET photo_after_service = ?
    WHERE request_id = ? AND driver_id = ?
  `;

  con.query(sql, [photoPathsJSON, request_id, driver_id], (err, result) => {
    if (err) {
      logger.error('Error uploading after service photos', { error: err.message });
      return res.status(500).json(formatErrorResponse(err.message));
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json(formatErrorResponse("No matching record found to update"));
    }
    
    res.json(formatSuccessResponse({
      AffectedRows: result.affectedRows, 
      FilePaths: photoPaths
    }, "Photos uploaded successfully"));
  });
};