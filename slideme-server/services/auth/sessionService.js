/**
 * Session management service
 */
import crypto from 'crypto';
import db from '../../config/db.js';
import logger from '../../config/logger.js';

// In-memory session store (for development)
// In production, use Redis or another persistent store
const sessionStore = new Map();

/**
 * Create a new session
 * @param {Object} userData - User data to store in session
 * @param {number} expiryMinutes - Session expiry time in minutes
 * @returns {Object} Session information
 */
export const createSession = async (userData, expiryMinutes = 60) => {
  try {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiryMinutes * 60000);
    
    const session = {
      id: sessionId,
      userId: userData.id,
      userType: userData.userType, // 'customer' or 'driver'
      data: userData,
      createdAt,
      expiresAt,
      isActive: true
    };
    
    // Store in memory
    sessionStore.set(sessionId, session);
    
    // Optional: Also store in database for persistence across restarts
    // This is especially important in production
    if (process.env.NODE_ENV === 'production') {
      await db.query(
        'INSERT INTO sessions (session_id, user_id, user_type, data, created_at, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          sessionId,
          userData.id,
          userData.userType,
          JSON.stringify(userData),
          createdAt,
          expiresAt,
          1
        ]
      );
    }
    
    return {
      sessionId,
      expiresAt
    };
  } catch (error) {
    logger.error('Error creating session', { error: error.message });
    throw error;
  }
};

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session data or null if not found
 */
export const getSession = async (sessionId) => {
  try {
    // Check in-memory store first
    if (sessionStore.has(sessionId)) {
      const session = sessionStore.get(sessionId);
      
      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await invalidateSession(sessionId);
        return null;
      }
      
      return session;
    }
    
    // If not in memory and in production, check database
    if (process.env.NODE_ENV === 'production') {
      const result = await db.query(
        'SELECT * FROM sessions WHERE session_id = ? AND is_active = 1 AND expires_at > NOW()',
        [sessionId]
      );
      
      if (result.length > 0) {
        const session = {
          id: result[0].session_id,
          userId: result[0].user_id,
          userType: result[0].user_type,
          data: JSON.parse(result[0].data),
          createdAt: result[0].created_at,
          expiresAt: result[0].expires_at,
          isActive: Boolean(result[0].is_active)
        };
        
        // Add to memory cache
        sessionStore.set(sessionId, session);
        
        return session;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting session', { error: error.message, sessionId });
    throw error;
  }
};

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} newData - New session data
 * @returns {boolean} Success status
 */
export const updateSession = async (sessionId, newData) => {
  try {
    // Update in memory if exists
    if (sessionStore.has(sessionId)) {
      const session = sessionStore.get(sessionId);
      
      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await invalidateSession(sessionId);
        return false;
      }
      
      // Update data
      session.data = { ...session.data, ...newData };
      sessionStore.set(sessionId, session);
    }
    
    // Update in database if in production
    if (process.env.NODE_ENV === 'production') {
      // First get existing data
      const result = await db.query(
        'SELECT data FROM sessions WHERE session_id = ? AND is_active = 1',
        [sessionId]
      );
      
      if (result.length > 0) {
        const existingData = JSON.parse(result[0].data);
        const updatedData = { ...existingData, ...newData };
        
        await db.query(
          'UPDATE sessions SET data = ? WHERE session_id = ?',
          [JSON.stringify(updatedData), sessionId]
        );
        
        return true;
      }
      
      return false;
    }
    
    return sessionStore.has(sessionId);
  } catch (error) {
    logger.error('Error updating session', { error: error.message, sessionId });
    throw error;
  }
};

/**
 * Extend session expiry
 * @param {string} sessionId - Session ID
 * @param {number} expiryMinutes - Additional minutes to extend
 * @returns {boolean} Success status
 */
export const extendSession = async (sessionId, expiryMinutes = 60) => {
  try {
    // Extend in memory if exists
    if (sessionStore.has(sessionId)) {
      const session = sessionStore.get(sessionId);
      
      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await invalidateSession(sessionId);
        return false;
      }
      
      // Extend expiry
      session.expiresAt = new Date(Date.now() + expiryMinutes * 60000);
      sessionStore.set(sessionId, session);
    }
    
    // Extend in database if in production
    if (process.env.NODE_ENV === 'production') {
      const result = await db.query(
        'UPDATE sessions SET expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE session_id = ? AND is_active = 1',
        [expiryMinutes, sessionId]
      );
      
      return result.affectedRows > 0;
    }
    
    return sessionStore.has(sessionId);
  } catch (error) {
    logger.error('Error extending session', { error: error.message, sessionId });
    throw error;
  }
};

/**
 * Invalidate a session
 * @param {string} sessionId - Session ID
 * @returns {boolean} Success status
 */
export const invalidateSession = async (sessionId) => {
  try {
    // Remove from memory
    sessionStore.delete(sessionId);
    
    // Remove from database if in production
    if (process.env.NODE_ENV === 'production') {
      await db.query(
        'UPDATE sessions SET is_active = 0 WHERE session_id = ?',
        [sessionId]
      );
    }
    
    return true;
  } catch (error) {
    logger.error('Error invalidating session', { error: error.message, sessionId });
    throw error;
  }
};

/**
 * Clean up expired sessions
 * @returns {number} Number of sessions cleaned up
 */
export const cleanupExpiredSessions = async () => {
  try {
    let count = 0;
    
    // Clean memory store
    for (const [sessionId, session] of sessionStore.entries()) {
      if (session.expiresAt < new Date()) {
        sessionStore.delete(sessionId);
        count++;
      }
    }
    
    // Clean database if in production
    if (process.env.NODE_ENV === 'production') {
      const result = await db.query(
        'UPDATE sessions SET is_active = 0 WHERE expires_at < NOW() AND is_active = 1'
      );
      
      count += result.affectedRows;
    }
    
    return count;
  } catch (error) {
    logger.error('Error cleaning up expired sessions', { error: error.message });
    throw error;
  }
};

export default {
  createSession,
  getSession,
  updateSession,
  extendSession,
  invalidateSession,
  cleanupExpiredSessions
};