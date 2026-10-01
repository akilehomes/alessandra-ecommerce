const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token', details: err.message });
      }

      if (!decoded.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.admin = decoded;
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = adminAuthMiddleware;
