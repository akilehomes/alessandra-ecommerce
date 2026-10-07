require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Atras de proxies (Railway): quantos saltos confiar para achar o IP real do visitante.
// Se for baixo demais, o IP muda a cada requisicao e os limites nunca acumulam;
// se for alto demais, o visitante consegue forjar o IP. Ajuste com TRUST_PROXY_HOPS.
const hops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '2', 10);
app.set('trust proxy', Number.isInteger(hops) && hops >= 0 ? hops : 2);

// Diagnostico opcional (ALLOW_IP_DEBUG=true): mostra o IP que o servidor enxerga. Deixe desligado.
if (process.env.ALLOW_IP_DEBUG === 'true') {
  app.get('/api/_ip', (req, res) => {
    res.json({
      ip: req.ip,
      hops: app.get('trust proxy'),
      xForwardedFor: req.headers['x-forwarded-for'] || null,
      xRealIp: req.headers['x-real-ip'] || null,
      remote: req.socket.remoteAddress,
    });
  });
}

// Webhooks precisam do corpo bruto para validar a assinatura: antes do express.json()
app.use('/webhooks', require('./routes/webhooks'));

// CORS: so o site (FRONTEND_URL, com e sem www) pode chamar a API pelo navegador.
// Chamadas sem Origin (webhooks, servidor a servidor) continuam permitidas.
const allowedOrigins = new Set();
try {
  const front = new URL(process.env.FRONTEND_URL);
  allowedOrigins.add(front.origin);
  const alt = front.hostname.startsWith('www.') ? front.hostname.slice(4) : `www.${front.hostname}`;
  allowedOrigins.add(`${front.protocol}//${alt}${front.port ? `:${front.port}` : ''}`);
} catch (e) {
  /* FRONTEND_URL ausente ou invalida: libera todas as origens (comportamento anterior) */
}

const rateLimit = require('./middleware/rateLimit');

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const path = require('path');
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectionString = process.env.DATABASE_URL || (process.env.NODE_ENV !== 'production' ? `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'alessandra_ecommerce'}` : null);

if (!connectionString) {
  console.error('❌ DATABASE_URL is required in production');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ...(process.env.NODE_ENV === 'production' && { ssl: { rejectUnauthorized: false } })
});

// Export BEFORE requiring routes to avoid circular dependency
module.exports = { app, pool };

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected');
  }
});

// Routes (after export to avoid circular deps)
app.use('/api/upload', require('./routes/upload'));
app.use('/api/media', require('./routes/media'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/shipping-integration', require('./routes/shippingIntegration'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/taxes', require('./routes/taxes'));
app.use('/api/currency', require('./routes/currency'));
const emailKey = (req) => `${req.ip}|${String((req.body && req.body.email) || '').toLowerCase()}`;
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, key: emailKey, message: 'Too many login attempts. Try again in a few minutes.' }));
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 8, key: emailKey, message: 'Too many login attempts. Try again in a few minutes.' }));
app.use('/api/admin/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, key: emailKey, message: 'Too many requests. Try again later.' }));
app.use('/api/admin/reset-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts. Try again later.' }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many sign-ups from this address. Try again later.' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/search', require('./routes/search'));
app.use('/api/variants', require('./routes/variants'));
app.use('/api/coupons', require('./routes/coupons'));

// Quem abrir o dominio da API fora de /api e /webhooks vai para o site
if (process.env.FRONTEND_URL) {
  const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, '');
  let frontendHost = '';
  try { frontendHost = new URL(frontendUrl).host; } catch (e) { /* URL invalida: nao redireciona */ }
  app.use((req, res, next) => {
    if (!frontendHost || req.headers.host === frontendHost) return next(); // evita loop
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      return next();
    }
    res.redirect(301, frontendUrl + req.originalUrl);
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Alessandra E-commerce API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
