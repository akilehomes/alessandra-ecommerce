const fs = require('fs');
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_kY8FswnQt1Xq@ep-noisy-moon-b5pya3n8-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function setup() {
  const client = await pool.connect();

  try {
    console.log('🧹 Limpando banco...');
    await client.query(`DROP TABLE IF EXISTS admin_users CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS notification_preferences CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS coupons CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS shipping_tracking CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS quotations CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS stock_reservations CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS order_items CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS orders CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS cart_items CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS carts CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS product_variants CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS product_inventory CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    console.log('✓ Banco limpo\n');

    console.log('📝 Criando tabelas...');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    await client.query(schema);

    console.log('✅ BANCO CRIADO COM SUCESSO!\n');
    console.log('Pronto para rodar o servidor!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
