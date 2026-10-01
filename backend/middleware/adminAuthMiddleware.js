const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Cache curto para nao consultar o banco em toda requisicao do painel
const CACHE_TTL_MS = 30 * 1000;
const activeCache = new Map(); // adminId -> { active, at }

async function isAdminActive(adminId) {
  const cached = activeCache.get(adminId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.active;

  const result = await pool.query('SELECT is_active FROM admin_users WHERE id = $1', [adminId]);
  const active = result.rows.length > 0 && result.rows[0].is_active === true;
  if (activeCache.size > 1000) activeCache.clear();
  activeCache.set(adminId, { active, at: Date.now() });
  return active;
}

// Exige token de admin valido E um admin que ainda existe e esta ativo
const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!decoded.isAdmin || !decoded.adminId) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      if (!(await isAdminActive(decoded.adminId))) {
        return res.status(401).json({ error: 'Admin account is not active' });
      }
      req.admin = decoded;
      next();
    } catch (error) {
      console.error('Admin auth error:', error.message);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
};

module.exports = adminAuthMiddleware;
