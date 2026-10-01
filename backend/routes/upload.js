const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MAX_BYTES = 3 * 1024 * 1024; // 3MB (o painel reduz a foto antes de enviar)

// Confere o conteudo real do arquivo, nao so o tipo informado pelo navegador
function detectImageType(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

// POST /api/upload/product  (somente admin)  campo: image
router.post('/product', adminAuthMiddleware, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      const tooBig = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({ error: tooBig ? 'Image is too large (max 3MB)' : 'Invalid upload' });
    }
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const type = detectImageType(req.file.buffer);
      if (!type) return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG and WebP are allowed' });

      const result = await pool.query(
        'INSERT INTO product_media (content_type, data, size_bytes) VALUES ($1, $2, $3) RETURNING id',
        [type, req.file.buffer, req.file.size]
      );

      const imageUrl = `${req.protocol}://${req.get('host')}/api/media/${result.rows[0].id}`;
      res.status(201).json({ success: true, imageUrl });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({ error: 'Could not save the image' });
    }
  });
});

module.exports = router;
