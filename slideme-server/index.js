// index.js
import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration
import db from './config/db.js';
import logger from './config/logger.js';
import swaggerOptions from './config/swagger.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import { defaultRateLimiter } from './middleware/rateLimiter.js';
import { handleUploadErrors } from './middleware/fileUpload.js';

// Import socket service
import configureSocket from './services/communication/socketService.js';

// Import common routes
import uploadRoutes from './routes/common/uploadRoutes.js';
import notificationRoutes from './routes/common/notificationRoutes.js';

// Import customer routes
import customerAuthRoutes from './routes/customer/authRoutes.js';
import customerRequestRoutes from './routes/customer/requestRoutes.js';
import customerReviewRoutes from './routes/customer/reviewRoutes.js';
import customerPaymentRoutes from './routes/customer/paymentRoutes.js';
import customerAddressRoutes from './routes/customer/addressRoutes.js';
import customerProfileRoutes from './routes/customer/profileRoutes.js';

// Import driver routes
import driverAuthRoutes from './routes/driver/authRoutes.js';
import driverProfileRoutes from './routes/driver/profileRoutes.js';
import driverLocationRoutes from './routes/driver/locationRoutes.js';
import driverRequestRoutes from './routes/driver/requestRoutes.js';
import driverOfferRoutes from './routes/driver/offerRoutes.js';
import driverEarningRoutes from './routes/driver/earningRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5173"],
  credentials: true
}));
app.use(requestLogger);
app.use(defaultRateLimiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

const API_PREFIX = '/api/v1';
const CUSTOMER_PREFIX = `${API_PREFIX}/customer`;
const DRIVER_PREFIX = `${API_PREFIX}/driver`;

app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/notification`, notificationRoutes);

app.use(`${CUSTOMER_PREFIX}/auth`, customerAuthRoutes);
app.use(`${CUSTOMER_PREFIX}/request`, customerRequestRoutes);
app.use(`${CUSTOMER_PREFIX}/review`, customerReviewRoutes);
app.use(`${CUSTOMER_PREFIX}/payment`, customerPaymentRoutes);
app.use(`${CUSTOMER_PREFIX}/address`, customerAddressRoutes);
app.use(`${CUSTOMER_PREFIX}/profile`, customerProfileRoutes);

app.use(`${DRIVER_PREFIX}/auth`, driverAuthRoutes);
app.use(`${DRIVER_PREFIX}/profile`, driverProfileRoutes);
app.use(`${DRIVER_PREFIX}/location`, driverLocationRoutes);
app.use(`${DRIVER_PREFIX}/request`, driverRequestRoutes);
app.use(`${DRIVER_PREFIX}/offer`, driverOfferRoutes);
app.use(`${DRIVER_PREFIX}/earning`, driverEarningRoutes);

app.use((req, res, next) => {
  res.status(404).json({ Status: false, Error: 'Route not found' });
});

app.use(handleUploadErrors);
app.use(errorHandler);

configureSocket(server);

const startServer = async () => {
//   try {
    // const connected = await db.testConnection();
    // if (!connected) throw new Error('DB connection failed');

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
      logger.info('API Routes structure:');
      logger.info(`- Common Routes: ${API_PREFIX}/upload, ${API_PREFIX}/notification`);
      logger.info(`- Customer Routes: ${CUSTOMER_PREFIX}/{auth, request, review, payment, address, profile}`);
      logger.info(`- Driver Routes: ${DRIVER_PREFIX}/{auth, profile, location, request, offer, earning}`);
    });
//   } catch (error) {
//     logger.error('Failed to start server', { error: error.message });
//     process.exit(1);
//   }
};

startServer();

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason, stack: reason?.stack });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;