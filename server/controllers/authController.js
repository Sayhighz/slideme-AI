import jwt from "jsonwebtoken";
import con from "../config/db.js";

export const loginUser = (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    return res
      .status(400)
      .json({ message: "กรุณาใส่เบอร์โทรศัพท์และรหัสผ่าน" });
  }

  const sql = `SELECT driver_id, password, approval_status FROM drivers WHERE phone_number = ?`;

  con.query(sql, [phone_number], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).json({ message: "เบอร์โทรหรือรหัสผ่านผิด" });
    }

    const driver = results[0];
    if (driver.approval_status !== "approved") {
      return res.status(403).json({ message: "บัญชีนี้ไม่ได้รับการอนุมัติ" });
    }

    // แก้ไขโดยลบ role ออกจาก token เนื่องจากไม่มี field นี้ในฐานข้อมูล
    const token = jwt.sign(
      { driver_id: driver.driver_id },
      "jwt_secret_key",
      { expiresIn: "1h" }
    );

    // แก้ไขโดยลบ role ออกจาก response
    res.json({
      status: "success",
      token,
      driver_id: driver.driver_id
    });
  });
};

export const registerDriver = (req, res) => {
  const { phone_number, first_name, last_name, password } = req.body;

  if (!phone_number || !password) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }

  // ค่าที่ส่งเข้าไปใน INSERT จะมีเฉพาะคอลัมน์ที่ไม่ได้ตั้ง default
  const sql = `
      INSERT INTO drivers 
      (phone_number, first_name, last_name, password) 
      VALUES (?, ?, ?, ?)`;

  con.query(
    sql,
    [phone_number, first_name, last_name, password],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Database error", error: err });

      res.json({ status: "success", user_id: result.insertId });
    }
  );
}; //yes

export const validateCustomer = (req, res) => {
  const customerId = req.query.customer_id; 
  const sql = `SELECT * FROM customers WHERE customer_id = ?`;

  if (!customerId) {
    return res.status(400).json({
      Status: false,
      Message: "กรุณาใส่ customer_id",
    });
  }

  con.query(sql, [customerId], (err, result) => {
    if (err) {
      return res.status(500).json({ Status: false, Error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({
        Status: false,
        Message: "No records found",
      });
    }

    return res.status(200).json({ Status: true, Result: result });
  });
}; //yes
