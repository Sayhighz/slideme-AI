import path from 'path';
import fs from 'fs';
import con from '../config/db.js';

const uploadsDir = path.resolve("uploads");

export const fetchImage = (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ Status: false, Error: "Filename is required" });
  }

  const filePath = path.join(uploadsDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ Status: false, Error: "File not found" });
    }
    res.sendFile(filePath);
  });
}; //yes

export const uploadBeforeService = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ Status: false, Error: "No files uploaded" });
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    return res.status(400).json({ Status: false, Error: "request_id and driver_id are required" });
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
    if (err) return res.status(500).json({ Status: false, Error: err.message });
    res.json({ Status: true, InsertId: result.insertId, FilePaths: photoPaths });
  });
};

export const uploadAfterService = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ Status: false, Error: "No files uploaded" });
  }

  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    return res.status(400).json({ Status: false, Error: "request_id and driver_id are required" });
  }

  const photoPaths = req.files.map((file) => file.path);
  const photoPathsJSON = JSON.stringify(photoPaths);

  const sql = `
    UPDATE driverlogs 
    SET photo_after_service = ?
    WHERE request_id = ? AND driver_id = ?
  `;

  con.query(sql, [photoPathsJSON, request_id, driver_id], (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ Status: false, Error: "No matching record found to update" });
    }
    res.json({ Status: true, AffectedRows: result.affectedRows, FilePaths: photoPaths });
  });
};
