const fs = require('fs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_kY8FswnQt1Xq@ep-noisy-moon-b5pya3n8-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function runSchema() {
  try {
    console.log('Conectando ao banco Neon...');
    const client = await pool.connect();

    console.log('✓ Conectado! Testando conexão...');
    const res = await client.query('SELECT NOW()');
    console.log('✓ Banco respondeu:', res.rows[0]);

    console.log('\nCriando tabelas...');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');

    // Split por ; e execute um por um
    const statements = schema.split(';').filter(s => s.trim());
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        console.log(`  [${i+1}/${statements.length}] Executando...`);
        await client.query(stmt);
      }
    }

    console.log('\n✅ BANCO CRIADO COM SUCESSO!');
    console.log('Tabelas prontas para usar!\n');

    client.release();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
