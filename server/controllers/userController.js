import con from '../config/db.js';

export const addUserInfo = (req, res) => {
    const { phone_number, email, username, first_name, last_name } = req.body;

    if (!phone_number) {
        return res.json({ Status: false, Error: "Phone number is required" });
    }

    const sql = `
        INSERT INTO customers (
            phone_number,
            email,
            username,
            first_name,
            last_name,
            created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const values = [
        phone_number,
        email || null,
        username || null,
        first_name || null,
        last_name || null,
    ];

    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: err.message });
        return res.json({ Status: true, InsertId: result.insertId, user_id: result.insertId });
    });
}; //yes

export const checkUserPhone = (req, res) => {
    const { phone_number } = req.body;
    const sql = `SELECT * FROM customers WHERE phone_number = ?`;
    
    con.query(sql, [phone_number], (err, result) => {
        if (err) return res.json({ Status: false, Error: err.message });
        if (result.length > 0) {
            return res.json({ Status: true, Exists: true, Message: "Phone number exists", User: result[0] });
        } else {
            return res.json({ Status: true, Exists: false, Message: "Phone number does not exist" });
        }
    });
}; //yes

export const editProfile = (req, res) => {
    const sql = `
        UPDATE customers 
        SET email = ?, first_name = ?, last_name = ?
        WHERE customer_id = ?
    `;
    const values = [
        req.body.email,
        req.body.first_name,
        req.body.last_name,
        req.body.customer_id,
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: err.message });
        return res.json({ Status: true, AffectedRows: result.affectedRows });
    });
}; //yes
