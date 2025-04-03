import con from '../config/db.js';
import logger from '../config/logger.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { formatSuccessResponse, formatErrorResponse } from '../../utils/formatters/responseFormatter.js';
import { DatabaseError } from '../utils/errors/customErrors.js';

/**
 * Add a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addReview = (req, res) => {
    try {
        // Validate required fields
        const { request_id, customer_id, driver_id, rating, review_text } = req.body;
        
        if (!request_id || !customer_id || !driver_id || !rating) {
            logger.warn('Missing required fields for review', { 
                request_id, customer_id, driver_id, rating 
            });
            return res.status(STATUS_CODES.BAD_REQUEST).json(
                formatErrorResponse('กรุณากรอกข้อมูลให้ครบถ้วน')
            );
        }

        // Validate rating range (1-5)
        if (rating < 1 || rating > 5) {
            logger.warn('Invalid rating value', { rating });
            return res.status(STATUS_CODES.BAD_REQUEST).json(
                formatErrorResponse('คะแนนต้องอยู่ระหว่าง 1-5')
            );
        }

        const sql = `
            INSERT INTO reviews (
                request_id,
                customer_id,
                driver_id,
                rating,
                review_text,
                created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

        const values = [
            request_id,
            customer_id,
            driver_id,
            rating,
            review_text || null
        ];

        con.query(sql, values, (err, result) => {
            if (err) {
                logger.error('Error adding review', { error: err.message });
                return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
                    formatErrorResponse('เกิดข้อผิดพลาดในการบันทึกรีวิว')
                );
            }
            
            logger.info('Review added successfully', { 
                reviewId: result.insertId,
                driverId: driver_id
            });
            
            return res.status(STATUS_CODES.CREATED).json(
                formatSuccessResponse({ InsertId: result.insertId }, 'บันทึกรีวิวเรียบร้อยแล้ว')
            );
        });
    } catch (error) {
        logger.error('Unexpected error in addReview', { error: error.message });
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('เกิดข้อผิดพลาดในการบันทึกรีวิว')
        );
    }
};

/**
 * Get reviews for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverReviews = (req, res) => {
    try {
        const { driver_id } = req.params;
        
        if (!driver_id) {
            logger.warn('Missing driver_id for reviews');
            return res.status(STATUS_CODES.BAD_REQUEST).json(
                formatErrorResponse('กรุณาระบุ driver_id')
            );
        }

        const sql = `
            SELECT 
                r.review_id,
                r.customer_id,
                r.request_id,
                r.rating,
                r.review_text,
                r.created_at,
                c.first_name AS customer_first_name,
                c.last_name AS customer_last_name
            FROM reviews r
            LEFT JOIN customers c ON r.customer_id = c.customer_id
            WHERE r.driver_id = ?
            ORDER BY r.created_at DESC
        `;

        con.query(sql, [driver_id], (err, result) => {
            if (err) {
                logger.error('Error getting driver reviews', { 
                    driver_id, error: err.message 
                });
                return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
                    formatErrorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว')
                );
            }
            
            return res.status(STATUS_CODES.OK).json(
                formatSuccessResponse({ Result: result }, 'ดึงข้อมูลรีวิวสำเร็จ')
            );
        });
    } catch (error) {
        logger.error('Unexpected error in getDriverReviews', { error: error.message });
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว')
        );
    }
};

/**
 * Get driver's average rating
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverRating = (req, res) => {
    try {
        const { driver_id } = req.params;
        
        if (!driver_id) {
            logger.warn('Missing driver_id for rating');
            return res.status(STATUS_CODES.BAD_REQUEST).json(
                formatErrorResponse('กรุณาระบุ driver_id')
            );
        }

        const sql = `
            SELECT 
                AVG(rating) AS average_rating,
                COUNT(*) AS total_reviews
            FROM reviews
            WHERE driver_id = ?
        `;

        con.query(sql, [driver_id], (err, result) => {
            if (err) {
                logger.error('Error getting driver rating', { 
                    driver_id, error: err.message 
                });
                return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
                    formatErrorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน')
                );
            }
            
            const averageRating = result[0].average_rating 
                ? parseFloat(result[0].average_rating).toFixed(1) 
                : 0;
            
            return res.status(STATUS_CODES.OK).json(
                formatSuccessResponse({
                    average_rating: averageRating,
                    total_reviews: result[0].total_reviews
                }, 'ดึงข้อมูลคะแนนเฉลี่ยสำเร็จ')
            );
        });
    } catch (error) {
        logger.error('Unexpected error in getDriverRating', { error: error.message });
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            formatErrorResponse('เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน')
        );
    }
};