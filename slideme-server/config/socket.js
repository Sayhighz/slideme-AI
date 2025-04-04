/**
 * Socket.io service for real-time communication
 */
import { Server } from 'socket.io';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

/**
 * Configure Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Configured Socket.io instance
 */
const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Active user connections
  const connections = {
    customers: {}, // { customerId: socket.id }
    drivers: {}    // { driverId: socket.id }
  };

  // Handle new connections
  io.on('connection', (socket) => {
    logger.info('New socket connection', { socketId: socket.id });

    // Authenticate user
    socket.on('authenticate', (data) => {
      try {
        const { user_type, user_id } = data;
        
        if (!user_type || !user_id) {
          logger.warn('Invalid authentication data', { socketId: socket.id });
          socket.emit('error', { message: 'Invalid authentication data' });
          return;
        }
        
        logger.info('User authenticated', { userType: user_type, userId: user_id, socketId: socket.id });
        
        // Store connection based on user type
        if (user_type === 'customer') {
          connections.customers[user_id] = socket.id;
          socket.join(`customer_${user_id}`);
        } else if (user_type === 'driver') {
          connections.drivers[user_id] = socket.id;
          socket.join(`driver_${user_id}`);
        }
        
        socket.emit('authenticated', { success: true });
      } catch (error) {
        logger.error('Authentication error', { error: error.message });
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Join request room (for communication between customer and driver)
    socket.on('joinRequest', (data) => {
      try {
        const { request_id, user_type, user_id } = data;
        
        if (!request_id || !user_type || !user_id) {
          logger.warn('Invalid join request data', { socketId: socket.id });
          socket.emit('error', { message: 'Invalid join request data' });
          return;
        }
        
        // Join request room
        const roomName = `request_${request_id}`;
        socket.join(roomName);
        
        logger.info('User joined request room', { requestId: request_id, userType: user_type, userId: user_id });
        
        // Notify room about new member
        socket.to(roomName).emit('userJoined', { user_type, user_id });
        
        // Confirm join
        socket.emit('joinedRequest', { success: true, request_id });
      } catch (error) {
        logger.error('Join request error', { error: error.message });
        socket.emit('error', { message: 'Failed to join request room' });
      }
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
      try {
        const { request_id, sender_type, sender_id, message } = data;
        
        if (!request_id || !sender_type || !sender_id || !message) {
          logger.warn('Invalid chat message data', { socketId: socket.id });
          socket.emit('error', { message: 'Invalid chat message data' });
          return;
        }
        
        // Create message object
        const messageObj = {
          request_id,
          sender_type,
          sender_id,
          message,
          timestamp: new Date().toISOString()
        };
        
        // Send to request room
        const roomName = `request_${request_id}`;
        io.to(roomName).emit('newMessage', messageObj);
        
        logger.info('Chat message sent', { requestId: request_id, senderType: sender_type, senderId: sender_id });
      } catch (error) {
        logger.error('Chat message error', { error: error.message });
        socket.emit('error', { message: 'Failed to send chat message' });
      }
    });

    // Update driver location
    socket.on('updateLocation', (data) => {
      try {
        const { driver_id, latitude, longitude } = data;
        
        if (!driver_id || !latitude || !longitude) {
          logger.warn('Invalid location update data', { socketId: socket.id });
          socket.emit('error', { message: 'Invalid location update data' });
          return;
        }
        
        // Broadcast location update to relevant connections
        // For active requests, find customer and send location update
        socket.broadcast.emit('driverLocationUpdate', {
          driver_id,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
        
        logger.info('Driver location updated', { driverId: driver_id, latitude, longitude });
      } catch (error) {
        logger.error('Location update error', { error: error.message });
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        // Find and remove disconnected user
        let disconnectedUser = { type: null, id: null };
        
        // Check if a customer disconnected
        for (const [customerId, socketId] of Object.entries(connections.customers)) {
          if (socketId === socket.id) {
            delete connections.customers[customerId];
            disconnectedUser = { type: 'customer', id: customerId };
            break;
          }
        }
        
        // Check if a driver disconnected
        if (!disconnectedUser.type) {
          for (const [driverId, socketId] of Object.entries(connections.drivers)) {
            if (socketId === socket.id) {
              delete connections.drivers[driverId];
              disconnectedUser = { type: 'driver', id: driverId };
              break;
            }
          }
        }
        
        if (disconnectedUser.type) {
          logger.info('User disconnected', { userType: disconnectedUser.type, userId: disconnectedUser.id });
        } else {
          logger.info('Socket disconnected', { socketId: socket.id });
        }
      } catch (error) {
        logger.error('Disconnect handling error', { error: error.message });
      }
    });
  });

  // Add utility methods to io object for server-initiated events

  /**
   * Send notification to a specific customer
   * @param {number} customerId - Customer ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  io.notifyCustomer = (customerId, event, data) => {
    const socketId = connections.customers[customerId];
    
    if (socketId) {
      io.to(socketId).emit(event, data);
      logger.info('Notification sent to customer', { customerId, event });
      return true;
    }
    
    logger.info('Customer not connected for notification', { customerId, event });
    return false;
  };

  /**
   * Send notification to a specific driver
   * @param {number} driverId - Driver ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  io.notifyDriver = (driverId, event, data) => {
    const socketId = connections.drivers[driverId];
    
    if (socketId) {
      io.to(socketId).emit(event, data);
      logger.info('Notification sent to driver', { driverId, event });
      return true;
    }
    
    logger.info('Driver not connected for notification', { driverId, event });
    return false;
  };

  /**
   * Send notification to all participants of a request
   * @param {number} requestId - Request ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  io.notifyRequestParticipants = (requestId, event, data) => {
    const roomName = `request_${requestId}`;
    io.to(roomName).emit(event, data);
    logger.info('Notification sent to request participants', { requestId, event });
    return true;
  };

  /**
   * Send notification to all connected drivers
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @returns {number} Number of drivers notified
   */
  io.notifyAllDrivers = (event, data) => {
    const driverCount = Object.keys(connections.drivers).length;
    
    if (driverCount > 0) {
      for (const socketId of Object.values(connections.drivers)) {
        io.to(socketId).emit(event, data);
      }
      
      logger.info('Notification sent to all drivers', { driverCount, event });
    }
    
    return driverCount;
  };

  /**
   * Notify about driver location updates
   * @param {number} driverId - Driver ID
   * @param {Object} locationData - Location data with latitude, longitude, etc.
   * @returns {boolean} Whether notification was sent
   */
  io.notifyDriverLocationUpdate = (driverId, locationData) => {
    try {
      // Broadcast to all connected clients - this could be optimized to only send to relevant customers
      io.emit('driverLocationUpdate', {
        driver_id: driverId,
        ...locationData,
        timestamp: locationData.timestamp || new Date().toISOString()
      });
      
      logger.info('Driver location update broadcast', { driverId });
      return true;
    } catch (error) {
      logger.error('Error broadcasting driver location', { 
        driverId, 
        error: error.message 
      });
      return false;
    }
  };

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  io.getConnectionStats = () => {
    return {
      totalConnections: Object.keys(connections.customers).length + Object.keys(connections.drivers).length,
      customerConnections: Object.keys(connections.customers).length,
      driverConnections: Object.keys(connections.drivers).length
    };
  };

  return io;
};

export default configureSocket;