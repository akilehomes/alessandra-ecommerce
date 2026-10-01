const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/media/:id  (publico): serve a foto guardada no banco, com cache longo
router.get('/:id', async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(404).end();
    const result = await pool.query('SELECT content_type, data FROM product_media WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).end();

    const { content_type: contentType, data } = result.rows[0];
    res.set({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=31536000, immutable', // o id nunca muda de conteudo
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(data);
  } catch (error) {
    console.error('Media error:', error.message);
    res.status(500).end();
  }
});

module.exports = router;
