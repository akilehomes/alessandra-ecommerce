const fs = require('fs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_kY8FswnQt1Xq@ep-noisy-moon-b5pya3n8-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function runSchema() {
  try {
    const client = await pool.connect();
    console.log('✓ Conectado ao Neon\n');

    // Ler schema
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    const statements = schema.split(';').filter(s => s.trim());

    console.log(`Executando ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        process.stdout.write(`  [${String(i+1).padStart(2)}/${statements.length}] ${preview}... `);
        await client.query(stmt);
        console.log('✓');
      } catch (err) {
        console.log('✗');
        console.error(`\n❌ ERRO no statement ${i+1}:`);
        console.error(`Query: ${stmt.substring(0, 150)}...`);
        console.error(`Erro: ${err.message}\n`);
        throw err;
      }
    }

    console.log('\n✅ TODAS AS TABELAS CRIADAS COM SUCESSO!');
    client.release();
  } catch (err) {
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
