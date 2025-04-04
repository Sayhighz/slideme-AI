/**
 * Driver earnings controller
 * Handles driver earnings-related functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { ValidationError, NotFoundError, DatabaseError } from '../../utils/errors/customErrors.js';
import { ERROR_MESSAGES } from '../../utils/errors/errorMessages.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import { roundTo, percentage } from '../../utils/helpers/mathHelpers.js';
import { formatThaiBaht } from '../../utils/formatters/currencyFormatter.js';
import { formatDisplayDate, formatTimeString } from '../../utils/formatters/dateFormatter.js';
import { calculateDriverPayout } from '../../utils/constants/paymentTypes.js';
import { groupBy } from '../../utils/helpers/arrayHelpers.js';
import walletService from '../../services/payment/walletService.js';

/**
 * Get driver total earnings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTotalEarnings = asyncHandler(async (req, res) => {
  const { driver_id } = req.query;
  const period = req.query.period || "all"; // Possible values: day, week, month, year, all

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ driver_id"
    ]);
  }

  // Verify driver exists
  const driverCheck = await db.query(
    "SELECT driver_id FROM drivers WHERE driver_id = ?",
    [driver_id]
  );

  if (driverCheck.length === 0) {
    throw new NotFoundError(ERROR_MESSAGES.RESOURCE.NOT_FOUND, [
      "ไม่พบข้อมูลคนขับ"
    ]);
  }

  try {
    // Use wallet service to get driver earnings
    const earningsData = await walletService.getDriverEarnings(driver_id, period);
    
    if (!earningsData) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR);
    }
    
    // Format the earnings data
    const formattedEarnings = {
      total_earnings: roundTo(earningsData.total_earnings),
      total_earnings_formatted: formatThaiBaht(earningsData.total_earnings),
      total_trips: earningsData.total_trips,
      period,
      recent_trips: earningsData.recent_trips?.map(trip => ({
        ...trip,
        driver_earnings_formatted: formatThaiBaht(trip.driver_earnings),
        request_date: formatDisplayDate(trip.request_time),
        request_time: formatTimeString(trip.request_time)
      }))
    };

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
      formattedEarnings,
      "ดึงข้อมูลรายได้สำเร็จ"
    ));
  } catch (error) {
    logger.error("Error fetching driver earnings", { 
      driver_id, 
      period, 
      error: error.message 
    });
    
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Get driver earnings history with details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEarningsHistory = asyncHandler(async (req, res) => {
    const { driver_id } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
  
    if (!driver_id) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
        "กรุณาระบุ driver_id"
      ]);
    }
  
    try {
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
        LIMIT ${limit} OFFSET ${offset}
      `;
  
      const result = await db.query(sql, [driver_id]);
  
      // Process the earnings - calculate driver payouts
      const formattedEarnings = result.map(trip => {
        const driverEarnings = calculateDriverPayout(trip.offered_price);
        
        return {
          ...trip,
          customer_name: `${trip.customer_first_name || ''} ${trip.customer_last_name || ''}`.trim(),
          total_fare: trip.offered_price,
          total_fare_formatted: formatThaiBaht(trip.offered_price),
          driver_earnings: driverEarnings,
          driver_earnings_formatted: formatThaiBaht(driverEarnings),
          service_fee: trip.offered_price - driverEarnings,
          service_fee_formatted: formatThaiBaht(trip.offered_price - driverEarnings),
          request_date: formatDisplayDate(trip.request_time),
          request_time: formatTimeString(trip.request_time)
        };
      });
  
      // Get total count for pagination
      const countSql = `
        SELECT COUNT(*) AS total
        FROM servicerequests r
        JOIN driveroffers o ON r.offer_id = o.offer_id
        WHERE o.driver_id = ?
        AND r.status = 'completed'
      `;
  
      const countResult = await db.query(countSql, [driver_id]);
      const total = countResult[0].total;
  
      return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
        earnings: formattedEarnings,
        pagination: {
          limit,
          offset,
          total,
          total_pages: Math.ceil(total / limit)
        }
      }, "ดึงประวัติรายได้สำเร็จ"));
    } catch (error) {
      logger.error("Error fetching earnings history", { 
        driver_id, 
        error: error.message 
      });
      
      // Changed from throwing to returning an error response
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
        formatErrorResponse(ERROR_MESSAGES.DATABASE.QUERY_ERROR)
      );
    }
  });

/**
 * Get earnings breakdown by time periods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEarningsBreakdown = asyncHandler(async (req, res) => {
  const { driver_id } = req.query;

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ driver_id"
    ]);
  }

  try {
    // Get earnings breakdown from wallet service
    const breakdownData = await walletService.getEarningsBreakdown(driver_id);
    
    if (!breakdownData) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR);
    }
    
    // Format daily earnings
    const formattedDailyEarnings = breakdownData.daily.map(day => ({
      date: day.date,
      formatted_date: formatDisplayDate(day.date),
      earnings: roundTo(day.earnings),
      earnings_formatted: formatThaiBaht(day.earnings),
      trips: day.trips
    }));
    
    // Format weekly earnings
    const formattedWeeklyEarnings = breakdownData.weekly.map(week => ({
      week: week.week,
      week_start: week.week_start,
      formatted_date: formatDisplayDate(week.week_start),
      earnings: roundTo(week.earnings),
      earnings_formatted: formatThaiBaht(week.earnings),
      trips: week.trips
    }));
    
    // Format monthly earnings
    const formattedMonthlyEarnings = breakdownData.monthly.map(month => {
      // Parse month string (YYYY-MM)
      const [year, monthNum] = month.month.split('-');
      const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      
      return {
        month: month.month,
        formatted_month: monthDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }),
        earnings: roundTo(month.earnings),
        earnings_formatted: formatThaiBaht(month.earnings),
        trips: month.trips
      };
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      daily: formattedDailyEarnings,
      weekly: formattedWeeklyEarnings,
      monthly: formattedMonthlyEarnings
    }, "ดึงข้อมูลรายได้ตามช่วงเวลาสำเร็จ"));
  } catch (error) {
    logger.error("Error fetching earnings breakdown", { 
      driver_id, 
      error: error.message 
    });
    
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Get current day profit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTodayProfit = asyncHandler(async (req, res) => {
  const { driver_id } = req.query;

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ driver_id"
    ]);
  }

  try {
    const sql = `
      SELECT
        SUM(d.offered_price) AS total_fare,
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

    const result = await db.query(sql, [driver_id]);
    
    // Calculate driver's actual earnings (after fees)
    const totalFare = result[0].total_fare || 0;
    const driverEarnings = calculateDriverPayout(totalFare);
    
    // Get completed trips with details
    const tripsSql = `
      SELECT 
        r.request_id,
        r.location_from,
        r.location_to,
        r.request_time,
        o.offered_price
      FROM servicerequests r
      JOIN driveroffers o ON r.offer_id = o.offer_id
      WHERE o.driver_id = ?
      AND r.status = 'completed'
      AND DATE(r.request_time) = CURDATE()
      ORDER BY r.request_time DESC
    `;
    
    const tripsResult = await db.query(tripsSql, [driver_id]);
    
    // Format trips data
    const formattedTrips = tripsResult.map(trip => {
      const tripEarnings = calculateDriverPayout(trip.offered_price);
      
      return {
        request_id: trip.request_id,
        location_from: trip.location_from,
        location_to: trip.location_to,
        request_time: formatTimeString(trip.request_time),
        total_fare: trip.offered_price,
        total_fare_formatted: formatThaiBaht(trip.offered_price),
        driver_earnings: tripEarnings,
        driver_earnings_formatted: formatThaiBaht(tripEarnings)
      };
    });

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse({
      total_fare: totalFare,
      total_fare_formatted: formatThaiBaht(totalFare),
      profit_today: driverEarnings,
      profit_today_formatted: formatThaiBaht(driverEarnings),
      trips_today: result[0].trips_today || 0,
      trips: formattedTrips
    }, "ดึงข้อมูลรายได้วันนี้สำเร็จ"));
  } catch (error) {
    logger.error("Error fetching today's profit", { 
      driver_id, 
      error: error.message 
    });
    
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Get earnings summary statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getEarningsSummary = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ driver_id"
    ]);
  }

  try {
    // Get today's earnings
    const todaySql = `
      SELECT
        COALESCE(SUM(d.offered_price), 0) AS today_total,
        COUNT(s.request_id) AS today_trips
      FROM
        driveroffers d
      LEFT JOIN 
        servicerequests s ON s.request_id = d.request_id
      WHERE
        d.driver_id = ?
        AND s.status = 'completed'
        AND DATE(s.request_time) = CURDATE()
    `;
    
    // Get this week's earnings (starting from Sunday)
    const weekSql = `
      SELECT
        COALESCE(SUM(d.offered_price), 0) AS week_total,
        COUNT(s.request_id) AS week_trips
      FROM
        driveroffers d
      LEFT JOIN 
        servicerequests s ON s.request_id = d.request_id
      WHERE
        d.driver_id = ?
        AND s.status = 'completed'
        AND YEARWEEK(s.request_time, 1) = YEARWEEK(CURDATE(), 1)
    `;
    
    // Get this month's earnings
    const monthSql = `
      SELECT
        COALESCE(SUM(d.offered_price), 0) AS month_total,
        COUNT(s.request_id) AS month_trips
      FROM
        driveroffers d
      LEFT JOIN 
        servicerequests s ON s.request_id = d.request_id
      WHERE
        d.driver_id = ?
        AND s.status = 'completed'
        AND YEAR(s.request_time) = YEAR(CURDATE()) 
        AND MONTH(s.request_time) = MONTH(CURDATE())
    `;
    
    // Get all-time earnings
    const allTimeSql = `
      SELECT
        COALESCE(SUM(d.offered_price), 0) AS all_time_total,
        COUNT(s.request_id) AS all_time_trips
      FROM
        driveroffers d
      LEFT JOIN 
        servicerequests s ON s.request_id = d.request_id
      WHERE
        d.driver_id = ?
        AND s.status = 'completed'
    `;
    
    // Execute all queries in parallel
    const [todayResult, weekResult, monthResult, allTimeResult] = await Promise.all([
      db.query(todaySql, [driver_id]),
      db.query(weekSql, [driver_id]),
      db.query(monthSql, [driver_id]),
      db.query(allTimeSql, [driver_id])
    ]);
    
    // Calculate driver's actual earnings
    const todayEarnings = calculateDriverPayout(todayResult[0].today_total || 0);
    const weekEarnings = calculateDriverPayout(weekResult[0].week_total || 0);
    const monthEarnings = calculateDriverPayout(monthResult[0].month_total || 0);
    const allTimeEarnings = calculateDriverPayout(allTimeResult[0].all_time_total || 0);
    
    // Format the summary data
    const summary = {
      today: {
        earnings: todayEarnings,
        earnings_formatted: formatThaiBaht(todayEarnings),
        trips: todayResult[0].today_trips || 0
      },
      this_week: {
        earnings: weekEarnings,
        earnings_formatted: formatThaiBaht(weekEarnings),
        trips: weekResult[0].week_trips || 0
      },
      this_month: {
        earnings: monthEarnings,
        earnings_formatted: formatThaiBaht(monthEarnings),
        trips: monthResult[0].month_trips || 0
      },
      all_time: {
        earnings: allTimeEarnings,
        earnings_formatted: formatThaiBaht(allTimeEarnings),
        trips: allTimeResult[0].all_time_trips || 0
      }
    };

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
      summary,
      "ดึงข้อมูลสรุปรายได้สำเร็จ"
    ));
  } catch (error) {
    logger.error("Error fetching earnings summary", { 
      driver_id, 
      error: error.message 
    });
    
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

/**
 * Get daily earnings chart data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDailyEarningsChart = asyncHandler(async (req, res) => {
  const { driver_id } = req.params;
  const days = parseInt(req.query.days) || 7; // Default to 7 days

  if (!driver_id) {
    throw new ValidationError(ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD, [
      "กรุณาระบุ driver_id"
    ]);
  }

  // Limit the number of days to a reasonable range
  if (days < 1 || days > 30) {
    throw new ValidationError("จำนวนวันต้องอยู่ระหว่าง 1 ถึง 30 วัน");
  }

  try {
    const sql = `
      SELECT 
        DATE(s.request_time) AS date,
        SUM(o.offered_price) AS total_fare,
        COUNT(s.request_id) AS trips
      FROM servicerequests s
      JOIN driveroffers o ON s.offer_id = o.offer_id
      WHERE o.driver_id = ?
      AND s.status = 'completed'
      AND s.request_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(s.request_time)
      ORDER BY date ASC
    `;

    const results = await db.query(sql, [driver_id, days]);
    
    // Create a complete date range with 0 values for missing dates
    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      dateRange.push({
        date: date.toISOString().split('T')[0],
        total_fare: 0,
        driver_earnings: 0,
        trips: 0
      });
    }
    
    // Fill in actual data
    results.forEach(result => {
      const dateStr = new Date(result.date).toISOString().split('T')[0];
      const index = dateRange.findIndex(item => item.date === dateStr);
      
      if (index !== -1) {
        const driverEarnings = calculateDriverPayout(result.total_fare);
        
        dateRange[index] = {
          date: dateStr,
          total_fare: result.total_fare,
          driver_earnings: driverEarnings,
          trips: result.trips
        };
      }
    });
    
    // Format the chart data
    const chartData = dateRange.map(day => ({
      date: day.date,
      formatted_date: formatDisplayDate(day.date),
      short_date: new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      total_fare: day.total_fare,
      total_fare_formatted: formatThaiBaht(day.total_fare),
      driver_earnings: day.driver_earnings,
      driver_earnings_formatted: formatThaiBaht(day.driver_earnings),
      trips: day.trips
    }));

    return res.status(STATUS_CODES.OK).json(formatSuccessResponse(
      chartData,
      "ดึงข้อมูลกราฟรายได้รายวันสำเร็จ"
    ));
  } catch (error) {
    logger.error("Error fetching daily earnings chart data", { 
      driver_id, 
      days, 
      error: error.message 
    });
    
    throw new DatabaseError(ERROR_MESSAGES.DATABASE.QUERY_ERROR, error);
  }
});

export default {
  getTotalEarnings,
  getEarningsHistory,
  getEarningsBreakdown,
  getTodayProfit,
  getEarningsSummary,
  getDailyEarningsChart
};