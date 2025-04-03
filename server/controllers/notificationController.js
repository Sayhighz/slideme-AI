import con from '../config/db.js';

export const getAllNotifications = (req, res) => {
    const sql = `
        SELECT
            id,
            title,
            message,
            type,
            discount_code,
            created_at,
            read_status
        FROM
            app_notifications
        ORDER BY
            created_at DESC;
    `;

    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: err.message });
        return res.json({ Status: true, Result: result });
    });
}; //yes
