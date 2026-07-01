const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication format invalid. Use Bearer <token>.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finbuddy_secret_key_2026_jwt_token_12345');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or has expired.' });
  }
};

module.exports = authMiddleware;
