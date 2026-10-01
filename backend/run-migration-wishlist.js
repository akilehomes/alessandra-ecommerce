const fs = require('fs');
const path = require('path');
const { pool } = require('./server');

async function runMigration() {
  try {
    console.log('🚀 Running wishlist migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migration-wishlist.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    console.log('✅ Wishlist migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
