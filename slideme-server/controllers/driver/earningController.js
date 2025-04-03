import con from "../../config/db.js";
import logger from "../../config/logger.js";

/**
 * Get driver total earnings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTotalEarnings = (req, res) => {
  const { driver_id } = req.query;
  const period = req.query.period || "all"; // Possible values: day, week, month, year, all

  if (!driver_id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ driver_id" });
  }

  // Build WHERE clause based on period
  let timeCondition = "";
  switch (period) {
    case "day":
      timeCondition = "AND DATE(r.request_time) = CURDATE()";
      break;
    case "week":
      timeCondition = "AND YEARWEEK(r.request_time, 1) = YEARWEEK(CURDATE(), 1)";
      break;
    case "month":
      timeCondition = "AND YEAR(r.request_time) = YEAR(CURDATE()) AND MONTH(r.request_time) = MONTH(CURDATE())";
      break;
    case "year":
      timeCondition = "AND YEAR(r.request_time) = YEAR(CURDATE())";
      break;
    default:
      timeCondition = "";
  }

  const sql = `
    SELECT 
      SUM(o.offered_price) AS total_earnings,
      COUNT(r.request_id) AS total_trips
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    WHERE o.driver_id = ?
    AND r.status = 'completed'
    ${timeCondition}
  `;

  con.query(sql, [driver_id], (err, result) => {
    if (err) {
      logger.error("Database error fetching earnings", { error: err.message, driver_id });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    const earnings = {
      total_earnings: result[0].total_earnings || 0,
      total_trips: result[0].total_trips || 0,
      period
    };

    return res.status(200).json({ Status: true, Result: earnings });
  });
};

/**
 * Get driver earnings history with details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEarningsHistory = (req, res) => {
  const { driver_id } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  if (!driver_id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ driver_id" });
  }

  const sql = `
    SELECT 
      r.request_id,
      r.location_from,
      r.location_to,
      r.status,
      r.request_time,
      o.offered_price,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    JOIN customers c ON r.customer_id = c.customer_id
    WHERE o.driver_id = ?
    AND r.status = 'completed'
    ORDER BY r.request_time DESC
    LIMIT ? OFFSET ?
  `;

  con.query(sql, [driver_id, limit, offset], (err, result) => {
    if (err) {
      logger.error("Database error fetching earnings history", { error: err.message, driver_id });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    // Fetch total count for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM servicerequests r
      JOIN driveroffers o ON r.offer_id = o.offer_id
      WHERE o.driver_id = ?
      AND r.status = 'completed'
    `;

    con.query(countSql, [driver_id], (countErr, countResult) => {
      if (countErr) {
        logger.error("Database error fetching earnings count", { error: countErr.message, driver_id });
        // Continue with results anyway
        return res.status(200).json({ 
          Status: true, 
          Result: result,
          pagination: {
            limit,
            offset,
            total: null
          }
        });
      }

      return res.status(200).json({ 
        Status: true, 
        Result: result,
        pagination: {
          limit,
          offset,
          total: countResult[0].total
        }
      });
    });
  });
};

/**
 * Get earnings breakdown by time periods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEarningsBreakdown = (req, res) => {
  const { driver_id } = req.query;

  if (!driver_id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ driver_id" });
  }

  // Daily earnings for the last 7 days
  const dailySql = `
    SELECT 
      DATE(r.request_time) AS date,
      SUM(o.offered_price) AS earnings,
      COUNT(r.request_id) AS trips
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    WHERE o.driver_id = ?
    AND r.status = 'completed'
    AND r.request_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(r.request_time)
    ORDER BY date DESC
  `;

  // Monthly earnings for the last 6 months
  const monthlySql = `
    SELECT 
      DATE_FORMAT(r.request_time, '%Y-%m') AS month,
      SUM(o.offered_price) AS earnings,
      COUNT(r.request_id) AS trips
    FROM servicerequests r
    JOIN driveroffers o ON r.offer_id = o.offer_id
    WHERE o.driver_id = ?
    AND r.status = 'completed'
    AND r.request_time >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(r.request_time, '%Y-%m')
    ORDER BY month DESC
  `;

  // Execute both queries
  con.query(dailySql, [driver_id], (dailyErr, dailyResult) => {
    if (dailyErr) {
      logger.error("Database error fetching daily earnings", { error: dailyErr.message, driver_id });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    con.query(monthlySql, [driver_id], (monthlyErr, monthlyResult) => {
      if (monthlyErr) {
        logger.error("Database error fetching monthly earnings", { error: monthlyErr.message, driver_id });
        // Continue with daily results
        return res.status(200).json({
          Status: true,
          Result: {
            daily: dailyResult,
            monthly: []
          }
        });
      }

      return res.status(200).json({
        Status: true,
        Result: {
          daily: dailyResult,
          monthly: monthlyResult
        }
      });
    });
  });
};

/**
 * Get current day profit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTodayProfit = (req, res) => {
  const { driver_id } = req.query;

  if (!driver_id) {
    return res.status(400).json({ Status: false, Error: "กรุณาระบุ driver_id" });
  }

  const sql = `
    SELECT
      SUM(d.offered_price) AS profit_today,
      COUNT(s.request_id) AS trips_today
    FROM
      driveroffers d
    LEFT JOIN 
      servicerequests s ON s.request_id = d.request_id
    WHERE
      d.driver_id = ?
      AND s.status = 'completed'
      AND DATE(s.request_time) = CURDATE();
  `;

  con.query(sql, [driver_id], (err, result) => {
    if (err) {
      logger.error("Database error fetching today's profit", { error: err.message, driver_id });
      return res.status(500).json({ Status: false, Error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }

    return res.status(200).json({ 
      Status: true, 
      Result: {
        profit_today: result[0].profit_today || 0,
        trips_today: result[0].trips_today || 0
      }
    });
  });
};

export default {
  getTotalEarnings,
  getEarningsHistory,
  getEarningsBreakdown,
  getTodayProfit
};