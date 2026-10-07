const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authMiddleware = require('../middleware/authMiddleware');
const { normalizeAddress } = require('../services/addressService');

const MAX_ADDRESSES = 10;
const KINDS = ['shipping', 'billing'];
const COLUMNS = 'id, kind, label, recipient_name, phone, country, postal_code, street, number, complement, district, city, state, is_default';

// Todas as rotas exigem login e so enxergam enderecos do proprio cliente
router.use(authMiddleware);

// GET /api/addresses
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List addresses error:', error.message);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Valida o corpo; devolve { values } ou { error }
function parse(body) {
  const kind = body.kind === undefined ? 'shipping' : body.kind;
  if (!KINDS.includes(kind)) return { error: 'Invalid address type' };
  const { address, error } = normalizeAddress(body, { requireRecipient: true });
  if (error) return { error };
  const label = String(body.label ?? '').trim().slice(0, 60) || null;
  return { values: { ...address, kind, label, is_default: body.is_default === true } };
}

// Garante um unico endereco padrao por tipo
async function makeDefault(client, userId, kind, id) {
  await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1 AND kind = $2 AND id <> $3', [userId, kind, id]);
  await client.query('UPDATE addresses SET is_default = true WHERE id = $1', [id]);
}

// POST /api/addresses
router.post('/', async (req, res) => {
  const { values, error } = parse(req.body || {});
  if (error) return res.status(400).json({ error });
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const count = Number((await client.query('SELECT COUNT(*) FROM addresses WHERE user_id = $1', [userId])).rows[0].count);
    if (count >= MAX_ADDRESSES) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses` });
    }
    const hasSameKind = Number((await client.query('SELECT COUNT(*) FROM addresses WHERE user_id = $1 AND kind = $2', [userId, values.kind])).rows[0].count) > 0;
    const inserted = await client.query(
      `INSERT INTO addresses (user_id, kind, label, recipient_name, phone, country, postal_code, street, number, complement, district, city, state, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false) RETURNING id`,
      [userId, values.kind, values.label, values.recipient_name, values.phone, values.country, values.postal_code,
       values.street, values.number, values.complement, values.district, values.city, values.state]
    );
    // O primeiro endereco de cada tipo ja nasce como padrao
    if (values.is_default || !hasSameKind) await makeDefault(client, userId, values.kind, inserted.rows[0].id);
    await client.query('COMMIT');
    const row = (await pool.query(`SELECT ${COLUMNS} FROM addresses WHERE id = $1`, [inserted.rows[0].id])).rows[0];
    res.status(201).json(row);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create address error:', e.message);
    res.status(500).json({ error: 'Failed to save address' });
  } finally {
    client.release();
  }
});

// PUT /api/addresses/:id
router.put('/:id', async (req, res) => {
  const { values, error } = parse(req.body || {});
  if (error) return res.status(400).json({ error });
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE addresses SET kind=$3, label=$4, recipient_name=$5, phone=$6, country=$7, postal_code=$8, street=$9,
              number=$10, complement=$11, district=$12, city=$13, state=$14, updated_at=NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, userId, values.kind, values.label, values.recipient_name, values.phone, values.country,
       values.postal_code, values.street, values.number, values.complement, values.district, values.city, values.state]
    );
    if (updated.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Address not found' });
    }
    if (values.is_default) await makeDefault(client, userId, values.kind, req.params.id);
    await client.query('COMMIT');
    const row = (await pool.query(`SELECT ${COLUMNS} FROM addresses WHERE id = $1`, [req.params.id])).rows[0];
    res.json(row);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (/invalid input syntax for type uuid/.test(e.message)) return res.status(404).json({ error: 'Address not found' });
    console.error('Update address error:', e.message);
    res.status(500).json({ error: 'Failed to save address' });
  } finally {
    client.release();
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING kind, is_default',
      [req.params.id, req.user.userId]
    );
    if (deleted.rows.length === 0) return res.status(404).json({ error: 'Address not found' });
    // Se apagou o padrao, o mais recente do mesmo tipo assume
    if (deleted.rows[0].is_default) {
      await pool.query(
        `UPDATE addresses SET is_default = true WHERE id = (
           SELECT id FROM addresses WHERE user_id = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 1)`,
        [req.user.userId, deleted.rows[0].kind]
      );
    }
    res.json({ message: 'Address removed' });
  } catch (error) {
    if (/invalid input syntax for type uuid/.test(error.message)) return res.status(404).json({ error: 'Address not found' });
    console.error('Delete address error:', error.message);
    res.status(500).json({ error: 'Failed to remove address' });
  }
});

module.exports = router;
