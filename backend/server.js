require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Webhooks precisam do corpo bruto para validar a assinatura: antes do express.json()
app.use('/webhooks', require('./routes/webhooks'));

// Middleware
app.use(cors());
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
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/shipping-integration', require('./routes/shippingIntegration'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/taxes', require('./routes/taxes'));
app.use('/api/currency', require('./routes/currency'));
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
