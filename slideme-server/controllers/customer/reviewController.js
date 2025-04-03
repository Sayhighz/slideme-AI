/**
 * Customer review controller
 * Handles review management functionality
 */
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { STATUS_CODES } from '../../utils/constants/statusCodes.js';
import { formatSuccessResponse } from '../../utils/formatters/responseFormatter.js';
import { ValidationError, NotFoundError, DatabaseError } from '../../utils/errors/customErrors.js';
import { ERROR_MESSAGES, getValidationErrorMessage } from '../../utils/errors/errorMessages.js';
import { asyncHandler } from '../../utils/errors/errorHandler.js';
import { roundTo } from '../../utils/helpers/mathHelpers.js';
import { formatDisplayDate, formatTimeString } from '../../utils/formatters/dateFormatter.js';
import { truncate } from '../../utils/helpers/stringHelpers.js';
import pushNotificationService from '../../services/communication/pushNotificationService.js';
import socketService from '../../services/communication/socketService.js';

/**
 * Add a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addReview = asyncHandler(async (req, res) => {
    // Validate required fields
    const { request_id, customer_id, driver_id, rating, review_text } = req.body;
    
    if (!request_id || !customer_id || !driver_id || !rating) {
        logger.warn('Missing required fields for review', { 
            request_id, customer_id, driver_id, rating 
        });
        throw new ValidationError(
            ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
            ['request_id', 'customer_id', 'driver_id', 'rating']
        );
    }

    // Validate rating range (1-5)
    if (rating < 1 || rating > 5) {
        logger.warn('Invalid rating value', { rating });
        throw new ValidationError(
            getValidationErrorMessage('คะแนน', 'invalid'),
            ['Rating must be between 1 and 5']
        );
    }

    // Verify the request exists and belongs to the customer
    const requestCheck = await db.query(
        `SELECT status FROM servicerequests WHERE request_id = ? AND customer_id = ? AND status = 'completed'`,
        [request_id, customer_id]
    );

    if (requestCheck.length === 0) {
        throw new NotFoundError(
            ERROR_MESSAGES.RESOURCE.NOT_FOUND,
            ['No completed service request found for this customer']
        );
    }

    // Check if review already exists
    const reviewCheck = await db.query(
        `SELECT review_id FROM reviews WHERE request_id = ? AND customer_id = ?`,
        [request_id, customer_id]
    );

    if (reviewCheck.length > 0) {
        throw new ValidationError(
            'คุณได้รีวิวคำขอบริการนี้ไปแล้ว'
        );
    }

    // Insert the review
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

    try {
        const result = await db.query(sql, values);
        
        logger.info('Review added successfully', { 
            reviewId: result.insertId,
            driverId: driver_id
        });
        
        // Notify driver about new review via push notification
        try {
            // Get customer name for the notification
            const customerQuery = await db.query(
                `SELECT first_name, last_name FROM customers WHERE customer_id = ?`,
                [customer_id]
            );
            
            if (customerQuery.length > 0) {
                const customer = customerQuery[0];
                const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
                
                // Send push notification
                pushNotificationService.sendUserNotification(
                    'driver',
                    driver_id,
                    {
                        title: "มีรีวิวใหม่",
                        body: `${customerName} ได้ให้คะแนน ${rating} ดาว`
                    },
                    {
                        request_id: request_id.toString(),
                        review_id: result.insertId.toString(),
                        rating: rating.toString(),
                        type: 'new_review'
                    }
                );
                
                // Notify via socket if available
                if (socketService) {
                    socketService.notifyDriver(
                        driver_id, 
                        'newReview', 
                        {
                            request_id,
                            review_id: result.insertId,
                            customer_name: customerName,
                            rating
                        }
                    );
                }
            }
        } catch (notificationError) {
            // Log but don't fail if notification sending fails
            logger.error('Error sending review notification', { 
                error: notificationError.message 
            });
        }
        
        // Recalculate driver's average rating
        try {
            const avgRatingQuery = await db.query(
                `SELECT AVG(rating) as avg_rating FROM reviews WHERE driver_id = ?`,
                [driver_id]
            );
            
            const avgRating = avgRatingQuery[0]?.avg_rating 
                ? parseFloat(avgRatingQuery[0].avg_rating).toFixed(1) 
                : null;
                
            return res.status(STATUS_CODES.CREATED).json(
                formatSuccessResponse({ 
                    review_id: result.insertId, 
                    rating,
                    driver_avg_rating: avgRating
                }, 'บันทึกรีวิวเรียบร้อยแล้ว')
            );
        } catch (avgError) {
            // Continue without average if calculation fails
            logger.error('Error calculating average rating', { 
                error: avgError.message 
            });
            
            return res.status(STATUS_CODES.CREATED).json(
                formatSuccessResponse({ 
                    review_id: result.insertId 
                }, 'บันทึกรีวิวเรียบร้อยแล้ว')
            );
        }
    } catch (error) {
        logger.error('Database error in addReview', { error: error.message });
        throw new DatabaseError(
            ERROR_MESSAGES.DATABASE.QUERY_ERROR,
            error
        );
    }
});

/**
 * Get reviews for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverReviews = asyncHandler(async (req, res) => {
    const { driver_id } = req.params;
    
    if (!driver_id) {
        logger.warn('Missing driver_id for reviews');
        throw new ValidationError(
            ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
            ['driver_id is required']
        );
    }

    // Verify driver exists
    const driverCheck = await db.query(
        `SELECT driver_id FROM drivers WHERE driver_id = ?`,
        [driver_id]
    );

    if (driverCheck.length === 0) {
        throw new NotFoundError(
            ERROR_MESSAGES.RESOURCE.NOT_FOUND,
            ['Driver not found']
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
            c.last_name AS customer_last_name,
            s.location_from,
            s.location_to
        FROM reviews r
        LEFT JOIN customers c ON r.customer_id = c.customer_id
        LEFT JOIN servicerequests s ON r.request_id = s.request_id
        WHERE r.driver_id = ?
        ORDER BY r.created_at DESC
    `;

    try {
        const result = await db.query(sql, [driver_id]);
        
        // Format review data for response
        const formattedReviews = result.map(review => ({
            ...review,
            customer_name: `${review.customer_first_name || ''} ${review.customer_last_name || ''}`.trim(),
            review_date: formatDisplayDate(review.created_at),
            review_time: formatTimeString(review.created_at),
            // Truncate review text if too long
            review_summary: review.review_text ? truncate(review.review_text, 50) : null
        }));
        
        return res.status(STATUS_CODES.OK).json(
            formatSuccessResponse({ 
                count: formattedReviews.length,
                reviews: formattedReviews
            }, 'ดึงข้อมูลรีวิวสำเร็จ')
        );
    } catch (error) {
        logger.error('Database error in getDriverReviews', { 
            driver_id, error: error.message 
        });
        throw new DatabaseError(
            ERROR_MESSAGES.DATABASE.QUERY_ERROR,
            error
        );
    }
});

/**
 * Get driver's average rating
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDriverRating = asyncHandler(async (req, res) => {
    const { driver_id } = req.params;
    
    if (!driver_id) {
        logger.warn('Missing driver_id for rating');
        throw new ValidationError(
            ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
            ['driver_id is required']
        );
    }

    // Verify driver exists
    const driverCheck = await db.query(
        `SELECT driver_id FROM drivers WHERE driver_id = ?`,
        [driver_id]
    );

    if (driverCheck.length === 0) {
        throw new NotFoundError(
            ERROR_MESSAGES.RESOURCE.NOT_FOUND,
            ['Driver not found']
        );
    }

    const sql = `
        SELECT 
            AVG(rating) AS average_rating,
            COUNT(*) AS total_reviews,
            COUNT(CASE WHEN rating = 5 THEN 1 END) AS five_star,
            COUNT(CASE WHEN rating = 4 THEN 1 END) AS four_star,
            COUNT(CASE WHEN rating = 3 THEN 1 END) AS three_star,
            COUNT(CASE WHEN rating = 2 THEN 1 END) AS two_star,
            COUNT(CASE WHEN rating = 1 THEN 1 END) AS one_star
        FROM reviews
        WHERE driver_id = ?
    `;

    try {
        const result = await db.query(sql, [driver_id]);
        
        const ratingData = result[0];
        const averageRating = ratingData.average_rating 
            ? roundTo(parseFloat(ratingData.average_rating), 1)
            : 0;
        
        // Calculate the percentage for each star rating
        const totalReviews = ratingData.total_reviews || 0;
        const ratingDistribution = {
            five_star: {
                count: ratingData.five_star || 0,
                percentage: totalReviews ? roundTo((ratingData.five_star || 0) / totalReviews * 100) : 0
            },
            four_star: {
                count: ratingData.four_star || 0,
                percentage: totalReviews ? roundTo((ratingData.four_star || 0) / totalReviews * 100) : 0
            },
            three_star: {
                count: ratingData.three_star || 0,
                percentage: totalReviews ? roundTo((ratingData.three_star || 0) / totalReviews * 100) : 0
            },
            two_star: {
                count: ratingData.two_star || 0,
                percentage: totalReviews ? roundTo((ratingData.two_star || 0) / totalReviews * 100) : 0
            },
            one_star: {
                count: ratingData.one_star || 0,
                percentage: totalReviews ? roundTo((ratingData.one_star || 0) / totalReviews * 100) : 0
            }
        };
        
        return res.status(STATUS_CODES.OK).json(
            formatSuccessResponse({
                average_rating: averageRating,
                total_reviews: totalReviews,
                rating_distribution: ratingDistribution
            }, 'ดึงข้อมูลคะแนนเฉลี่ยสำเร็จ')
        );
    } catch (error) {
        logger.error('Database error in getDriverRating', { 
            driver_id, error: error.message 
        });
        throw new DatabaseError(
            ERROR_MESSAGES.DATABASE.QUERY_ERROR,
            error
        );
    }
});

/**
 * Get customer's review history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCustomerReviews = asyncHandler(async (req, res) => {
    const { customer_id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    if (!customer_id) {
        logger.warn('Missing customer_id for reviews');
        throw new ValidationError(
            ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
            ['customer_id is required']
        );
    }

    // Verify customer exists
    const customerCheck = await db.query(
        `SELECT customer_id FROM customers WHERE customer_id = ?`,
        [customer_id]
    );

    if (customerCheck.length === 0) {
        throw new NotFoundError(
            ERROR_MESSAGES.RESOURCE.NOT_FOUND,
            ['Customer not found']
        );
    }

    const sql = `
        SELECT 
            r.review_id,
            r.driver_id,
            r.request_id,
            r.rating,
            r.review_text,
            r.created_at,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            s.location_from,
            s.location_to,
            s.request_time
        FROM reviews r
        LEFT JOIN drivers d ON r.driver_id = d.driver_id
        LEFT JOIN servicerequests s ON r.request_id = s.request_id
        WHERE r.customer_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `;

    // Get total count for pagination
    const countSql = `
        SELECT COUNT(*) AS total
        FROM reviews
        WHERE customer_id = ?
    `;

    try {
        const [reviews, countResult] = await Promise.all([
            db.query(sql, [customer_id, limit, offset]),
            db.query(countSql, [customer_id])
        ]);
        
        const total = countResult[0].total || 0;
        
        // Format review data for response
        const formattedReviews = reviews.map(review => ({
            ...review,
            driver_name: `${review.driver_first_name || ''} ${review.driver_last_name || ''}`.trim(),
            review_date: formatDisplayDate(review.created_at),
            service_date: formatDisplayDate(review.request_time),
            service_time: formatTimeString(review.request_time)
        }));
        
        return res.status(STATUS_CODES.OK).json(
            formatSuccessResponse({
                count: formattedReviews.length,
                total,
                reviews: formattedReviews,
                pagination: {
                    limit,
                    offset,
                    total_pages: Math.ceil(total / limit)
                }
            }, 'ดึงข้อมูลรีวิวสำเร็จ')
        );
    } catch (error) {
        logger.error('Database error in getCustomerReviews', { 
            customer_id, error: error.message 
        });
        throw new DatabaseError(
            ERROR_MESSAGES.DATABASE.QUERY_ERROR,
            error
        );
    }
});

/**
 * Get review details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getReviewDetails = asyncHandler(async (req, res) => {
    const { review_id } = req.params;
    
    if (!review_id) {
        logger.warn('Missing review_id');
        throw new ValidationError(
            ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
            ['review_id is required']
        );
    }

    const sql = `
        SELECT 
            r.review_id,
            r.customer_id,
            r.driver_id,
            r.request_id,
            r.rating,
            r.review_text,
            r.driver_comment,
            r.created_at,
            c.first_name AS customer_first_name,
            c.last_name AS customer_last_name,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            s.location_from,
            s.location_to,
            s.request_time
        FROM reviews r
        LEFT JOIN customers c ON r.customer_id = c.customer_id
        LEFT JOIN drivers d ON r.driver_id = d.driver_id
        LEFT JOIN servicerequests s ON r.request_id = s.request_id
        WHERE r.review_id = ?
    `;

    try {
        const result = await db.query(sql, [review_id]);
        
        if (result.length === 0) {
            throw new NotFoundError(
                ERROR_MESSAGES.RESOURCE.NOT_FOUND,
                ['Review not found']
            );
        }
        
        const review = result[0];
        
        // Format review data
        const formattedReview = {
            ...review,
            customer_name: `${review.customer_first_name || ''} ${review.customer_last_name || ''}`.trim(),
            driver_name: `${review.driver_first_name || ''} ${review.driver_last_name || ''}`.trim(),
            review_date: formatDisplayDate(review.created_at),
            review_time: formatTimeString(review.created_at),
            service_date: formatDisplayDate(review.request_time),
            service_time: formatTimeString(review.request_time)
        };
        
        return res.status(STATUS_CODES.OK).json(
            formatSuccessResponse(formattedReview, 'ดึงข้อมูลรีวิวสำเร็จ')
        );
    } catch (error) {
        logger.error('Database error in getReviewDetails', { 
            review_id, error: error.message 
        });
        throw new DatabaseError(
            ERROR_MESSAGES.DATABASE.QUERY_ERROR,
            error
        );
    }
});

export default {
    addReview,
    getDriverReviews,
    getDriverRating,
    getCustomerReviews,
    getReviewDetails
};