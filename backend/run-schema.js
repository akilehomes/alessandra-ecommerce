const fs = require('fs');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL;

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
