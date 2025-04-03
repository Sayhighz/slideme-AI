import con from "../config/db.js";

export const addRequest = (req, res) => {
  const sql = `
        INSERT INTO servicerequests (
            customer_id,
            request_time,
            pickup_lat,
            pickup_long,
            location_from,
            dropoff_lat,
            dropoff_long,
            location_to,
            vehicletype_id,
            booking_time,
            customer_message,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

  const values = [
    req.body.customer_id,
    req.body.request_time,
    req.body.pickup_lat,
    req.body.pickup_long,
    req.body.location_from,
    req.body.dropoff_lat,
    req.body.dropoff_long,
    req.body.location_to,
    req.body.vehicletype_id,
    req.body.booking_time,
    req.body.customer_message,
  ];

  con.query(sql, values, (err, result) => {
    if (err) return res.json({ Status: false, Error: err.message });
    return res.json({ Status: true, request_id: result.insertId });
  });
}; //yes

export const getServiceHistory = (req, res) => {// fix me
  const customerId = req.query.customer_id || 1;
  const sql = `
        SELECT
            vt.vehicletype_name AS vehicle_type, 
            sr.request_time AS date,
            sr.status AS service_status,
            sr.location_from AS origin,
            sr.location_to AS destination,
        FROM 
            ServiceRequests sr
        LEFT JOIN
            vehicle_types vt ON sr.vehicletype_id = vt.vehicletype_id 
        LEFT JOIN
            DriverOffers do ON sr.request_id = do.request_id AND do.offer_status = 'accepted'
        WHERE
            sr.customer_id = ?
        ORDER BY
            sr.request_time DESC;
    `;

  con.query(sql, [customerId], (err, result) => {
    if (err) return res.json({ Status: false, Error: err.message });
    return res.json({ Status: true, Result: result });
  });
}; //yes

export const getRequests = (req, res) => {
  const sql = `
        SELECT
            s.request_id,
            s.pickup_lat,
            s.pickup_long,
            s.location_from,
            s.dropoff_lat,
            s.dropoff_long,
            s.location_to,
            s.booking_time,
            vt.vehicletype_name AS vehicle_type,
            s.customer_message
        FROM servicerequests s
        LEFT JOIN vehicle_types vt ON s.vehicletype_id = vt.vehicletype_id 
        WHERE s.status = 'pending';
    `;

  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: err.message });
    return res.json({ Status: true, Result: result });
  });
}; //yes

export const getRequestDetailForDriver = (req, res) => {
  const request_id = req.query.request_id || null;

  const sql = `
        SELECT DISTINCT
            s.request_id,
            s.pickup_lat,
            s.pickup_long,
            s.location_from,
            s.customer_message,
            s.dropoff_lat,
            s.dropoff_long,
            s.location_to,
            c.first_name AS customer_name,
            c.phone_number AS customer_phone
        FROM
            servicerequests s
        LEFT JOIN customers c
            ON c.customer_id = s.customer_id
        WHERE
            s.request_id = ?;
    `;

  con.query(sql, [request_id], (err, result) => {
    if (err) return res.json({ Status: false, Error: err.message });
    return res.json({ Status: true, Result: result });
  });
}; //yes

export const updateServiceRequest = (req, res) => {
  const { request_id, customer_id, offer_id, price, payment_method_id } = req.body;

  // Validate input
  if (!request_id || !customer_id || !offer_id || !price || !payment_method_id) {
    return res.status(400).json({ Status: false, Message: "ข้อมูลไม่ถูกต้อง" });
  }

  // Start a transaction to ensure all queries run together
  con.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).json({ Status: false, Error: err.message });
    }

    // Step 1: Update the servicerequests table (เฉพาะ status และ offer_id)
    const sqlUpdateServiceRequest = `
      UPDATE servicerequests
      SET status = 'accepted',
          offer_id = ?
      WHERE request_id = ? AND customer_id = ?;
    `;

    con.query(
      sqlUpdateServiceRequest,
      [offer_id, request_id, customer_id],
      (err, result) => {
        if (err) {
          return con.rollback(() => {
            console.error("Error updating service request:", err);
            return res.status(500).json({ Status: false, Error: err.message });
          });
        }

        if (result.affectedRows === 0) {
          return con.rollback(() => {
            return res.status(404).json({
              Status: false,
              Message: "ไม่พบข้อมูลที่ตรงกันหรือข้อมูลได้ถูกอัปเดตแล้ว",
            });
          });
        }

        // Step 2: Insert or update the payments table
        const sqlInsertPayment = `
        INSERT INTO payments (customer_id, amount, payment_status, payment_method_id)
        VALUES (?, ?, 'Pending', ?)
        ON DUPLICATE KEY UPDATE amount = ?, payment_status = 'Pending', payment_method_id = ?
      `;

        con.query(
          sqlInsertPayment,
          [customer_id, price, payment_method_id, price, payment_method_id],
          (err, paymentResult) => {
            if (err) {
              return con.rollback(() => {
                console.error("Error updating payment:", err);
                return res
                  .status(500)
                  .json({ Status: false, Error: err.message });
              });
            }

            const payment_id = paymentResult.insertId || paymentResult.insertId; // Get the inserted or existing payment_id

            // Step 3: Update the servicerequests table with payment_id
            const sqlUpdatePaymentIdInServiceRequest = `
          UPDATE servicerequests
          SET payment_id = ?
          WHERE request_id = ? AND customer_id = ?
        `;

            con.query(
              sqlUpdatePaymentIdInServiceRequest,
              [payment_id, request_id, customer_id],
              (err, updatePaymentResult) => {
                if (err) {
                  return con.rollback(() => {
                    console.error(
                      "Error updating payment_id in service request:",
                      err
                    );
                    return res
                      .status(500)
                      .json({ Status: false, Error: err.message });
                  });
                }

                // Step 4: Update the driveroffers table (Only offer_status)
                const sqlUpdateDriverOffer = `
            UPDATE driveroffers
            SET offer_status = 'accepted', offered_price = ?
            WHERE offer_id = ?
          `;

                con.query(
                  sqlUpdateDriverOffer,
                  [price, offer_id],
                  (err, offerResult) => {
                    if (err) {
                      return con.rollback(() => {
                        console.error("Error updating driver offer:", err);
                        return res
                          .status(500)
                          .json({ Status: false, Error: err.message });
                      });
                    }

                    // Commit the transaction if all queries succeed
                    con.commit((err) => {
                      if (err) {
                        return con.rollback(() => {
                          console.error("Error committing transaction:", err);
                          return res
                            .status(500)
                            .json({ Status: false, Error: err.message });
                        });
                      }

                      return res.status(200).json({
                        Status: true,
                        Message:
                          "อัปเดตคำขอบริการ, การชำระเงิน, และข้อเสนอจากคนขับสำเร็จ",
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};

export const completeRequest = (req, res) => {
  const sql = `
  UPDATE servicerequests
  SET 
    status = 'completed'
  WHERE request_id = ?
`;

  const request_id = req.body.request_id || null;

  con.query(sql, request_id, (err, result) => {
    if (err) return res.json({ Status: false, Error: err.message });
    return res.json({
      Status: true,
      AffectedRows: result.affectedRows,
    });
  });
}; //yes

export const cancelRequest = (req, res) => {
  const request_id = req.body.request_id;

  if (!request_id) {
    return res
      .status(400)
      .json({ Status: false, Error: "กรุณาระบุ request_id" });
  }

  const sql = `
        UPDATE servicerequests sr
        LEFT JOIN driveroffers d ON sr.request_id = d.request_id
        SET sr.status = 'cancelled',
            d.offer_status = CASE WHEN d.request_id IS NOT NULL THEN 'rejected' ELSE d.offer_status END
        WHERE sr.request_id = ?;
        `;

  con.query(sql, [request_id], (err, result) => {
    if (err) {
      console.error("Error cancelling request:", err);
      return res
        .status(500)
        .json({ Status: false, Error: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ Status: false, Error: "ไม่พบคำขอที่ต้องการยกเลิก" });
    }

    return res.status(200).json({
      Status: true,
      Message: "ยกเลิกคำขอเรียบร้อยแล้ว",
      AffectedRows: result.affectedRows,
    });
  });
}; //yes
