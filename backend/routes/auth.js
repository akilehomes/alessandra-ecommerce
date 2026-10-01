const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const { sendPasswordReset } = require('../services/emailService');

const JWT_EXPIRATION = '30d';
const BCRYPT_ROUNDS = 10;

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone, created_at',
      [email.toLowerCase(), hashedPassword, name, phone || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ---- Recuperacao de senha ----
const RESET_TTL_MINUTES = 60;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Limite simples em memoria: 5 pedidos por IP+e-mail a cada 15 minutos
const resetAttempts = new Map();
const tooManyResets = (key) => {
  const now = Date.now();
  const recent = (resetAttempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  recent.push(now);
  resetAttempts.set(key, recent);
  return recent.length > 5;
};

// POST /api/auth/forgot-password
// A resposta e sempre a mesma, exista ou nao a conta (nao revela quais e-mails estao cadastrados)
router.post('/forgot-password', async (req, res) => {
  const generic = { message: 'If this email is registered, you will receive instructions shortly.' };
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const normalized = email.toLowerCase();
    if (tooManyResets(`${req.ip}|${normalized}`)) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }

    const result = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [normalized]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = crypto.randomBytes(32).toString('hex');

      // Guarda so o hash do token; o token em si vai apenas no e-mail
      await pool.query(
        `UPDATE users
         SET password_reset_token = $1,
             password_reset_expiry = NOW() + ($2 || ' minutes')::interval
         WHERE id = $3`,
        [sha256(token), String(RESET_TTL_MINUTES), user.id]
      );

      const resetUrl = `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/reset-password?token=${token}`;
      if (process.env.LOG_RESET_LINKS === 'true') {
        console.log('[DEV] Link de redefinicao:', resetUrl); // somente dev
      }
      await sendPasswordReset(user.email, user.name, resetUrl);
    }

    res.json(generic);
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.json(generic);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expiry = NULL,
           failed_login_attempts = 0,
           account_locked = false,
           updated_at = NOW()
       WHERE password_reset_token = $2 AND password_reset_expiry > NOW()
       RETURNING id`,
      [passwordHash, sha256(token)]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: 'Could not reset password' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3 RETURNING id, email, name, phone',
      [name || null, phone || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/logout (client-side, but here for completeness)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
