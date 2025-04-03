import con from "../config/db.js";

export const addPaymentMethod = (req, res) => {
  const {
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    customer_id,
  } = req.body;

  // ตรวจสอบค่าที่จำเป็น
  if (
    !method_name ||
    !card_number ||
    !card_expiry ||
    !card_cvv ||
    !cardholder_name ||
    !customer_id
  ) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const sqlPaymentMethod = `
        INSERT INTO paymentmethod (method_name, card_number, card_expiry, card_cvv, cardholder_name, customer_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

  const valuesPaymentMethod = [
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    customer_id,
  ];

  con.query(sqlPaymentMethod, valuesPaymentMethod, (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    return res.status(201).json({
      Status: true,
      Message: "เพิ่มวิธีการชำระเงินเรียบร้อย !",
      PaymentId: result.insertId,
    });
  });
};

export const updatePaymentMethod = (req, res) => {
  const {
    payment_method_id,
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
  } = req.body;

  // ตรวจสอบค่าที่จำเป็น
  if (
    !payment_method_id ||
    !method_name ||
    !card_number ||
    !card_expiry ||
    !card_cvv ||
    !cardholder_name
  ) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  const sql = `
        UPDATE paymentmethod
        SET method_name = ?, card_number = ?, card_expiry = ?, card_cvv = ?, cardholder_name = ?
        WHERE payment_method_id = ?
    `;

  const values = [
    method_name,
    card_number,
    card_expiry,
    card_cvv,
    cardholder_name,
    payment_method_id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบวิธีการชำระเงิน" });
    }

    return res.status(200).json({
      Status: true,
      Message: "อัปเดตวิธีการชำระเงินเรียบร้อย !",
      AffectedRows: result.affectedRows,
    });
  });
};

export const disablePaymentMethod = (req, res) => {
  const { payment_method_id } = req.body;

  // ตรวจสอบค่าที่จำเป็น
  if (!payment_method_id) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาระบุ payment_method_id" });
  }

  const sql = `
        UPDATE paymentmethod
        SET is_active = 0
        WHERE payment_method_id = ?
    `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบวิธีการชำระเงิน" });
    }

    return res.status(200).json({
      Status: true,
      Message: "ปิดการใช้งานวิธีการชำระเงินเรียบร้อย !",
      AffectedRows: result.affectedRows,
    });
  });
};

//??
export const getAllUserPaymentMethods = (req, res) => {
  const customer_id = req.query.customer_id || null;

  if (!customer_id) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาระบุ customer_id" });
  }

  // แก้ไข SQL query ให้ตรงกับโครงสร้างตาราง
  const sql = `
        SELECT
            p.payment_id,
            pm.payment_method_id,
            pm.method_name,
            pm.card_number,
            pm.card_expiry,
            pm.cardholder_name,
            p.payment_status
        FROM payments p
        JOIN paymentmethod pm ON p.payment_method_id = pm.payment_method_id
        WHERE p.customer_id = ?;
    `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    if (result.length === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบวิธีการชำระเงินของผู้ใช้คนนี้" });
    }

    return res.status(200).json({ Status: true, Result: result });
  });
};
//??
export const getPaymentMethod = (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาระบุ customer_id" });
  }

  const sql = `
        SELECT 
            method_name, 
            card_number, 
            card_expiry, 
            cardholder_name
        FROM paymentmethod 
        WHERE customer_id = ? AND is_active = 1;
    `;

  con.query(sql, [customer_id], (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    if (result.length === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบวิธีการชำระเงินของผู้ใช้คนนี้" });
    }

    return res.status(200).json({ Status: true, Result: result });
  });
};

//เฉพาะ 206
export const deleteMethod = (req, res) => {
  const { payment_method_id } = req.params;

  if (!payment_method_id) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาระบุ payment_method_id" });
  }

  const sql = `
        DELETE FROM paymentmethod
        WHERE payment_method_id = ?
    `;

  con.query(sql, [payment_method_id], (err, result) => {
    if (err) return res.status(500).json({ Status: false, Error: err.message });

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบวิธีการชำระเงิน" });
    }
    return res.status(200).json({
      Status: true,
      Message: "ลบวิธีการชำระเงินเรียบร้อย !",
      AffectedRows: result.affectedRows,
    });
  });
};
