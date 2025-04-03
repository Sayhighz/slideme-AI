import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'ไม่พบ Token' });
    }

    jwt.verify(token, 'jwt_secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
        }
        req.user = decoded;
        next();
    });
};

export { verifyToken };
