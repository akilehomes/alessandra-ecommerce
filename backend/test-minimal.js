const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Limpando...');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS cart_items CASCADE');
    await client.query('DROP TABLE IF EXISTS carts CASCADE');
    await client.query('DROP TABLE IF EXISTS products CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('Criando tabelas...');
    const schema = fs.readFileSync('./schema-minimal.sql', 'utf8');
    await client.query(schema);
    
    console.log('✅ SUCESSO!');
  } catch (err) {
    console.error('❌', err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
