// Aplica as migracoes em ordem, registrando o que ja foi aplicado.
// Uso:  node database/run-migrations.js            (mostra o alvo e o que seria aplicado)
//       node database/run-migrations.js --yes      (aplica)
// O alvo e o DATABASE_URL do ambiente (ou do backend/.env).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Ordem importa. Arquivos fora da lista foram descartados de proposito:
//  migration-add-auth.sql          (renomeia password, que ja e password_hash)
//  add-image-position.sql          (a coluna ja vem em migration-admin-users.sql)
//  migration-complete-features.sql (tabelas nao usadas; tax_rates duplicada)
//  migration-product-enhancements.sql (sintaxe MySQL)
//  schema-multi-region.sql         (nao idempotente; currency_rates duplicada)
const FILES = [
  'schema.sql',
  'migration-align-schema.sql',
  'migration-admin-users.sql',
  'migration-add-dimensions.sql',
  'migration-reviews.sql',
  'migration-variants.sql',
  'migration-wishlist.sql',
  'migration-shipping-taxes.sql',
  'migration-carts-defaults.sql',
  'migration-orders-shipping-address.sql',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL nao definido');
  const apply = process.argv.includes('--yes');
  const host = new URL(url).host;
  console.log(`Alvo: ${host}`);

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  if (apply) {
    await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW())`);
  }
  const exists = (await pool.query("SELECT to_regclass('public.schema_migrations') AS t")).rows[0].t;
  const done = new Set(exists ? (await pool.query('SELECT name FROM schema_migrations')).rows.map(r => r.name) : []);

  let failed = 0;
  for (const name of FILES) {
    if (done.has(name)) { console.log(`= ${name} (ja aplicada)`); continue; }
    if (!apply) { console.log(`- ${name} (pendente)`); continue; }
    const sql = fs.readFileSync(path.join(__dirname, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      console.log(`✓ ${name}`);
    } catch (err) {
      failed++;
      try { await client.query('ROLLBACK'); } catch (e) { /* ignora */ }
      console.log(`✗ ${name}: ${err.message}`);
    } finally {
      client.release();
    }
  }
  await pool.end();
  if (!apply) console.log('\nNada foi alterado. Use --yes para aplicar.');
  if (failed) process.exitCode = 1;
}

main().catch(e => { console.error(e.message); process.exit(1); });
