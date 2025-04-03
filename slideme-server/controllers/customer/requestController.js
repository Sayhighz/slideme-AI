import con from "../../config/db.js";
import logger from "../../config/logger.js";
import { validateCreateRequest } from "../../utils/validators/requestValidator.js";
import { formatSuccessResponse, formatErrorResponse } from "../../utils/formatters/responseFormatter.js";

/**
 * Create a new service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRequest = (req, res) => {
  // Extract request data
  const {
    customer_id,
    pickup_lat,
    pickup_long,
    location_from,
    dropoff_lat,
    dropoff_long,
    location_to,
    vehicletype_id,
    booking_time,
    customer_message
  } = req.body;

  // Validate request data
  const validation = validateCreateRequest(req.body);
  if (!validation.isValid) {
    return res.status(400).json(formatErrorResponse(
      "ข้อมูลคำขอไม่ถูกต้อง",
      validation.errors
    ));
  }

  // Insert request into database
  const sql = `
    INSERT INTO servicerequests (
      customer_id,
      pickup_lat,
      pickup_long,
      location_from,
      dropoff_lat,
      dropoff_long,
      location_to,
      vehicletype_id,
      booking_time,
      customer_message,
      status,
      request_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
  `;

  const values = [
    customer_id,
    pickup_lat,
    pickup_long,
    location_from,
    dropoff_lat,
    dropoff_long,
    location_to,
    vehicletype_id,
    booking_time || null,
    customer_message || null
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      logger.error("Error creating service request", { 
        customer_id, 
        error: err.message 
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการสร้างคำขอบริการ"));
    }

    // Attempt to fetch the newly created request details
    const request_id = result.insertId;
    const getRequestSql = `
      SELECT 
        r.request_id,
        r.customer_id,
        r.pickup_lat,
        r.pickup_long,
        r.location_from,
        r.dropoff_lat,
        r.dropoff_long,
        r.location_to,
        r.status,
        r.booking_time,
        r.request_time,
        r.customer_message,
        v.vehicletype_name
      FROM servicerequests r
      LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
      WHERE r.request_id = ?
    `;

    con.query(getRequestSql, [request_id], (getErr, getResult) => {
      if (getErr || getResult.length === 0) {
        // If we can't get the details, still return success with the ID
        return res.status(201).json(formatSuccessResponse({
          request_id: request_id
        }, "สร้างคำขอบริการสำเร็จ"));
      }

      // Return the full request details
      return res.status(201).json(formatSuccessResponse(
        getResult[0],
        "สร้างคำขอบริการสำเร็จ"
      ));
    });
  });
};

/**
 * Get service request details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestDetails = (req, res) => {
  const { request_id } = req.query;

  if (!request_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ request_id"));
  }

  const sql = `
    SELECT 
      r.request_id,
      r.customer_id,
      r.pickup_lat,
      r.pickup_long,
      r.location_from,
      r.dropoff_lat,
      r.dropoff_long,
      r.location_to,
      r.status,
      r.booking_time,
      r.request_time,
      r.customer_message,
      r.vehicletype_id,
      v.vehicletype_name,
      o.offer_id,
      o.driver_id,
      o.offered_price,
      d.first_name AS driver_first_name,
      d.last_name AS driver_last_name,
      d.phone_number AS driver_phone,
      d.license_plate,
      dd.current_latitude AS driver_current_lat,
      dd.current_longitude AS driver_current_lng
    FROM servicerequests r
    LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
    LEFT JOIN drivers d ON o.driver_id = d.driver_id
    LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
    WHERE r.request_id = ?
  `;

  con.query(sql, [request_id], (err, result) => {
    if (err) {
      logger.error("Error fetching request details", { request_id, error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอบริการ"));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบข้อมูลคำขอบริการ"));
    }

    return res.status(200).json(formatSuccessResponse(result[0], "ดึงข้อมูลคำขอบริการสำเร็จ"));
  });
};

/**
 * Get customer's service request history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequestHistory = (req, res) => {
  const { customer_id, status, limit, offset } = req.query;

  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
  }

  // Build SQL query with status filter if provided
  let sql = `
    SELECT 
      r.request_id,
      r.status,
      r.location_from,
      r.location_to,
      r.request_time,
      r.booking_time,
      v.vehicletype_name,
      o.offered_price,
      d.first_name AS driver_first_name,
      d.last_name AS driver_last_name,
      d.license_plate,
      (SELECT rating FROM reviews WHERE request_id = r.request_id) AS rating
    FROM servicerequests r
    LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
    LEFT JOIN drivers d ON o.driver_id = d.driver_id
    WHERE r.customer_id = ?
  `;

  const params = [customer_id];

  // Add status filter if provided
  if (status) {
    sql += " AND r.status = ?";
    params.push(status);
  }

  // Order by most recent
  sql += " ORDER BY r.request_time DESC";

  // Add pagination if provided
  if (limit) {
    sql += " LIMIT ?";
    params.push(parseInt(limit));

    if (offset) {
      sql += " OFFSET ?";
      params.push(parseInt(offset));
    }
  }

  con.query(sql, params, (err, result) => {
    if (err) {
      logger.error("Error fetching request history", { 
        customer_id, 
        status, 
        error: err.message 
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงประวัติคำขอบริการ"));
    }

    return res.status(200).json(formatSuccessResponse({
      total: result.length,
      requests: result
    }, "ดึงประวัติคำขอบริการสำเร็จ"));
  });
};

/**
 * Get customer's active request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveRequest = (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ customer_id"));
  }

  const sql = `
    SELECT 
      r.request_id,
      r.status,
      r.location_from,
      r.location_to,
      r.pickup_lat,
      r.pickup_long,
      r.dropoff_lat,
      r.dropoff_long,
      r.request_time,
      r.booking_time,
      r.customer_message,
      v.vehicletype_name,
      o.offer_id,
      o.driver_id,
      o.offered_price,
      d.first_name AS driver_first_name,
      d.last_name AS driver_last_name,
      d.phone_number AS driver_phone,
      d.license_plate,
      dd.current_latitude AS driver_current_lat,
      dd.current_longitude AS driver_current_lng,
      dd.updated_at AS driver_location_updated
    FROM servicerequests r
    LEFT JOIN vehicle_types v ON r.vehicletype_id = v.vehicletype_id
    LEFT JOIN driveroffers o ON r.offer_id = o.offer_id
    LEFT JOIN drivers d ON o.driver_id = d.driver_id
    LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
    WHERE r.customer_id = ? AND r.status IN ('pending', 'accepted')
    ORDER BY FIELD(r.status, 'accepted', 'pending'), r.request_time DESC
    LIMIT 1
  `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) {
      logger.error("Error fetching active request", { customer_id, error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอบริการที่กำลังดำเนินการ"));
    }

    if (result.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบคำขอบริการที่กำลังดำเนินการ"));
    }

    return res.status(200).json(formatSuccessResponse(result[0], "ดึงข้อมูลคำขอบริการที่กำลังดำเนินการสำเร็จ"));
  });
};

/**
 * Cancel a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const cancelRequest = (req, res) => {
  const { request_id, customer_id } = req.body;

  if (!request_id || !customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ request_id และ customer_id"));
  }

  // First, check if the request exists and belongs to the customer
  const checkSql = `
    SELECT status 
    FROM servicerequests 
    WHERE request_id = ? AND customer_id = ?
  `;

  con.query(checkSql, [request_id, customer_id], (checkErr, checkResult) => {
    if (checkErr) {
      logger.error("Error checking request for cancellation", { 
        request_id, 
        customer_id, 
        error: checkErr.message 
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอบริการ"));
    }

    if (checkResult.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบคำขอบริการที่ต้องการยกเลิก"));
    }

    const currentStatus = checkResult[0].status;

    // Check if the request can be canceled (only pending or accepted)
    if (currentStatus !== 'pending' && currentStatus !== 'accepted') {
      return res.status(400).json(formatErrorResponse(`ไม่สามารถยกเลิกคำขอบริการที่มีสถานะ ${currentStatus}`));
    }

    // Begin transaction to cancel request and related offers
    con.beginTransaction(err => {
      if (err) {
        logger.error("Error starting transaction for cancellation", { error: err.message });
        return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการยกเลิกคำขอบริการ"));
      }

      // Cancel the request
      const updateRequestSql = `
        UPDATE servicerequests 
        SET status = 'cancelled' 
        WHERE request_id = ? AND customer_id = ?
      `;

      con.query(updateRequestSql, [request_id, customer_id], (updateErr, updateResult) => {
        if (updateErr) {
          return con.rollback(() => {
            logger.error("Error updating request status", { error: updateErr.message });
            return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการยกเลิกคำขอบริการ"));
          });
        }

        // Update offer statuses to rejected
        const updateOffersSql = `
          UPDATE driveroffers 
          SET offer_status = 'rejected' 
          WHERE request_id = ? AND offer_status = 'pending'
        `;

        con.query(updateOffersSql, [request_id], (offerErr, offerResult) => {
          if (offerErr) {
            return con.rollback(() => {
              logger.error("Error updating offer statuses", { error: offerErr.message });
              return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการยกเลิกคำขอบริการ"));
            });
          }

          // Commit the transaction
          con.commit(commitErr => {
            if (commitErr) {
              return con.rollback(() => {
                logger.error("Error committing cancellation", { error: commitErr.message });
                return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการยกเลิกคำขอบริการ"));
              });
            }

            return res.status(200).json(formatSuccessResponse({
              request_id,
              previous_status: currentStatus,
              status: 'cancelled'
            }, "ยกเลิกคำขอบริการสำเร็จ"));
          });
        });
      });
    });
  });
};

/**
 * Get driver offers for a request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverOffers = (req, res) => {
  const { request_id, customer_id } = req.query;

  if (!request_id || !customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ request_id และ customer_id"));
  }

  // First verify that the request belongs to the customer
  const checkSql = `
    SELECT request_id 
    FROM servicerequests 
    WHERE request_id = ? AND customer_id = ?
  `;

  con.query(checkSql, [request_id, customer_id], (checkErr, checkResult) => {
    if (checkErr) {
      logger.error("Error checking request ownership", { 
        request_id, 
        customer_id, 
        error: checkErr.message 
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอบริการ"));
    }

    if (checkResult.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบคำขอบริการหรือคำขอบริการไม่ได้เป็นของลูกค้า"));
    }

    // Get driver offers
    const offersSql = `
      SELECT 
        o.offer_id,
        o.driver_id,
        o.offered_price,
        o.offer_status,
        o.created_at,
        d.first_name,
        d.last_name,
        d.license_plate,
        dd.current_latitude,
        dd.current_longitude,
        (SELECT AVG(rating) FROM reviews WHERE driver_id = d.driver_id) AS average_rating,
        (SELECT COUNT(*) FROM reviews WHERE driver_id = d.driver_id) AS total_reviews
      FROM driveroffers o
      JOIN drivers d ON o.driver_id = d.driver_id
      LEFT JOIN driverdetails dd ON d.driver_id = dd.driver_id
      WHERE o.request_id = ? AND o.offer_status = 'pending'
      ORDER BY o.offered_price ASC
    `;

    con.query(offersSql, [request_id], (offersErr, offersResult) => {
      if (offersErr) {
        logger.error("Error fetching driver offers", { 
          request_id, 
          error: offersErr.message 
        });
        return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการดึงข้อมูลข้อเสนอจากคนขับ"));
      }

      return res.status(200).json(formatSuccessResponse({
        request_id,
        offers_count: offersResult.length,
        offers: offersResult
      }, "ดึงข้อมูลข้อเสนอจากคนขับสำเร็จ"));
    });
  });
};

/**
 * Accept a driver's offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const acceptOffer = (req, res) => {
  const { request_id, customer_id, offer_id, payment_method_id } = req.body;

  if (!request_id || !customer_id || !offer_id || !payment_method_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุข้อมูลให้ครบถ้วน"));
  }

  // Start transaction
  con.beginTransaction(err => {
    if (err) {
      logger.error("Error starting transaction for accepting offer", { error: err.message });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตอบรับข้อเสนอ"));
    }

    // First, check if the request belongs to the customer and is in pending status
    const checkRequestSql = `
      SELECT status 
      FROM servicerequests 
      WHERE request_id = ? AND customer_id = ? AND status = 'pending'
    `;

    con.query(checkRequestSql, [request_id, customer_id], (checkErr, checkResult) => {
      if (checkErr) {
        return con.rollback(() => {
          logger.error("Error checking request status", { error: checkErr.message });
          return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอบริการ"));
        });
      }

      if (checkResult.length === 0) {
        return con.rollback(() => {
          return res.status(404).json(formatErrorResponse("ไม่พบคำขอบริการหรือคำขอบริการไม่อยู่ในสถานะรอตอบรับ"));
        });
      }

      // Check if the offer exists and is in pending status
      const checkOfferSql = `
        SELECT do.driver_id, do.offered_price 
        FROM driveroffers do
        WHERE do.offer_id = ? AND do.request_id = ? AND do.offer_status = 'pending'
      `;

      con.query(checkOfferSql, [offer_id, request_id], (offerErr, offerResult) => {
        if (offerErr) {
          return con.rollback(() => {
            logger.error("Error checking offer", { error: offerErr.message });
            return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบข้อเสนอ"));
          });
        }

        if (offerResult.length === 0) {
          return con.rollback(() => {
            return res.status(404).json(formatErrorResponse("ไม่พบข้อเสนอหรือข้อเสนอไม่อยู่ในสถานะรอตอบรับ"));
          });
        }

        const { driver_id, offered_price } = offerResult[0];

        // Create payment record
        const createPaymentSql = `
          INSERT INTO payments (
            customer_id, 
            amount, 
            payment_status, 
            payment_method_id, 
            created_at
          ) VALUES (?, ?, 'Pending', ?, NOW())
        `;

        con.query(createPaymentSql, [customer_id, offered_price, payment_method_id], (paymentErr, paymentResult) => {
          if (paymentErr) {
            return con.rollback(() => {
              logger.error("Error creating payment", { error: paymentErr.message });
              return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน"));
            });
          }

          const payment_id = paymentResult.insertId;

          // Update request status and set offer_id and payment_id
          const updateRequestSql = `
            UPDATE servicerequests 
            SET 
              status = 'accepted', 
              offer_id = ?,
              payment_id = ?
            WHERE request_id = ? AND customer_id = ?
          `;

          con.query(updateRequestSql, [offer_id, payment_id, request_id, customer_id], (updateRequestErr, updateRequestResult) => {
            if (updateRequestErr) {
              return con.rollback(() => {
                logger.error("Error updating request", { error: updateRequestErr.message });
                return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการอัปเดตคำขอบริการ"));
              });
            }

            // Accept the selected offer
            const acceptOfferSql = `
              UPDATE driveroffers 
              SET offer_status = 'accepted' 
              WHERE offer_id = ?
            `;

            con.query(acceptOfferSql, [offer_id], (acceptErr, acceptResult) => {
              if (acceptErr) {
                return con.rollback(() => {
                  logger.error("Error accepting offer", { error: acceptErr.message });
                  return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตอบรับข้อเสนอ"));
                });
              }

              // Reject all other offers
              const rejectOthersSql = `
                UPDATE driveroffers 
                SET offer_status = 'rejected' 
                WHERE request_id = ? AND offer_id != ?
              `;

              con.query(rejectOthersSql, [request_id, offer_id], (rejectErr, rejectResult) => {
                if (rejectErr) {
                  return con.rollback(() => {
                    logger.error("Error rejecting other offers", { error: rejectErr.message });
                    return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการปฏิเสธข้อเสนออื่น"));
                  });
                }

                // Commit the transaction
                con.commit(commitErr => {
                  if (commitErr) {
                    return con.rollback(() => {
                      logger.error("Error committing transaction", { error: commitErr.message });
                      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการบันทึกข้อมูล"));
                    });
                  }

                  return res.status(200).json(formatSuccessResponse({
                    request_id,
                    offer_id,
                    driver_id,
                    payment_id,
                    price: offered_price,
                    status: 'accepted'
                  }, "ตอบรับข้อเสนอสำเร็จ"));
                });
              });
            });
          });
        });
      });
    });
  });
};

/**
 * Complete a service request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeRequest = (req, res) => {
  const { request_id, customer_id } = req.body;

  if (!request_id || !customer_id) {
    return res.status(400).json(formatErrorResponse("กรุณาระบุ request_id และ customer_id"));
  }

  // Check if the request exists, belongs to the customer, and is in accepted status
  const checkSql = `
    SELECT r.request_id, r.status, o.driver_id, o.offered_price
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    WHERE r.request_id = ? AND r.customer_id = ? AND r.status = 'accepted'
  `;

  con.query(checkSql, [request_id, customer_id], (checkErr, checkResult) => {
    if (checkErr) {
      logger.error("Error checking request for completion", { 
        request_id, 
        customer_id, 
        error: checkErr.message 
      });
      return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการตรวจสอบคำขอบริการ"));
    }

    if (checkResult.length === 0) {
      return res.status(404).json(formatErrorResponse("ไม่พบคำขอบริการที่ต้องการเสร็จสิ้น"));
    }

    const { driver_id, offered_price } = checkResult[0];

    // Update request status
    const updateSql = `
      UPDATE servicerequests 
      SET status = 'completed' 
      WHERE request_id = ? AND customer_id = ?
    `;

    con.query(updateSql, [request_id, customer_id], (updateErr, updateResult) => {
      if (updateErr) {
        logger.error("Error completing request", { 
          request_id, 
          customer_id, 
          error: updateErr.message 
        });
        return res.status(500).json(formatErrorResponse("เกิดข้อผิดพลาดในการเสร็จสิ้นคำขอบริการ"));
      }

      // Update payment status
      const updatePaymentSql = `
        UPDATE payments p
        JOIN servicerequests r ON p.payment_id = r.payment_id
        SET p.payment_status = 'Completed'
        WHERE r.request_id = ?
      `;

      con.query(updatePaymentSql, [request_id], (paymentErr, paymentResult) => {
        // Even if payment update fails, we proceed with completing the request
        if (paymentErr) {
          logger.error("Error updating payment status", { 
            request_id, 
            error: paymentErr.message 
          });
        }

        return res.status(200).json(formatSuccessResponse({
          request_id,
          driver_id,
          price: offered_price,
          status: 'completed'
        }, "เสร็จสิ้นคำขอบริการสำเร็จ"));
      });
    });
  });
};

export default {
  createRequest,
  getRequestDetails,
  getRequestHistory,
  getActiveRequest,
  cancelRequest,
  getDriverOffers,
  acceptOffer,
  completeRequest
};