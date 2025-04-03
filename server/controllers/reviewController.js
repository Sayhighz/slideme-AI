import con from '../config/db.js';

export const addReview = (req, res) => {
    const sql = `
        INSERT INTO reviews (
            request_id,
            customer_id,
            driver_id,
            rating,
            review_text
        ) VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        req.body.request_id,
        req.body.customer_id,
        req.body.driver_id,
        req.body.rating,
        req.body.review_text,
    ];

    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: err.message });
        return res.json({ Status: true, InsertId: result.insertId });
    });
}; //yes
