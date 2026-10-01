const fs = require('fs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_kY8FswnQt1Xq@ep-noisy-moon-b5pya3n8-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function runSchema() {
  try {
    console.log('Conectando ao banco Neon...');
    const client = await pool.connect();

    console.log('✓ Conectado! Rodando schema principal...');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    await client.query(schema);

    console.log('✓ Schema principal criado!');
    console.log('Rodando schema multi-região...');
    const schemaMulti = fs.readFileSync('./database/schema-multi-region.sql', 'utf8');
    await client.query(schemaMulti);

    console.log('✓ Schema multi-região criado!');
    console.log('\n✅ BANCO PRONTO PARA USO!');

    client.release();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
