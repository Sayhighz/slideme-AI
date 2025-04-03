import mysql from "mysql2";
import dotenv from 'dotenv';

// โหลดค่าจากไฟล์ .env
dotenv.config();

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

con.connect(err => {
    if (err) {
        console.error("Database connection error:", err);
    } else {
        console.log("✅ Connected to MySQL database.");
    }
});

export default con;
