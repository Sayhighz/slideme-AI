import con from "../config/db.js";

export const updateOfferStatus = (req, res) => {
  const { request_id, driver_id } = req.body;

  if (!request_id || !driver_id) {
    return res
      .status(400)
      .json({ Status: false, Message: "กรุณาระบุ request_id หรือ driver_id" });
  }

  const sqlUpdateAccepted = `
      UPDATE driveroffers
      SET offer_status = 'accepted'
      WHERE request_id = ? AND driver_id = ?
    `;

  const sqlUpdateRejected = `
      UPDATE driveroffers
      SET offer_status = 'rejected'
      WHERE request_id = ? AND driver_id != ? AND offer_status = 'pending'
    `;

  con.query(
    sqlUpdateAccepted,
    [request_id, driver_id],
    (err, result) => {
      if (err) {
        console.error("Error updating accepted offer:", err);
        return res.status(500).json({ Status: false, Error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: false,
          Message: "ไม่พบข้อเสนอ",
        });
      }

      con.query(
        sqlUpdateRejected,
        [request_id, driver_id],
        (err, result) => {
          if (err) {
            console.error("Error updating rejected offers:", err);
            return res.status(500).json({ Status: false, Error: err.message });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              Status: false,
              Message: "ไม่พบข้อเสนอที่ต้องอัปเดต",
            });
          }

          return res.status(200).json({
            Status: true,
            Message: "อัปเดตสถานะข้อเสนอเรียบร้อย !",
          });
        }
      );
    }
  );
}; //yes

export const chooseOffer = (req, res) => {
  const request_id = req.query.request_id || null;

  if (!request_id) {
    return res
      .status(400)
      .json({ Status: false, Message: "กรุณาระบุ request_id" });
  }

  const sql = `
SELECT 
    do.offer_id,
    do.driver_id,
    d.current_latitude,
    d.current_longitude,
    drv.username,
    drv.first_name,
    drv.last_name,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    do.offered_price,
    sr.pickup_lat,
    sr.pickup_long,
    sr.location_from,
    sr.dropoff_lat,
    sr.dropoff_long,
    sr.location_to,
    sr.customer_id,
    sr.request_id
FROM driverdetails d
LEFT JOIN drivers drv ON d.driver_id = drv.driver_id
LEFT JOIN reviews r ON d.driver_id = r.driver_id
INNER JOIN driveroffers do ON d.driver_id = do.driver_id
LEFT JOIN servicerequests sr ON sr.request_id = do.request_id
WHERE do.request_id = ? 
AND do.offer_status = 'pending'
GROUP BY 
    do.offer_id,  -- Include offer_id in the GROUP BY
    d.driver_id, d.current_latitude, d.current_longitude, 
    drv.username, drv.first_name, drv.last_name, 
    do.offered_price, sr.pickup_lat, sr.pickup_long, sr.location_from, 
    sr.dropoff_lat, sr.dropoff_long, sr.location_to;
  `;

  con.query(sql, [request_id], (err, result) => {
    if (err) {
      console.error("Error fetching drivers:", err);
      return res.status(500).json({ Status: false, Error: err.message });
    }

    if (result.length === 0) {
      const locationQuery = `
        SELECT 
          sr.pickup_lat,
          sr.pickup_long,
          sr.location_from,
          sr.dropoff_lat,
          sr.dropoff_long,
          sr.location_to
        FROM servicerequests sr
        WHERE sr.request_id = ?
      `;

      con.query(locationQuery, [request_id], (err, locationResult) => {
        if (err) {
          console.error("Error fetching pickup/dropoff info:", err);
          return res.status(500).json({ Status: false, Error: err.message });
        }

        if (locationResult.length > 0) {
          return res.status(200).json({
            Status: true,
            PickupDropoffInfo: locationResult[0],
          });
        } else {
          return res.status(404).json({
            Status: false,
            Message: "ไม่พบข้อมูลข้อเสนอหรือข้อมูลตำแหน่ง",
          });
        }
      });

      return;
    }

    const pickupDropoffInfo = {
      pickup_lat: result[0].pickup_lat,
      pickup_long: result[0].pickup_long,
      location_from: result[0].location_from,
      dropoff_lat: result[0].dropoff_lat,
      dropoff_long: result[0].dropoff_long,
      location_to: result[0].location_to,
    };

    return res.status(200).json({
      Status: true,
      Result: result,
      PickupDropoffInfo: pickupDropoffInfo,
    });
  });
};
