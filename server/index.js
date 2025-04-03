import express from 'express';
import cors from 'cors';
import http from "http";
import dotenv from 'dotenv';
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import configureSocket from "./services/socketService.js";
import uploadRoutes from './routes/uploadRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js'
import offerRoutes from './routes/offerRoutes.js'

const app = express();
const server = http.createServer(app);

dotenv.config();

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SlideMe (Customer) API Document",
            version: "1.0.0",
            description: `
            `,
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Local Server"
            }
        ],
        tags: [
            {
                name: "Authentication",
                description: "การจัดการเกี่ยวกับการเข้าสู่ระบบและการลงทะเบียน"
            },
            {
                name: "Users",
                description: "การจัดการข้อมูลผู้ใช้"
            },
            {
                name: "Customers",
                description: "การจัดการข้อมูลลูกค้า"
            },
            {
                name: "Drivers",
                description: "การจัดการข้อมูลคนขับ"
            },
            {
                name: "Requests",
                description: "การจัดการคำขอบริการ"
            },
            {
                name: "Offers",
                description: "การจัดการข้อเสนอราคา"
            },
            {
                name: "Payments",
                description: "การจัดการวิธีการชำระเงิน"
            },
            {
                name: "Reviews",
                description: "การจัดการรีวิว"
            },
            {
                name: "Notifications",
                description: "การจัดการการแจ้งเตือน"
            },
            {
                name: "Uploads",
                description: "การจัดการไฟล์อัปโหลด"
            }
        ]
    },
    apis: [
        "./routes/authRoutes.js",
        "./routes/userRoutes.js",
        "./routes/customerRoutes.js",
        "./routes/driverRoutes.js",
        "./routes/requestRoutes.js",
        "./routes/offerRoutes.js",
        "./routes/paymentRoutes.js",
        "./routes/reviewRoutes.js",
        "./routes/notificationRoutes.js",
        "./routes/uploadRoutes.js",
    ], 
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

app.use('/uploads', express.static('uploads'));

app.use('/upload', uploadRoutes);
app.use('/request', requestRoutes);
app.use('/review', reviewRoutes);
app.use('/offer', offerRoutes);
app.use('/driver', driverRoutes);
app.use('/customer', customerRoutes);
app.use('/user', userRoutes);
app.use('/payment', paymentRoutes);
app.use('/notification', notificationRoutes);
app.use('/auth', authRoutes);

configureSocket(server);

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});