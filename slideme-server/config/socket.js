/**
 * Socket.io configuration
 */
import { Server } from 'socket.io';
import logger from './logger.js';
import env from './env.js';

/**
 * Configure socket.io server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.io server instance
 */
const configureSocket = (httpServer) => {
  // Create socket.io server with CORS configuration
  const io = new Server(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Active connections storage
  // Storing by user type and ID for targeted emissions
  const connections = {
    customers: {}, // { customer_id: socket_id }
    drivers: {}    // { driver_id: socket_id }
  };

  // Handle new connections
  io.on('connection', (socket) => {
    logger.info('New socket connection', { socketId: socket.id });

    // Handle user authentication
    socket.on('authenticate', (data) => {
      try {
        const { user_type, user_id } = data;
        
        if (!user_type || !user_id) {
          logger.warn('Invalid authentication data', { socketId: socket.id, data });
          return;
        }
        
        // Store user connection by type
        if (user_type === 'customer') {
          connections.customers[user_id] = socket.id;
          logger.info('Customer authenticated', { customerId: user_id, socketId: socket.id });
        } else if (user_type === 'driver') {
          connections.drivers[user_id] = socket.id;
          logger.info('Driver authenticated', { driverId: user_id, socketId: socket.id });
        }
        
        // Join room based on user ID
        const room = `${user_type}_${user_id}`;
        socket.join(room);
        
        // Acknowledge successful authentication
        socket.emit('authenticated', { status: true, user_id, user_type });
      } catch (error) {
        logger.error('Authentication error', { error: error.message, socketId: socket.id });
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle joining a specific request room
    socket.on('joinRequestRoom', (data) => {
      try {
        const { request_id, user_type, user_id } = data;
        
        if (!request_id) {
          logger.warn('Invalid request room data', { socketId: socket.id, data });
          return;
        }
        
        // Create and join request room
        const room = `request_${request_id}`;
        socket.join(room);
        
        logger.info('Joined request room', { 
          requestId: request_id, 
          userType: user_type, 
          userId: user_id, 
          socketId: socket.id 
        });
        
        // Notify room about new joiner
        socket.to(room).emit('userJoined', { user_type, user_id });
        
        // Acknowledge successful join
        socket.emit('joinedRequestRoom', { status: true, request_id });
      } catch (error) {
        logger.error('Join request room error', { error: error.message, socketId: socket.id });
        socket.emit('error', { message: 'Failed to join request room' });
      }
    });

    // Handle private messages between users
    socket.on('sendMessage', (data) => {
      try {
        const { request_id, sender_id, sender_type, recipient_id, recipient_type, message } = data;
        
        if (!request_id || !sender_id || !sender_type || !recipient_id || !recipient_type || !message) {
          logger.warn('Invalid message data', { socketId: socket.id, data });
          return;
        }
        
        // Get recipient's socket ID
        let recipientSocketId;
        
        if (recipient_type === 'customer') {
          recipientSocketId = connections.customers[recipient_id];
        } else if (recipient_type === 'driver') {
          recipientSocketId = connections.drivers[recipient_id];
        }
        
        // Create message object
        const messageObj = {
          request_id,
          sender_id,
          sender_type,
          recipient_id,
          recipient_type,
          message,
          timestamp: new Date().toISOString()
        };
        
        // Send to request room for all participants
        const room = `request_${request_id}`;
        io.to(room).emit('newMessage', messageObj);
        
        // If recipient is not in the room, send directly
        if (recipientSocketId && !io.sockets.adapter.rooms.get(room)?.has(recipientSocketId)) {
          io.to(recipientSocketId).emit('newMessage', messageObj);
        }
        
        logger.info('Message sent', { 
          requestId: request_id, 
          senderId: sender_id, 
          recipientId: recipient_id 
        });
      } catch (error) {
        logger.error('Send message error', { error: error.message, socketId: socket.id });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        // Remove socket from connections
        for (const customerId in connections.customers) {
          if (connections.customers[customerId] === socket.id) {
            delete connections.customers[customerId];
            logger.info('Customer disconnected', { customerId, socketId: socket.id });
            break;
          }
        }
        
        for (const driverId in connections.drivers) {
          if (connections.drivers[driverId] === socket.id) {
            delete connections.drivers[driverId];
            logger.info('Driver disconnected', { driverId, socketId: socket.id });
            break;
          }
        }
      } catch (error) {
        logger.error('Disconnect error', { error: error.message, socketId: socket.id });
      }
    });
  });

  // Utility methods for emitting events

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
    logger.warn('Customer not connected for notification', { customerId, event });
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
    logger.warn('Driver not connected for notification', { driverId, event });
    return false;
  };

  /**
   * Send notification to all participants of a request
   * @param {number} requestId - Request ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  io.notifyRequestParticipants = (requestId, event, data) => {
    const room = `request_${requestId}`;
    io.to(room).emit(event, data);
    logger.info('Notification sent to request participants', { requestId, event });
    return true;
  };

  /**
   * Send notification to all active drivers
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  io.notifyAllDrivers = (event, data) => {
    for (const driverId in connections.drivers) {
      const socketId = connections.drivers[driverId];
      io.to(socketId).emit(event, data);
    }
    logger.info('Notification sent to all drivers', { event, driverCount: Object.keys(connections.drivers).length });
    return true;
  };

  /**
   * Get active connections count
   * @returns {Object} Active connections count by type
   */
  io.getConnectionsCount = () => {
    return {
      customers: Object.keys(connections.customers).length,
      drivers: Object.keys(connections.drivers).length,
      total: Object.keys(connections.customers).length + Object.keys(connections.drivers).length
    };
  };
  
  return io;
};

export default configureSocket;